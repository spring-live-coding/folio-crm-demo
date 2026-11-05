"use client";
import { useState } from "react";
import tokens from "@folio/tokens";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Tabs,
  Textarea,
} from "@folio/ui";
export function DesignSystem() {
  const [tab, setTab] = useState("Components");
  const [dialog, setDialog] = useState(false);
  const [choice, setChoice] = useState("One");
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE FOUNDATION OF FOLIO</p>
          <h1>Made to work together.</h1>
          <p className="muted">
            One token language. Thoughtful components. A consistent experience.
          </p>
        </div>
        <Badge tone="success">Design system · v0.1</Badge>
      </div>
      <Tabs
        label="Design system view"
        value={tab}
        onChange={setTab}
        items={[
          { value: "Components", label: "Components" },
          { value: "Tokens", label: "Tokens" },
          { value: "Guidelines", label: "Guidelines" },
        ]}
      />
      {tab === "Tokens" && (
        <div className="design-stack">
          <Card className="section-card">
            <h2>Semantic color</h2>
            <p className="muted">
              Color communicates purpose. All components use these shared roles.
            </p>
            <div className="swatch-grid">
              {Object.entries(tokens.color).map(([name, value]) => (
                <div key={name} className="swatch">
                  <div style={{ background: value }} />
                  <strong>{name}</strong>
                  <code>{value}</code>
                </div>
              ))}
            </div>
          </Card>
          <div className="design-grid">
            <Card className="section-card">
              <h2>Space</h2>
              <p className="muted">A shared rhythm, from 4 to 64 pixels.</p>
              {Object.entries(tokens.space).map(([name, value]) => (
                <div className="token-line" key={name}>
                  <code>space-{name}</code>
                  <div
                    style={{
                      width: value,
                      height: 12,
                      background: "var(--color-brand-soft)",
                    }}
                  />
                  <small>{value}</small>
                </div>
              ))}
            </Card>
            <Card className="section-card">
              <h2>Typography</h2>
              <p className="muted">
                Clear hierarchy with a system sans-serif stack.
              </p>
              {Object.entries(tokens.text).map(([name, value]) => (
                <div className="type-sample" key={name}>
                  <code>
                    {name} · {value}
                  </code>
                  <span style={{ fontSize: value }}>Good relationships.</span>
                </div>
              ))}
            </Card>
          </div>
          <Card className="section-card">
            <h2>Shape, elevation & motion</h2>
            <div className="component-row">
              {Object.entries(tokens.radius).map(([name, value]) => (
                <div
                  className="radius-sample"
                  style={{ borderRadius: value }}
                  key={name}
                >
                  {name}
                  <small>{value}</small>
                </div>
              ))}
            </div>
            <p className="muted">
              Motion: {tokens.motion.fast} for feedback, {tokens.motion.normal}{" "}
              for transitions. Reduced-motion preferences are respected.
              Shadows: small surfaces, medium floating elements, and dialogs.
            </p>
          </Card>
        </div>
      )}
      {tab === "Components" && (
        <div className="design-grid">
          <Card className="section-card">
            <h2>Buttons</h2>
            <p className="muted">A clear hierarchy for every action.</p>
            <div className="component-row">
              <Button onClick={() => setDialog(true)}>Primary action</Button>
              <Button variant="secondary" onClick={() => setDialog(true)}>
                Secondary
              </Button>
              <Button variant="ghost" onClick={() => setDialog(true)}>
                Ghost
              </Button>
              <Button variant="danger" onClick={() => setDialog(true)}>
                Destructive
              </Button>
              <Button disabled>Disabled</Button>
              <Button size="sm" onClick={() => setDialog(true)}>
                Small
              </Button>
            </div>
          </Card>
          <Card className="section-card">
            <h2>Status & identity</h2>
            <p className="muted">Text, color, and initials work together.</p>
            <div className="component-row">
              <Badge>Neutral</Badge>
              <Badge tone="success">Customer</Badge>
              <Badge tone="warning">Pending</Badge>
              <Badge tone="info">Partner</Badge>
              <Badge tone="danger">Overdue</Badge>
            </div>
            <div className="component-row">
              <Avatar name="Alex Morgan" size="sm" />
              <Avatar name="Olivia Rhye" />
              <Avatar name="Phoenix Baker" size="lg" />
            </div>
          </Card>
          <Card className="section-card">
            <h2>Form controls</h2>
            <p className="muted">
              Native behavior, visible labels, and keyboard focus.
            </p>
            <div className="record-form">
              <Field
                label="Contact name"
                hint="Use the name your contact prefers."
              >
                <Input placeholder="Alex Morgan" />
              </Field>
              <Field label="Relationship">
                <Select>
                  <option>Prospect</option>
                  <option>Customer</option>
                  <option>Partner</option>
                </Select>
              </Field>
              <Field label="Notes">
                <Textarea placeholder="A detail worth remembering…" />
              </Field>
              <Field label="Disabled field">
                <Input disabled value="Read only" readOnly />
              </Field>
            </div>
          </Card>
          <Card className="section-card">
            <h2>Navigation & feedback</h2>
            <p className="muted">Small building blocks for useful moments.</p>
            <Tabs
              label="Example views"
              value={choice}
              onChange={setChoice}
              items={[
                { value: "One", label: "All contacts", count: 12 },
                { value: "Two", label: "Customers", count: 6 },
              ]}
            />
            <EmptyState
              title={
                choice === "One"
                  ? "Room for your next relationship"
                  : "Your customers belong here"
              }
              description="Empty states explain what to do next."
              action={
                <Button variant="secondary" onClick={() => setDialog(true)}>
                  Open dialog
                </Button>
              }
            />
          </Card>
        </div>
      )}
      {tab === "Guidelines" && (
        <Card className="section-card guidelines">
          <h2>Build from the bottom up</h2>
          <p>
            <code>@folio/tokens</code> defines the visual language.{" "}
            <code>@folio/ui</code> turns it into reusable, accessible
            components. The CRM composes those components with its own domain
            logic.
          </p>
          <h3>Make the next action clear</h3>
          <p>
            Use one primary action per context. Keep labels concrete, preserve
            keyboard focus, and use visible text alongside status colors.
          </p>
          <h3>Keep the system reusable</h3>
          <p>
            Keep contact, deal, and task logic out of the component package.
            Update semantic tokens at the source, then regenerate their CSS.
          </p>
          <h3>Design for everyday use</h3>
          <p>
            Use generous hit targets, native form validation, helpful empty
            states, and confirmation before destructive actions. Tables scroll
            on smaller screens; forms and navigation reflow.
          </p>
        </Card>
      )}
      {dialog && (
        <Modal
          title="A place for focused work"
          onClose={() => setDialog(false)}
        >
          <p className="muted">
            This shared dialog contains focus, closes with Escape, and returns
            focus to the button that opened it.
          </p>
          <div className="form-actions">
            <Button onClick={() => setDialog(false)}>Got it</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
