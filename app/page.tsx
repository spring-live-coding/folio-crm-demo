"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ContactRound,
  Ellipsis,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  Mail,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Tabs,
  Toast,
  type Tone,
} from "@folio/ui";
import { useCrm } from "@/lib/use-crm";
import {
  contactsCsv,
  dateLabel,
  download,
  money,
  moveDeal,
  openDeals,
  parseDatabase,
  removeCompany,
  removeContact,
  stages,
  today,
  type Contact,
  type ContactStatus,
  type Database,
  type Stage,
  type Task,
} from "@/lib/model";
import { createSeed } from "@/lib/seed";
import { RecordForm, type Editor } from "./record-form";
import { DesignSystem } from "./design-system";
import { DealPage } from "./deal-page";
import { CloseDeal, type Outcome } from "./close-deal";
import { DealOutcome } from "./deal-won";
type View =
  | "Overview"
  | "Contacts"
  | "Companies"
  | "Pipeline"
  | "Tasks"
  | "Design system"
  | "Settings"
  | "Deal";
type DealScreen = "page" | "close" | "lost" | "won";
const dealScreens: DealScreen[] = ["page", "close", "lost", "won"];
const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Contacts", icon: Users },
  { name: "Companies", icon: Building2 },
  { name: "Pipeline", icon: LayoutGrid },
  { name: "Tasks", icon: ListTodo },
] as const;
const tone = (status: ContactStatus): Tone =>
  status === "Customer" ? "success" : status === "Partner" ? "info" : "warning";
