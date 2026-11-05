export const stages = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type Stage = (typeof stages)[number];
export type ContactStatus = "Customer" | "Prospect" | "Partner";
export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
}
export interface Contact {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  status: ContactStatus;
  notes: string;
}
export const dealEventKinds = [
  "created",
  "stage",
  "note",
  "meeting",
  "email",
] as const;
export type DealEventKind = (typeof dealEventKinds)[number];
export interface DealEvent {
  at: string;
  kind: DealEventKind;
  from?: Stage;
  to?: Stage;
  text?: string;
}
export interface Deal {
  id: string;
  name: string;
  companyId: string;
  contactId: string;
  value: number;
  stage: Stage;
  closeDate: string;
  summary?: string;
  createdAt?: string;
  history?: DealEvent[];
}
export interface Task {
  id: string;
  title: string;
  contactId: string;
  due: string;
  done: boolean;
  priority: "Normal" | "High";
  completedAt?: string;
}
export interface Database {
  version: 1;
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  tasks: Task[];
}
export const STORAGE_KEY = "folio.crm.v1";
export function today() {
  return localDate(new Date());
}
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function offsetDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
export function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
export function openDeals(db: Database) {
  return db.deals.filter((d) => d.stage !== "Won" && d.stage !== "Lost");
}
export function removeContact(db: Database, id: string): Database {
  return {
    ...db,
    contacts: db.contacts.filter((c) => c.id !== id),
    deals: db.deals.map((d) =>
      d.contactId === id ? { ...d, contactId: "" } : d,
    ),
    tasks: db.tasks.map((t) =>
      t.contactId === id ? { ...t, contactId: "" } : t,
    ),
  };
}
export function removeCompany(db: Database, id: string): Database {
  return {
    ...db,
    companies: db.companies.filter((c) => c.id !== id),
    contacts: db.contacts.map((c) =>
      c.companyId === id ? { ...c, companyId: "" } : c,
    ),
    deals: db.deals.map((d) =>
      d.companyId === id ? { ...d, companyId: "" } : d,
    ),
  };
}
const text = (x: unknown): x is string =>
  typeof x === "string" && x.length <= 100000;
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const date = (x: unknown) =>
  text(x) &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  !Number.isNaN(Date.parse(x)) &&
  new Date(`${x}T12:00:00Z`).toISOString().slice(0, 10) === x;
