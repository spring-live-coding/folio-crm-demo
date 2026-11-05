"use client";
import { useState } from "react";
import { ArrowLeft, Building2, Globe, Handshake, Mail } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Textarea,
} from "@folio/ui";
import {
  dateLabel,
  money,
  suggestedFollowUps,
  today,
  type Database,
  type Deal,
  type FollowUp,
} from "@/lib/model";

export type Outcome = "Won" | "Lost";

export function CloseDeal({
  deal,
  db,
  outcome,
  onBack,
  onSwitchOutcome,
  onConfirm,
}: {
  deal: Deal;
  db: Database;
  outcome: Outcome;
  onBack: () => void;
  onSwitchOutcome: (outcome: Outcome) => void;
  onConfirm: (options: {
    value: number;
    closeDate: string;
    summary: string;
    followUps: FollowUp[];
  }) => void;
}) {
  const contact = db.contacts.find((c) => c.id === deal.contactId);
  const company = db.companies.find((c) => c.id === deal.companyId);
  const suggestions = suggestedFollowUps(
    deal,
    contact?.name ?? "",
    outcome,
  );
  const [value, setValue] = useState(String(deal.value));
  const [closeDate, setCloseDate] = useState(today());
  const [summary, setSummary] = useState(deal.summary ?? "");
  const [picked, setPicked] = useState(() =>
    suggestions.map((_, index) => index === 0 || outcome === "Lost"),
  );
  const won = outcome === "Won";
  const parsedValue = Number(value);
  const valid =
    Number.isFinite(parsedValue) && parsedValue >= 0 && closeDate.length > 0;
  const chosen = suggestions.filter((_, index) => picked[index]);

  return (
    <div className="deal-page close-page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={14} /> {deal.name}
      </button>
      <div className="page-heading deal-heading">
        <div>
          <p className="eyebrow">
            {won ? "A HANDSHAKE IS CLOSE" : "NOT THIS TIME"}
          </p>
          <h1>{won ? `Close ${deal.name}` : `Let ${deal.name} go`}</h1>
          <p className="muted">
            {won
              ? "Confirm the final terms and set up what happens next. This is the moment the relationship really starts."
              : "Record what happened and keep the door open. Most lost deals come back when the timing is right."}
          </p>
        </div>
        <Badge tone={won ? "success" : "neutral"}>
          {won ? "Moving to Won" : "Moving to Lost"}
        </Badge>
      </div>

      <div className="deal-grid">
        <div className="deal-main">
          <Card className="section-card">
            <div className="section-heading">
              <div>
                <h2>{won ? "Final terms" : "What happened"}</h2>
                <p className="muted">
                  {won
                    ? "These are the numbers that go on record."
                    : "A few honest lines make the next conversation easier."}
                </p>
              </div>
            </div>
            <div className="terms-grid">
              <Field label={won ? "Final value (USD)" : "Value at close (USD)"}>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </Field>
              <Field label="Close date">
                <Input
                  type="date"
                  value={closeDate}
                  onChange={(e) => setCloseDate(e.target.value)}
                />
              </Field>
            </div>
            <Field
              label={won ? "What was agreed" : "What we learned"}
              hint={
                won
                  ? "Scope, timing, anything the team should know on day one."
                  : "Price, timing, fit. Whatever helps next time."
              }
            >
              <Textarea
                rows={4}
                value={summary}
                placeholder={
                  won
                    ? "Twelve-month studio partnership, kickoff in October, monthly check-ins."
                    : "Budget moved to next quarter. Keep in touch in the new year."
                }
                onChange={(e) => setSummary(e.target.value)}
              />
            </Field>
          </Card>

          <Card className="section-card">
            <div className="section-heading">
              <div>
                <h2>{won ? "What happens next" : "Keep the door open"}</h2>
                <p className="muted">
                  {won
                    ? `Follow-ups Folio will add for ${contact?.name ?? "this contact"}. Pick the ones that fit.`
                    : "A small gesture now keeps the relationship warm."}
                </p>
              </div>
              <span className="count-inline">{chosen.length}</span>
            </div>
            <div className="follow-up-list">
              {suggestions.map((f, index) => (
                <label className="follow-up-option" key={f.title}>
                  <input
                    type="checkbox"
                    checked={picked[index]}
                    onChange={(e) =>
                      setPicked(
                        picked.map((p, i) => (i === index ? e.target.checked : p)),
                      )
                    }
                  />
                  <span>
                    <strong>{f.title}</strong>
                    <small>
                      Due {dateLabel(f.due)}
                      {f.priority === "High" ? " · High priority" : ""}
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </div>

        <aside className="deal-side">
          <Card className="section-card review-card">
            <h2>Before you close</h2>
            <dl className="review-list">
              <div>
                <dt>Stage</dt>
                <dd>
                  {deal.stage} → {outcome}
                </dd>
              </div>
              <div>
                <dt>Value</dt>
                <dd>
                  {money(deal.value)}
                  {valid && parsedValue !== deal.value
                    ? ` → ${money(parsedValue)}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Close date</dt>
                <dd>
                  {dateLabel(deal.closeDate)}
                  {closeDate !== deal.closeDate ? ` → ${dateLabel(closeDate)}` : ""}
                </dd>
              </div>
              <div>
                <dt>Follow-ups</dt>
                <dd>{chosen.length} will be added</dd>
              </div>
            </dl>
          </Card>
          <Card className="section-card people-card">
            <h2>Who helped close this</h2>
            <div className="person-tile is-static">
              <Avatar name={contact?.name ?? "?"} size="lg" />
              <span>
                <strong>{contact?.name ?? "No contact"}</strong>
                <small>{contact?.role || "No role added"}</small>
                {contact?.email && (
                  <small className="person-meta">
                    <Mail size={12} />
                    {contact.email}
                  </small>
                )}
              </span>
            </div>
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
        </aside>
      </div>

      <Card className="close-actions">
        <button
          className="text-link"
          onClick={() => onSwitchOutcome(won ? "Lost" : "Won")}
        >
          {won ? "Mark as lost instead" : "Actually, we won this"}
        </button>
        <div className="form-actions">
          <Button variant="secondary" onClick={onBack}>
            Not yet
          </Button>
          <Button
            variant={won ? "primary" : "danger"}
            disabled={!valid}
            onClick={() =>
              onConfirm({
                value: parsedValue,
                closeDate,
                summary: summary.trim(),
                followUps: chosen,
              })
            }
          >
            {won && <Handshake size={15} />}
            {won ? "Mark as won" : "Mark as lost"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