export default function Home() {
  const { db, update, ready, storageError } = useCrm();
  const [view, setView] = useState<View>("Overview");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All contacts");
  const [sort, setSort] = useState("Name A–Z");
  const [taskFilter, setTaskFilter] = useState("Upcoming");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [dealId, setDealId] = useState<string | null>(null);
  const [dealScreen, setDealScreen] = useState<DealScreen>("page");
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    action: () => void;
  } | null>(null);
  const [importError, setImportError] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Hydrate the browser URL after the server render; subsequent changes use the subscription.
  useEffect(() => {
    const views: View[] = [
      "Overview",
      "Contacts",
      "Companies",
      "Pipeline",
      "Tasks",
      "Design system",
      "Settings",
    ];
    const apply = () => {
      const hash = decodeURIComponent(location.hash.slice(1));
      if (hash.startsWith("Deal/")) {
        const [id, screen = "page"] = hash.slice(5).split("/");
        setDealId(id);
        setDealScreen(
          dealScreens.includes(screen as DealScreen)
            ? (screen as DealScreen)
            : "page",
        );
        setView("Deal");
      } else if (views.includes(hash as View)) setView(hash as View);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  function go(next: View) {
    setView(next);
    setSearch("");
    location.hash = encodeURIComponent(next);
  }
  function openDeal(id: string, screen: DealScreen = "page") {
    setDealId(id);
    setDealScreen(screen);
    setView("Deal");
    setSearch("");
    history.pushState(
      null,
      "",
      screen === "page" ? `#Deal/${id}` : `#Deal/${id}/${screen}`,
    );
    try {
      window.scrollTo({ top: 0 });
    } catch {
      // jsdom has no scrolling; the browser does.
    }
  }
  function save(next: Database, message = "Changes saved") {
    update(next);
    setToast(message);
  }
  const companyName = (id: string) =>
    db.companies.find((c) => c.id === id)?.name ?? "Independent";
  const contactName = (id: string) =>
    db.contacts.find((c) => c.id === id)?.name ?? "No contact";
  const match = (...values: string[]) =>
    values.join(" ").toLowerCase().includes(search.toLowerCase().trim());
  const activeDeals = openDeals(db);
  const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const dueTasks = db.tasks.filter((t) => !t.done && t.due <= today());
  const visibleContacts = db.contacts
    .filter(
      (c) =>
        (filter === "All contacts" || c.status === filter) &&
        match(c.name, c.email, c.role, companyName(c.companyId)),
    )
    .sort((a, b) =>
      sort === "Name Z–A"
        ? b.name.localeCompare(a.name)
        : sort === "Company"
          ? companyName(a.companyId).localeCompare(companyName(b.companyId))
          : a.name.localeCompare(b.name),
    );
  const selectedContact = db.contacts.find((c) => c.id === detail);
  const selectedDeal = db.deals.find((d) => d.id === dealId);
  function toggleTask(task: Task) {
    save(
      {
        ...db,
        tasks: db.tasks.map((t) =>
          t.id === task.id
            ? task.done
              ? { ...t, done: false, completedAt: undefined }
              : { ...t, done: true, completedAt: today() }
            : t,
        ),
      },
      task.done ? "Task reopened" : "Task done, nice work",
    );
  }
  function deleteRecord() {
    if (!editor?.record) return;
    const { kind, record } = editor;
    setConfirmation({
      title: `Delete ${kind}?`,
      description:
        kind === "contact"
          ? "Deals and tasks will be kept, with this contact unlinked."
          : kind === "company"
            ? "Contacts and deals will be kept, with this company unlinked."
            : "This record will be permanently removed from this browser.",
      action: () => {
        const next =
          kind === "contact"
            ? removeContact(db, record.id)
            : kind === "company"
              ? removeCompany(db, record.id)
              : kind === "deal"
                ? { ...db, deals: db.deals.filter((d) => d.id !== record.id) }
                : { ...db, tasks: db.tasks.filter((t) => t.id !== record.id) };
        save(next, `${kind[0].toUpperCase() + kind.slice(1)} deleted`);
        setEditor(null);
        setDetail(null);
      },
    });
  }
  function contactTable(contacts: Contact[], compact = false) {
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Relationship</th>
              {!compact && <th>Email address</th>}
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <button
                    className="contact-name"
                    onClick={() => setDetail(c.id)}
                  >
                    <Avatar name={c.name} />
                    <span>
                      <strong>{c.name}</strong>
                      <small>{c.role || "No role added"}</small>
                    </span>
                  </button>
                </td>
                <td>
                  <span className="company-cell">
                    <span className="company-symbol">
                      {companyName(c.companyId).slice(0, 1)}
                    </span>
                    {companyName(c.companyId)}
                  </span>
                </td>
                <td>
                  <Badge tone={tone(c.status)}>{c.status}</Badge>
                </td>
                {!compact && (
                  <td>
                    <span className="muted">{c.email || "—"}</span>
                  </td>
                )}
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => setEditor({ kind: "contact", record: c })}
                  >
                    <Ellipsis size={17} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  function taskRow(t: Task) {
    return (
      <div className={`task-row ${t.done ? "is-done" : ""}`} key={t.id}>
        <button
          className="task-check"
          aria-label={`${t.done ? "Reopen" : "Complete"} ${t.title}`}
          aria-pressed={t.done}
          onClick={() => toggleTask(t)}
        >
          {t.done && <Check size={13} />}
        </button>
        <button
          className="task-text"
          onClick={() => setEditor({ kind: "task", record: t })}
        >
          <strong>{t.title}</strong>
          <small>
            {contactName(t.contactId)} <span>·</span>{" "}
            {t.due === today() ? "Today" : dateLabel(t.due)}
          </small>
        </button>
        {!t.done && t.due < today() ? (
          <Badge tone="danger">Overdue</Badge>
        ) : t.priority === "High" ? (
          <Badge tone="warning">High</Badge>
        ) : null}
      </div>
    );
  }
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="brand brand-button"
          onClick={() => go("Overview")}
          aria-label="Folio home"
        >
          <span className="brand-mark">f</span>folio
          <span className="brand-period">.</span>
        </button>
        <button className="workspace" onClick={() => go("Settings")}>
          <span className="workspace-icon">F</span>Folio workspace{" "}
          <ChevronRight size={14} />
        </button>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={
                view === name || (view === "Deal" && name === "Pipeline")
                  ? "active"
                  : ""
              }
              aria-current={view === name ? "page" : undefined}
              onClick={() => go(name)}
            >
              <Icon size={17} />
              {name}
              {name === "Tasks" && dueTasks.length > 0 && (
                <span className="nav-count">{dueTasks.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <nav aria-label="Workspace tools">
            <button
              onClick={() => go("Design system")}
              className={view === "Design system" ? "active" : ""}
            >
              <SlidersHorizontal size={17} />
              Design system
            </button>
            <button
              onClick={() => go("Settings")}
              className={view === "Settings" ? "active" : ""}
            >
              <Settings2 size={17} />
              Settings & data
            </button>
          </nav>
          <div className="sidebar-note">
            <span className="tiny-spark">
              <Sparkles size={16} />
            </span>
            <p>
              Good relationships.
              <br />
              Great work.
            </p>
            <small>A little care goes a long way.</small>
          </div>
          <div className="profile">
            <Avatar name="Alex Morgan" />
            <div>
              <strong>Alex Morgan</strong>
              <small>Personal workspace</small>
            </div>
            <Badge>Demo</Badge>
          </div>
        </div>
      </aside>
      <main className="main" id="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <ChevronRight size={12} />
            {view === "Deal" && selectedDeal ? (
              <>
                <button className="crumb-link" onClick={() => go("Pipeline")}>
                  Pipeline
                </button>
                <ChevronRight size={12} />
                {dealScreen === "page" ? (
                  <strong>{selectedDeal.name}</strong>
                ) : (
                  <>
                    <button
                      className="crumb-link"
                      onClick={() => openDeal(selectedDeal.id)}
                    >
                      {selectedDeal.name}
                    </button>
                    <ChevronRight size={12} />
                    <strong>
                      {dealScreen === "won"
                        ? selectedDeal.stage === "Lost"
                          ? "Lost"
                          : "Won"
                        : dealScreen === "lost"
                          ? "Mark as lost"
                          : "Close the deal"}
                    </strong>
                  </>
                )}
              </>
            ) : (
              <strong>{view}</strong>
            )}
          </div>
          <div className="topbar-right">
            <label className="global-search">
              <Search size={15} />
              <input
                ref={searchRef}
                aria-label="Search contacts"
                placeholder="Find a contact…"
                value={view === "Contacts" ? search : ""}
                onChange={(e) => {
                  if (view !== "Contacts") {
                    setView("Contacts");
                    setFilter("All contacts");
                    location.hash = "Contacts";
                  }
                  setSearch(e.target.value);
                }}
              />
              <kbd>⌘ K</kbd>
            </label>
            <span className="saved-indicator">
              <span className={storageError ? "warning-dot" : "saved-dot"} />
              {storageError
                ? "Memory only"
                : ready
                  ? "Browser-local"
                  : "Loading"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              aria-label="About this workspace"
              onClick={() => go("Settings")}
            >
              <CircleHelp size={17} />
            </Button>
          </div>
        </header>
        <div className="content">
          {storageError && (
            <div className="storage-warning" role="alert">
              {storageError}{" "}
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  download(
                    JSON.stringify(db, null, 2),
                    "folio-backup.json",
                    "application/json",
                  )
                }
              >
                Download backup
              </Button>
            </div>
          )}
          {!ready ? (
            <Card className="section-card" role="status">
              Opening your workspace…
            </Card>
          ) : (
            <>
              {view === "Overview" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">SMALL STEPS, STRONG RELATIONSHIPS</p>
                      <h1>Good things start with curious minds.</h1>
                      <p className="muted">
                        One clear next step for every relationship.
                      </p>
                    </div>
                    <Button onClick={() => setEditor({ kind: "contact" })}>
                      <Plus size={16} />
                      New contact
                    </Button>
                  </div>
                  <div className="metrics">
                    {[
                      {
                        label: "Open pipeline",
                        value: money(pipelineValue),
                        note: `Across ${activeDeals.length} active opportunities`,
                        icon: TrendingUp,
                      },
                      {
                        label: "Total contacts",
                        value: db.contacts.length,
                        note: `${db.contacts.filter((c) => c.status === "Customer").length} customers in your corner`,
                        icon: Users,
                      },
                      {
                        label: "Companies",
                        value: db.companies.length,
                        note: "Connections worth growing",
                        icon: Building2,
                      },
                      {
                        label: "Follow-ups due",
                        value: dueTasks.length,
                        note: dueTasks.length
                          ? "A small hello can go a long way"
                          : "You’re all caught up",
                        icon: CheckCircle2,
                      },
                    ].map(({ label, value, note, icon: Icon }) => (
                      <Card className="metric" key={label}>
                        <div className="metric-top">
                          <p>{label}</p>
                          <Icon size={16} />
                        </div>
                        <strong>{value}</strong>
                        <small>{note}</small>
                      </Card>
                    ))}
                  </div>
                  <div className="overview-upper">
                    <Card className="section-card pipeline-summary">
                      <div className="section-heading">
                        <div>
                          <h2>A healthy pipeline starts here</h2>
                          <p className="muted">
                            Every conversation is a step forward.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => go("Pipeline")}
                        >
                          Open pipeline <ArrowUpRight size={14} />
                        </Button>
                      </div>
                      <div
                        className="pipeline-bar"
                        aria-label="Open deal values by stage"
                      >
                        {stages.slice(0, 4).map((s, i) => {
                          const value = activeDeals
                            .filter((d) => d.stage === s)
                            .reduce((v, d) => v + d.value, 0);
                          return (
                            <div
                              key={s}
                              className={`stage-fill stage-fill-${i}`}
                              style={{ flexGrow: value || 0.01 }}
                              title={`${s}: ${money(value)}`}
                            />
                          );
                        })}
                      </div>
                      <div className="pipeline-legend">
                        {stages.slice(0, 4).map((s, i) => (
                          <div key={s}>
                            <span className={`legend-dot stage-fill-${i}`} />
                            <span>
                              {s}
                              <strong>
                                {money(
                                  activeDeals
                                    .filter((d) => d.stage === s)
                                    .reduce((v, d) => v + d.value, 0),
                                )}
                              </strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="welcome-card">
                      <p className="eyebrow">MAKE SPACE FOR CONNECTION</p>
                      <h2>
                        Your next opportunity
                        <br />
                        starts with a hello.
                      </h2>
                      <p>A thoughtful follow-up can make all the difference.</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => go("Tasks")}
                      >
                        Make your next move today <ArrowUpRight size={14} />
                      </Button>
                      <div className="orbit" aria-hidden="true">
                        <span>f.</span>
                      </div>
                    </Card>
                  </div>
                  <div className="overview-lower">
                    <Card className="relationships">
                      <div className="section-heading">
                        <div>
                          <h2>People to keep close</h2>
                          <p className="muted">
                            Your latest relationships, all in one place.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => go("Contacts")}
                        >
                          View all <ArrowUpRight size={14} />
                        </Button>
                      </div>
                      {db.contacts.length ? (
                        contactTable(db.contacts.slice(0, 5), true)
                      ) : (
                        <EmptyState
                          title="Your story starts here"
                          description="Add your first contact to start building relationships."
                          action={
                            <Button
                              onClick={() => setEditor({ kind: "contact" })}
                            >
                              Add contact
                            </Button>
                          }
                        />
                      )}
                    </Card>
                    <Card className="section-card today-card">
                      <div className="section-heading">
                        <div>
                          <h2>
                            Your next steps{" "}
                            <span className="count-inline">
                              {dueTasks.length}
                            </span>
                          </h2>
                          <p className="muted">
                            A little progress goes a long way.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Add task"
                          onClick={() => setEditor({ kind: "task" })}
                        >
                          <Plus size={17} />
                        </Button>
                      </div>
                      {dueTasks.length ? (
                        dueTasks.slice(0, 4).map(taskRow)
                      ) : (
                        <EmptyState
                          title="All caught up"
                          description="A little breathing room. Nice work."
                        />
                      )}
                      <div className="card-footer-link">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => go("Tasks")}
                        >
                          See all tasks <ArrowUpRight size={14} />
                        </Button>
                      </div>
                    </Card>
                  </div>
                  <div className="page-footer">
                    <span>
                      <span className="saved-dot" />
                      Your workspace, at your pace.
                    </span>
                    <span>Made for meaningful connections.</span>
                  </div>
                </>
              )}
              {view === "Contacts" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">PEOPLE FIRST, ALWAYS</p>
                      <h1>A home for your relationships.</h1>
                      <p className="muted">
                        Remember the details. Make every conversation count.
                      </p>
                    </div>
                    <div className="button-row">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          download(
                            contactsCsv({ ...db, contacts: visibleContacts }),
                            "folio-contacts.csv",
                            "text/csv;charset=utf-8",
                          );
                          setToast("Contacts exported");
                        }}
                      >
                        <ArrowDownToLine size={15} />
                        Export
                      </Button>
                      <Button onClick={() => setEditor({ kind: "contact" })}>
                        <Plus size={16} />
                        Add contact
                      </Button>
                    </div>
                  </div>
                  <Tabs
                    label="Contact relationships"
                    value={filter}
                    onChange={setFilter}
                    items={[
                      {
                        value: "All contacts",
                        label: "All contacts",
                        count: db.contacts.length,
                      },
                      ...(["Customer", "Prospect", "Partner"] as const).map(
                        (s) => ({
                          value: s,
                          label: s + "s",
                          count: db.contacts.filter((c) => c.status === s)
                            .length,
                        }),
                      ),
                    ]}
                  />
                  <div className="list-toolbar">
                    <label className="search-control">
                      <Search size={16} />
                      <Input
                        aria-label="Filter contacts"
                        placeholder="Search name, company, or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {search && (
                        <button
                          aria-label="Clear search"
                          onClick={() => setSearch("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                    <Select
                      aria-label="Sort contacts"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option>Name A–Z</option>
                      <option>Name Z–A</option>
                      <option>Company</option>
                    </Select>
                  </div>
                  <Card>
                    {visibleContacts.length ? (
                      contactTable(visibleContacts)
                    ) : (
                      <EmptyState
                        title="No contacts found"
                        description="Try another search or add a new relationship."
                        action={
                          <Button
                            onClick={() => setEditor({ kind: "contact" })}
                          >
                            Add contact
                          </Button>
                        }
                      />
                    )}
                    <div className="table-footer">
                      {visibleContacts.length} of {db.contacts.length} contacts{" "}
                      <span>All your people. One thoughtful place.</span>
                    </div>
                  </Card>
                </>
              )}
              {view === "Companies" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">THE TEAMS BEHIND THE PEOPLE</p>
                      <h1>Good company to keep.</h1>
                      <p className="muted">
                        See the whole relationship, beyond a single contact.
                      </p>
                    </div>
                    <Button onClick={() => setEditor({ kind: "company" })}>
                      <Plus size={16} />
                      Add company
                    </Button>
                  </div>
                  <div className="list-toolbar">
                    <label className="search-control">
                      <Search size={16} />
                      <Input
                        aria-label="Search companies"
                        placeholder="Find a company…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="company-grid">
                    {db.companies
                      .filter((c) => match(c.name, c.industry))
                      .map((c) => (
                        <Card className="company-card" key={c.id}>
                          <div className="company-card-top">
                            <span className="company-logo">{c.name[0]}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Edit ${c.name}`}
                              onClick={() =>
                                setEditor({ kind: "company", record: c })
                              }
                            >
                              <Ellipsis size={18} />
                            </Button>
                          </div>
                          <h2>{c.name}</h2>
                          <p>{c.industry || "Industry not added"}</p>
                          <small>{c.website || "Website not added"}</small>
                          <div className="company-stats">
                            <span>
                              <Users size={14} />
                              {
                                db.contacts.filter((p) => p.companyId === c.id)
                                  .length
                              }{" "}
                              contacts
                            </span>
                            <strong>
                              {money(
                                activeDeals
                                  .filter((d) => d.companyId === c.id)
                                  .reduce((sum, d) => sum + d.value, 0),
                              )}
                              <small>open pipeline</small>
                            </strong>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              go("Contacts");
                              setSearch(c.name);
                              setFilter("All contacts");
                            }}
                          >
                            View contacts <ArrowUpRight size={14} />
                          </Button>
                        </Card>
                      ))}
                  </div>
                  {!db.companies.some((c) => match(c.name, c.industry)) && (
                    <EmptyState
                      title="No companies found"
                      description="Add a company or try a different search."
                      action={
                        <Button onClick={() => setEditor({ kind: "company" })}>
                          Add company
                        </Button>
                      }
                    />
                  )}
                </>
              )}
              {view === "Pipeline" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">FROM FIRST HELLO TO HANDSHAKE</p>
                      <h1>Make room for what’s next.</h1>
                      <p className="muted">
                        {money(pipelineValue)} in open opportunities. Move deals
                        with the stage selector.
                      </p>
                    </div>
                    <Button onClick={() => setEditor({ kind: "deal" })}>
                      <Plus size={16} />
                      Add deal
                    </Button>
                  </div>
                  <div className="list-toolbar">
                    <label className="search-control">
                      <Search size={16} />
                      <Input
                        aria-label="Search deals"
                        placeholder="Find a deal or company…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <span className="muted">{db.deals.length} total deals</span>
                  </div>
                  <div className="kanban">
                    {stages.map((stage, index) => {
                      const deals = db.deals.filter(
                        (d) =>
                          d.stage === stage &&
                          match(
                            d.name,
                            companyName(d.companyId),
                            contactName(d.contactId),
                          ),
                      );
                      return (
                        <section
                          className="kanban-column"
                          key={stage}
                          aria-label={`${stage} deals`}
                        >
                          <div className="kanban-heading">
                            <span
                              className={`legend-dot stage-fill-${index}`}
                            />
                            <h2>{stage}</h2>
                            <span className="count-inline">{deals.length}</span>
                          </div>
                          <p className="kanban-total">
                            {money(deals.reduce((sum, d) => sum + d.value, 0))}
                          </p>
                          {deals.map((d) => (
                            <Card className="deal-card" key={d.id}>
                              <button
                                className="deal-title"
                                onClick={() => openDeal(d.id)}
                              >
                                {d.name}
                                <ArrowUpRight size={13} />
                              </button>
                              <p>{companyName(d.companyId)}</p>
                              <strong className="deal-value">
                                {money(d.value)}
                              </strong>
                              <div className="deal-person">
                                <Avatar
                                  name={contactName(d.contactId)}
                                  size="sm"
                                />
                                <span>{contactName(d.contactId)}</span>
                              </div>
                              <div className="deal-date">
                                Expected {dateLabel(d.closeDate)}
                              </div>
                              <Select
                                aria-label={`Stage for ${d.name}`}
                                value={d.stage}
                                onChange={(e) =>
                                  save(
                                    {
                                      ...db,
                                      deals: db.deals.map((x) =>
                                        x.id === d.id
                                          ? {
                                              ...x,
                                              stage: e.target.value as Stage,
                                            }
                                          : x,
                                      ),
                                    },
                                    `Moved to ${e.target.value}`,
                                  )
                                }
                              >
                                {stages.map((s) => (
                                  <option key={s}>{s}</option>
                                ))}
                              </Select>
                            </Card>
                          ))}
                          {!deals.length && (
                            <div className="column-empty">
                              {search
                                ? "No matches"
                                : "Room for a new opportunity"}
                            </div>
                          )}
                        </section>
                      );
                    })}
                  </div>
                </>
              )}
              {view === "Tasks" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">THE LITTLE THINGS ADD UP</p>
                      <h1>Keep the conversation going.</h1>
                      <p className="muted">
                        A clear next step for every relationship.
                      </p>
                    </div>
                    <Button onClick={() => setEditor({ kind: "task" })}>
                      <Plus size={16} />
                      Add task
                    </Button>
                  </div>
                  <Tabs
                    label="Task views"
                    value={taskFilter}
                    onChange={setTaskFilter}
                    items={[
                      {
                        value: "Upcoming",
                        label: "Open",
                        count: db.tasks.filter((t) => !t.done).length,
                      },
                      {
                        value: "Today",
                        label: "Due now",
                        count: dueTasks.length,
                      },
                      {
                        value: "Completed",
                        label: "Completed",
                        count: db.tasks.filter((t) => t.done).length,
                      },
                    ]}
                  />
                  <div className="list-toolbar">
                    <label className="search-control">
                      <Search size={16} />
                      <Input
                        aria-label="Search tasks"
                        placeholder="Find a follow-up…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  <Card className="section-card task-list">
                    {(() => {
                      const tasks = db.tasks
                        .filter(
                          (t) =>
                            (taskFilter === "Completed"
                              ? t.done
                              : !t.done &&
                                (taskFilter !== "Today" || t.due <= today())) &&
                            match(t.title, contactName(t.contactId)),
                        )
                        .sort((a, b) => a.due.localeCompare(b.due));
                      return tasks.length ? (
                        tasks.map(taskRow)
                      ) : (
                        <EmptyState
                          title={
                            taskFilter === "Completed"
                              ? "Small wins will show up here"
                              : "A clear list. A clear mind."
                          }
                          description={
                            search
                              ? "Try a different search."
                              : "Add your next follow-up whenever you’re ready."
                          }
                          action={
                            <Button onClick={() => setEditor({ kind: "task" })}>
                              Add task
                            </Button>
                          }
                        />
                      );
                    })()}
                  </Card>
                </>
              )}
              {view === "Design system" && <DesignSystem />}
              {view === "Deal" &&
                (!selectedDeal ? (
                  <EmptyState
                    title="That deal isn’t here anymore"
                    description="It may have been deleted, or the link is out of date."
                    action={
                      <Button onClick={() => go("Pipeline")}>
                        Back to pipeline
                      </Button>
                    }
                  />
                ) : dealScreen === "won" &&
                  (selectedDeal.stage === "Won" ||
                    selectedDeal.stage === "Lost") ? (
                  <DealOutcome
                    deal={selectedDeal}
                    db={db}
                    onBackToPipeline={() => go("Pipeline")}
                    onOpenDeal={() => openDeal(selectedDeal.id)}
                    onOpenContact={setDetail}
                    taskRow={taskRow}
                  />
                ) : (dealScreen === "close" || dealScreen === "lost") &&
                  selectedDeal.stage !== "Won" &&
                  selectedDeal.stage !== "Lost" ? (
                  <CloseDeal
                    key={dealScreen}
                    deal={selectedDeal}
                    db={db}
                    outcome={dealScreen === "lost" ? "Lost" : "Won"}
                    onBack={() => openDeal(selectedDeal.id)}
                    onSwitchOutcome={(outcome: Outcome) =>
                      openDeal(
                        selectedDeal.id,
                        outcome === "Won" ? "close" : "lost",
                      )
                    }
                    onConfirm={({ value, closeDate, summary, followUps }) => {
                      const outcome: Stage =
                        dealScreen === "lost" ? "Lost" : "Won";
                      save(
                        moveDeal(db, selectedDeal.id, outcome, {
                          value,
                          closeDate,
                          summary,
                          followUps,
                        }),
                        outcome === "Won" ? "Won. Nicely done." : "Marked as lost",
                      );
                      openDeal(selectedDeal.id, "won");
                    }}
                  />
                ) : (
                  <DealPage
                    deal={selectedDeal}
                    db={db}
                    onBack={() => go("Pipeline")}
                    onEdit={() =>
                      setEditor({ kind: "deal", record: selectedDeal })
                    }
                    onMove={(stage) =>
                      save(
                        moveDeal(db, selectedDeal.id, stage),
                        `Moved to ${stage}`,
                      )
                    }
                    onClose={() => openDeal(selectedDeal.id, "close")}
                    onLost={() => openDeal(selectedDeal.id, "lost")}
                    onOutcome={() => openDeal(selectedDeal.id, "won")}
                    onOpenContact={setDetail}
                    onOpenDeal={openDeal}
                    onAddTask={() => setEditor({ kind: "task" })}
                    taskRow={taskRow}
                  />
                ))}
              {view === "Settings" && (
                <>
                  <div className="page-heading">
                    <div>
                      <p className="eyebrow">YOUR WORKSPACE, YOUR WAY</p>
                      <h1>A little housekeeping.</h1>
                      <p className="muted">
                        Keep your data close, and take it with you when you need
                        to.
                      </p>
                    </div>
                  </div>
                  <div className="settings-stack">
                    <Card className="section-card">
                      <div className="settings-icon">
                        <ContactRound size={22} />
                      </div>
                      <h2>A personal, browser-local workspace</h2>
                      <p className="settings-copy">
                        Folio is a frontend-only CRM. Your changes stay in this
                        browser on this device. There are no accounts, servers
                        storing your CRM data, or automatic cloud backups.
                        Clearing browser data removes your workspace. Alex
                        Morgan is a demo identity.
                      </p>
                      <Badge tone={storageError ? "warning" : "success"}>
                        {storageError
                          ? "Changes in memory only"
                          : "Local storage enabled"}
                      </Badge>
                    </Card>
                    <Card className="section-card">
                      <h2>Take your relationships with you</h2>
                      <p className="settings-copy">
                        Download a complete JSON backup, restore a previous
                        workspace, or export your contacts as a
                        spreadsheet-friendly CSV. Keep a backup before switching
                        browsers or devices.
                      </p>
                      <div className="button-row wrap">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            download(
                              JSON.stringify(db, null, 2),
                              `folio-backup-${today()}.json`,
                              "application/json",
                            )
                          }
                        >
                          <ArrowDownToLine size={15} />
                          Download backup
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setImportError("");
                            importRef.current?.click();
                          }}
                        >
                          <ArrowUpFromLine size={15} />
                          Restore backup
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            download(
                              contactsCsv(db),
                              "folio-contacts.csv",
                              "text/csv;charset=utf-8",
                            )
                          }
                        >
                          Export contacts
                        </Button>
                      </div>
                      <input
                        ref={importRef}
                        className="sr-only"
                        type="file"
                        accept=".json,application/json"
                        aria-label="Choose Folio backup"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          try {
                            if (file.size > 10 * 1024 * 1024)
                              throw new Error(
                                "Choose a backup smaller than 10 MB.",
                              );
                            const next = parseDatabase(await file.text());
                            setConfirmation({
                              title: "Replace this workspace?",
                              description: `Restore ${next.contacts.length} contacts, ${next.companies.length} companies, ${next.deals.length} deals, and ${next.tasks.length} tasks. Current data will be replaced. Download a backup first if you need to keep it.`,
                              action: () => save(next, "Backup restored"),
                            });
                          } catch (error) {
                            setImportError(
                              error instanceof Error
                                ? error.message
                                : "Could not read this backup.",
                            );
                          }
                        }}
                      />
                      {importError && (
                        <p className="form-error" role="alert">
                          {importError}
                        </p>
                      )}
                    </Card>
                    <Card className="section-card">
                      <h2>A fresh start</h2>
                      <p className="settings-copy">
                        Restore the original sample workspace, or clear every
                        record and start with your own relationships. Both
                        actions replace the data in this browser.
                      </p>
                      <div className="button-row wrap">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setConfirmation({
                              title: "Reset to sample data?",
                              description:
                                "This replaces all current records with the original examples. Download a backup first to keep your changes.",
                              action: () =>
                                save(createSeed(), "Sample workspace restored"),
                            })
                          }
                        >
                          Reset sample data
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            setConfirmation({
                              title: "Clear this workspace?",
                              description:
                                "All contacts, companies, deals, and tasks will be removed. Download a backup first to keep them.",
                              action: () =>
                                save(
                                  {
                                    version: 1,
                                    contacts: [],
                                    companies: [],
                                    deals: [],
                                    tasks: [],
                                  },
                                  "Workspace cleared",
                                ),
                            })
                          }
                        >
                          Clear all records
                        </Button>
                      </div>
                    </Card>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
      {selectedContact && !editor && (
        <Modal
          title="Relationship details"
          onClose={() => setDetail(null)}
          wide
        >
          <div className="contact-detail-heading">
            <Avatar name={selectedContact.name} size="lg" />
            <div>
              <h2>{selectedContact.name}</h2>
              <p>
                {selectedContact.role} ·{" "}
                {companyName(selectedContact.companyId)}
              </p>
            </div>
            <Badge tone={tone(selectedContact.status)}>
              {selectedContact.status}
            </Badge>
          </div>
          <div className="detail-email">
            <Mail size={16} />
            {selectedContact.email ? (
              <a href={`mailto:${selectedContact.email}`}>
                {selectedContact.email}
              </a>
            ) : (
              <span className="muted">No email added</span>
            )}
          </div>
          <h3 className="detail-label">Worth remembering</h3>
          <p className="detail-notes">
            {selectedContact.notes ||
              "No notes yet. Add the details that make the next conversation more personal."}
          </p>
          <h3 className="detail-label">Related opportunities</h3>
          {db.deals
            .filter((d) => d.contactId === selectedContact.id)
            .map((d) => (
              <div className="detail-deal" key={d.id}>
                <span>
                  {d.name}
                  <small>{d.stage}</small>
                </span>
                <strong>{money(d.value)}</strong>
              </div>
            ))}
          {!db.deals.some((d) => d.contactId === selectedContact.id) && (
            <p className="muted">No opportunities linked yet.</p>
          )}
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setDetail(null)}>
              Close
            </Button>
            <Button
              onClick={() =>
                setEditor({ kind: "contact", record: selectedContact })
              }
            >
              Edit contact
            </Button>
          </div>
        </Modal>
      )}
      {editor && (
        <RecordForm
          editor={editor}
          db={db}
          onClose={() => setEditor(null)}
          onSave={(next) => {
            save(
              next,
              editor.record
                ? "Changes saved"
                : `${editor.kind[0].toUpperCase() + editor.kind.slice(1)} created`,
            );
            setEditor(null);
          }}
          onDelete={deleteRecord}
        />
      )}
      {confirmation && (
        <Modal title={confirmation.title} onClose={() => setConfirmation(null)}>
          <p className="muted">{confirmation.description}</p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setConfirmation(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                confirmation.action();
                setConfirmation(null);
              }}
            >
              Confirm
            </Button>
          </div>
        </Modal>
      )}
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}
