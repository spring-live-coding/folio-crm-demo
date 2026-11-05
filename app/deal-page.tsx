"use client";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  Globe,
  Handshake,
  Mail,
  Pencil,
  Plus,
} from "lucide-react";
import { Avatar, Badge, Button, Card, type Tone } from "@folio/ui";
import {
  activeStages,
  closeLabel,
  dateLabel,
  money,
  nextStage,
  stageIndex,
  type Database,
  type Deal,
  type Stage,
  type Task,
} from "@/lib/model";

const stageTone = (stage: Stage): Tone =>
  stage === "Won"
    ? "success"
    : stage === "Lost"
      ? "danger"
      : stage === "Negotiation"
        ? "info"
        : stage === "Lead"
          ? "neutral"
          : "warning";
const stageBlurb: Record<Stage, string> = {
  Lead: "A first hello. Learn what they need.",
  Qualified: "There is a real fit. Shape the conversation.",
  Proposal: "Your offer is on the table.",
  Negotiation: "Close to a handshake. Settle the details.",
  Won: "A handshake. Time to deliver.",
  Lost: "Not this time. Keep the door open.",
};

export function DealPage({
  deal,
  db,
  onBack,
  onEdit,
  onMove,
  onClose,
  onLost,
  onOutcome,
  onOpenContact,
  onOpenDeal,
  onAddTask,
  taskRow,
}: {
  deal: Deal;
  db: Database;
  onBack: () => void;
  onEdit: () => void;
  onMove: (stage: Stage) => void;
  onClose: () => void;
  onLost: () => void;
  onOutcome: () => void;
  onOpenContact: (id: string) => void;
  onOpenDeal: (id: string) => void;
  onAddTask: () => void;
  taskRow: (task: Task) => ReactNode;
}) {
  const contact = db.contacts.find((c) => c.id === deal.contactId);
  const company = db.companies.find((c) => c.id === deal.companyId);
  const tasks = db.tasks.filter((t) => t.contactId === deal.contactId);
  const openTasks = tasks.filter((t) => !t.done);
  const related = db.deals.filter(
    (d) => d.companyId === deal.companyId && d.id !== deal.id,
  );
  const closed = deal.stage === "Won" || deal.stage === "Lost";
  const next = nextStage(deal.stage);
  const current = stageIndex(deal.stage);

  return (
    <div className="deal-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> Pipeline
      </button>
      <div className="page-heading deal-heading">
        <div>
          <p className="eyebrow">
            {closed ? "CLOSED OPPORTUNITY" : "OPEN OPPORTUNITY"}
          </p>
          <h1>{deal.name}</h1>
          <p className="muted">
            {company?.name ?? "Independent"} ·{" "}
            {contact?.name ?? "No contact"} · {stageBlurb[deal.stage]}
          </p>
        </div>
        <div className="deal-heading-actions">
          <Button variant="secondary" onClick={onEdit}>
            <Pencil size={15} />
            Edit deal
          </Button>
          {next === "Won" && (
            <Button onClick={onClose}>
              <Handshake size={15} />
              Close the deal
            </Button>
          )}
          {next && next !== "Won" && (
            <Button onClick={() => onMove(next)}>
              Move to {next}
              <ArrowUpRight size={15} />
            </Button>
          )}
          {closed && (
            <Button onClick={onOutcome}>
              {deal.stage === "Won" ? "See the handoff plan" : "See what's next"}
              <ArrowUpRight size={15} />
            </Button>
          )}
        </div>
      </div>

      <Card className="section-card stage-card">
        <div className="section-heading">
          <div>
            <h2>Where this stands</h2>
            <p className="muted">
              {closed
                ? "This one is closed. The story is written."
                : `${
                    deal.createdAt
                      ? `In the pipeline since ${dateLabel(deal.createdAt)}. `
                      : ""
                  }Stage ${current + 1} of ${activeStages.length}. Every step is a conversation.`}
            </p>
          </div>
          <Badge tone={stageTone(deal.stage)}>{deal.stage}</Badge>
        </div>
        <ol className="stage-stepper" aria-label="Deal stages">
          {activeStages.map((stage, index) => {
            const state =
              deal.stage === "Lost"
                ? "muted"
                : index < current
                  ? "done"
                  : index === current
                    ? "current"
                    : "todo";
            const reachable = !closed && index !== current;
            return (
              <li
                key={stage}
                className={`stage-step is-${state}`}
                aria-current={state === "current" ? "step" : undefined}
              >
                <button
                  type="button"
                  className="stage-step-button"
                  disabled={!reachable}
                  onClick={() => (stage === "Won" ? onClose() : onMove(stage))}
                  aria-label={
                    reachable ? `Move to ${stage}` : `${stage} stage`
                  }
                >
                  <span className={`stage-step-dot stage-fill-${index}`}>
                    {state === "done" && <Check size={12} />}
                  </span>
                  <span className="stage-step-name">{stage}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="deal-grid">
        <div className="deal-main">
          <div className="deal-facts">
            <Card className="metric">
              <p>Value</p>
              <strong>{money(deal.value)}</strong>
              <small>{closed ? "Final" : "Open opportunity"}</small>
            </Card>
            <Card className="metric">
              <p>{closed ? "Closed" : "Expected close"}</p>
              <strong>{dateLabel(deal.closeDate)}</strong>
              <small>
                {closed ? "Done and dusted" : closeLabel(deal.closeDate)}
              </small>
            </Card>
            <Card className="metric">
              <p>Follow-ups</p>
              <strong>{openTasks.length}</strong>
              <small>
                {openTasks.length ? "Open next steps" : "Nothing waiting on you"}
              </small>
            </Card>
          </div>
          <Card className="section-card">
            <div className="section-heading">
              <div>
                <h2>Next steps</h2>
                <p className="muted">
                  Follow-ups with {contact?.name ?? "this contact"}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Add follow-up"
                onClick={onAddTask}
              >
                <Plus size={17} />
              </Button>
            </div>
            {tasks.length ? (
              <div className="task-list">{tasks.map(taskRow)}</div>
            ) : (
              <p className="muted">
                No follow-ups yet. A small hello can go a long way.
              </p>
            )}
          </Card>
          <Card className="section-card">
            <div className="section-heading">
              <div>
                <h2>Worth remembering</h2>
                <p className="muted">
                  Notes that make the next conversation personal.
                </p>
              </div>
            </div>
            <p className="detail-notes">
              {deal.summary ||
                contact?.notes ||
                "No notes yet. Add the details that make the next conversation more personal."}
            </p>
          </Card>
        </div>
        <aside className="deal-side">
          <Card className="section-card people-card">
            <h2>The people</h2>
            {contact ? (
              <button
                className="person-tile"
                onClick={() => onOpenContact(contact.id)}
              >
                <Avatar name={contact.name} size="lg" />
                <span>
                  <strong>{contact.name}</strong>
                  <small>{contact.role || "No role added"}</small>
                  <small className="person-meta">
                    <Mail size={12} />
                    {contact.email || "No email added"}
                  </small>
                </span>
              </button>
            ) : (
              <p className="muted">No contact linked.</p>
            )}
            <div className="person-tile is-static">
              <span className="company-symbol company-symbol--lg">
                {company ? company.name.slice(0, 1) : <Building2 size={16} />}
              </span>
              <span>
                <strong>{company?.name ?? "Independent"}</strong>
                <small>{company?.industry ?? "No company linked"}</small>
                {company?.website && (
                  <small className="person-meta">
                    <Globe size={12} />
                    {company.website}
                  </small>
                )}
              </span>
            </div>
          </Card>
          <Card className="section-card">
            <h2>More with {company?.name ?? "this company"}</h2>
            {related.length ? (
              related.map((d) => (
                <button
                  className="detail-deal detail-deal-button"
                  key={d.id}
                  onClick={() => onOpenDeal(d.id)}
                >
                  <span>
                    {d.name}
                    <small>{d.stage}</small>
                  </span>
                  <strong>{money(d.value)}</strong>
                </button>
              ))
            ) : (
              <p className="muted">This is the only opportunity so far.</p>
            )}
          </Card>
          {!closed && (
            <button className="text-link text-link--danger" onClick={onLost}>
              Mark as lost
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