function validHistory(value: unknown) {
  return (
    Array.isArray(value) &&
    value.length <= 500 &&
    value.every(
      (e) =>
        record(e) &&
        date(e.at) &&
        dealEventKinds.includes(e.kind as DealEventKind) &&
        (e.from === undefined || stages.includes(e.from as Stage)) &&
        (e.to === undefined || stages.includes(e.to as Stage)) &&
        (e.text === undefined || text(e.text)),
    )
  );
}
export function parseDatabase(raw: string): Database {
  const db: unknown = JSON.parse(raw);
  if (!record(db) || db.version !== 1)
    throw new Error(
      "Unsupported backup format. Choose a Folio v1 JSON backup.",
    );
  for (const key of ["companies", "contacts", "deals", "tasks"]) {
    const rows = db[key];
    if (
      !Array.isArray(rows) ||
      rows.length > 50000 ||
      rows.some((r) => !record(r) || !text(r.id) || !r.id) ||
      new Set(rows.map((r) => r.id)).size !== rows.length
    )
      throw new Error(`Invalid ${key} records.`);
  }
  const companies = db.companies as Record<string, unknown>[];
  const contacts = db.contacts as Record<string, unknown>[];
  const deals = db.deals as Record<string, unknown>[];
  const tasks = db.tasks as Record<string, unknown>[];
  const hasCompany = (id: unknown) =>
    text(id) && (id === "" || companies.some((c) => c.id === id));
  const hasContact = (id: unknown) =>
    text(id) && (id === "" || contacts.some((c) => c.id === id));
  if (
    companies.some(
      (c) =>
        !text(c.name) ||
        !c.name.trim() ||
        !text(c.industry) ||
        !text(c.website),
    )
  )
    throw new Error("Invalid company details.");
  if (
    contacts.some(
      (c) =>
        !text(c.name) ||
        !c.name.trim() ||
        !text(c.email) ||
        !text(c.role) ||
        !text(c.notes) ||
        !["Customer", "Prospect", "Partner"].includes(c.status as string) ||
        !hasCompany(c.companyId),
    )
  )
    throw new Error("Invalid contact details or company references.");
  if (
    deals.some(
      (d) =>
        !text(d.name) ||
        !d.name.trim() ||
        typeof d.value !== "number" ||
        !Number.isFinite(d.value) ||
        d.value < 0 ||
        !stages.includes(d.stage as Stage) ||
        !date(d.closeDate) ||
        !hasCompany(d.companyId) ||
        !hasContact(d.contactId) ||
        (d.summary !== undefined && !text(d.summary)) ||
        (d.createdAt !== undefined && !date(d.createdAt)) ||
        (d.history !== undefined && !validHistory(d.history)),
    )
  )
    throw new Error("Invalid deal details or references.");
  if (
    tasks.some(
      (t) =>
        !text(t.title) ||
        !t.title.trim() ||
        typeof t.done !== "boolean" ||
        !["Normal", "High"].includes(t.priority as string) ||
        !date(t.due) ||
        !hasContact(t.contactId) ||
        (t.completedAt !== undefined && !date(t.completedAt)),
    )
  )
    throw new Error("Invalid task details or references.");
  return db as unknown as Database;
}
export function contactsCsv(db: Database) {
  const cell = (value: string) =>
    '"' +
    (/^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value).replaceAll(
      '"',
      '""',
    ) +
    '"';
  return [
    ["Name", "Email", "Role", "Company", "Status", "Notes"],
    ...db.contacts.map((c) => [
      c.name,
      c.email,
      c.role,
      db.companies.find((co) => co.id === c.companyId)?.name ?? "",
      c.status,
      c.notes,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const activeStages = stages.slice(0, 5) as readonly Stage[];
export function stageIndex(stage: Stage) {
  return stages.indexOf(stage);
}
export function nextStage(stage: Stage): Stage | null {
  const index = activeStages.indexOf(stage);
  return index === -1 || index === activeStages.length - 1
    ? null
    : activeStages[index + 1];
}
export function daysUntil(value: string) {
  const target = new Date(`${value}T12:00:00`);
  const now = new Date(`${today()}T12:00:00`);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}
export function closeLabel(value: string) {
  const days = daysUntil(value);
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} past close`;
  return `${days} days to close`;
}
export type FollowUp = Omit<Task, "id" | "done">;
export function moveDeal(
  db: Database,
  id: string,
  stage: Stage,
  options: {
    followUps?: FollowUp[];
    value?: number;
    closeDate?: string;
    summary?: string;
  } = {},
): Database {
  const closed = stage === "Won" || stage === "Lost";
  const stamp = Date.now().toString(36);
  return {
    ...db,
    deals: db.deals.map((d) =>
      d.id === id
        ? {
            ...d,
            stage,
            value: options.value ?? d.value,
            closeDate: options.closeDate ?? (closed ? today() : d.closeDate),
            summary: options.summary ?? d.summary,
            history: [
              ...(d.history ?? []),
              { at: today(), kind: "stage", from: d.stage, to: stage },
            ],
          }
        : d,
    ),
    tasks: [
      ...db.tasks,
      ...(options.followUps ?? []).map((f, index) => ({
        ...f,
        id: `t${stamp}${index}`,
        done: false,
      })),
    ],
  };
}
export function suggestedFollowUps(
  deal: Deal,
  contactName: string,
  outcome: "Won" | "Lost",
): FollowUp[] {
  const first = contactName.split(" ")[0] || "them";
  const base = { contactId: deal.contactId };
  return outcome === "Won"
    ? [
        {
          ...base,
          title: `Share the onboarding timeline with ${first}`,
          due: offsetDate(3),
          priority: "High",
        },
        {
          ...base,
          title: `Send ${first} a thank-you note`,
          due: offsetDate(1),
          priority: "Normal",
        },
        {
          ...base,
          title: "Schedule the kickoff call",
          due: offsetDate(7),
          priority: "Normal",
        },
      ]
    : [
        {
          ...base,
          title: `Thank ${first} for the conversation`,
          due: offsetDate(1),
          priority: "Normal",
        },
        {
          ...base,
          title: `Check in with ${first} in three months`,
          due: offsetDate(90),
          priority: "Normal",
        },
      ];
}

/** Stamp creation on a new deal, or record a stage change on an edited one. */
export function withDealHistory(previous: Deal | undefined, next: Deal): Deal {
  if (!previous) {
    const at = today();
    return { ...next, createdAt: at, history: [{ at, kind: "created" }] };
  }
  const history = previous.history ?? [];
  return {
    ...next,
    createdAt: previous.createdAt,
    summary: previous.summary,
    history:
      previous.stage === next.stage
        ? history
        : [
            ...history,
            { at: today(), kind: "stage", from: previous.stage, to: next.stage },
          ],
  };
}
export interface TimelineEntry {
  at: string;
  kind: DealEventKind | "task";
  title: string;
  detail?: string;
}
/** Everything that happened on a deal, newest first: its history plus completed follow-ups. */
export function dealTimeline(db: Database, deal: Deal): TimelineEntry[] {
  const contactName =
    db.contacts.find((c) => c.id === deal.contactId)?.name ?? "the contact";
  const events: TimelineEntry[] = (deal.history ?? []).map((e) => ({
    at: e.at,
    kind: e.kind,
    title:
      e.kind === "created"
        ? "Deal created"
        : e.kind === "stage"
          ? `Moved to ${e.to ?? deal.stage}`
          : e.kind === "meeting"
            ? "Meeting"
            : e.kind === "email"
              ? "Email"
              : "Note",
    detail:
      e.kind === "stage" && e.from ? `From ${e.from}${e.text ? `. ${e.text}` : ""}` : e.text,
  }));
  const done: TimelineEntry[] = db.tasks
    .filter((t) => t.contactId === deal.contactId && t.done && t.completedAt)
    .map((t) => ({
      at: t.completedAt as string,
      kind: "task",
      title: "Follow-up done",
      detail: `${t.title} · ${contactName}`,
    }));
  return [...events, ...done].sort((a, b) => b.at.localeCompare(a.at));
}
export function daysInPipeline(deal: Deal) {
  return deal.createdAt ? -daysUntil(deal.createdAt) : null;
}
