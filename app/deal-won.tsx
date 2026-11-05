"use client";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Globe,
  Mail,
  PartyPopper,
  Sprout,
} from "lucide-react";
import { Avatar, Button, Card } from "@folio/ui";
import {
  dateLabel,
  money,
  openDeals,
  type Database,
  type Deal,
  type Task,
} from "@/lib/model";

export function DealOutcome({
  deal,
  db,
  onBackToPipeline,
  onOpenDeal,
  onOpenContact,
  taskRow,
}: {
  deal: Deal;
  db: Database;
  onBackToPipeline: () => void;
  onOpenDeal: () => void;
  onOpenContact: (id: string) => void;
  taskRow: (task: Task) => ReactNode;
}) {
  const won = deal.stage === "Won";
  const contact = db.contacts.find((c) => c.id === deal.contactId);
  const company = db.companies.find((c) => c.id === deal.companyId);
  const plan = db.tasks
    .filter((t) => t.contactId === deal.contactId && !t.done)
    .sort((a, b) => a.due.localeCompare(b.due));
  const remaining = openDeals(db);
  const remainingValue = remaining.reduce((sum, d) => sum + d.value, 0);
  const wonThisQuarter = db.deals.filter((d) => d.stage === "Won");
  const withCompany = remaining.filter((d) => d.companyId === deal.companyId);
  const first = contact?.name.split(" ")[0];

  return (
    <div className="deal-page outcome-page">
      <button className="back-link" onClick={onOpenDeal}>
        <ArrowLeft size={14} /> {deal.name}
      </button>

      <Card className={won ? "outcome-hero is-won" : "outcome-hero is-lost"}>
        <span className="outcome-mark" aria-hidden="true">
          {won ? <PartyPopper size={26} /> : <Sprout size={26} />}
        </span>
        <div>
          <p className="eyebrow">{won ? "WON" : "LOST, FOR NOW"}</p>
          <h1>{won ? "Won. Nicely done." : "Not this time."}</h1>
          <p className="outcome-lede">
            {won
              ? `${money(deal.value)} with ${company?.name ?? "an independent"}, closed ${dateLabel(deal.closeDate)}. The handshake is the start, not the finish.`
              : `${deal.name} with ${company?.name ?? "an independent"} was marked lost on ${dateLabel(deal.closeDate)}. The relationship is still yours to keep.`}
          </p>
        </div>
        <div className="outcome-actions">
          <Button variant="secondary" onClick={onBackToPipeline}>
            Back to pipeline
          </Button>
          {contact && (
            <Button onClick={() => onOpenContact(contact.id)}>
              {first ? `Open ${first}'s profile` : "Open profile"}
              <ArrowUpRight size={15} />
            </Button>
          )}
        </div>
      </Card>

      <div className="deal-grid">
        <div className="deal-main">
          <Card className="section-card">
            <div className="section-heading">
              <div>
                <h2>{won ? "Your handoff plan" : "Keeping the door open"}</h2>
                <p className="muted">
                  {won
                    ? `Open follow-ups with ${contact?.name ?? "this contact"}, in order. Tick them off as you go.`
                    : "Small, kind steps that keep you in mind."}
                </p>
              </div>
              <span className="count-inline">{plan.length}</span>
            </div>
            {plan.length ? (
              <div className="task-list">{plan.map(taskRow)}</div>
            ) : (
              <p className="muted">
                No follow-ups yet. Add one whenever you are ready.
              </p>
            )}
          </Card>

          <Card className="section-card">
            <div className="section-heading">
              <div>
                <h2>{won ? "What was agreed" : "What we learned"}</h2>
                <p className="muted">On record for whoever picks this up next.</p>
              </div>
            </div>
            <p className="detail-notes">
              {deal.summary ||
                (won
                  ? "Nothing written down yet. Edit the deal to add the terms."
                  : "Nothing written down yet. Edit the deal to add a note.")}
            </p>
          </Card>
        </div>

        <aside className="deal-side">
          <Card className="section-card people-card">
            <h2>The relationship from here</h2>
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
            <h2>{won ? "What this did for the pipeline" : "Where the pipeline stands"}</h2>
            <dl className="review-list">
              {won && (
                <div>
                  <dt>Moved to won</dt>
                  <dd>{money(deal.value)}</dd>
                </div>
              )}
              <div>
                <dt>Still open</dt>
                <dd>
                  {money(remainingValue)} across {remaining.length} deals
                </dd>
              </div>
              <div>
                <dt>Won so far</dt>
                <dd>
                  {wonThisQuarter.length} deal{wonThisQuarter.length === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt>With {company?.name ?? "this company"}</dt>
                <dd>
                  {withCompany.length
                    ? `${withCompany.length} more in progress`
                    : "Nothing else open"}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
