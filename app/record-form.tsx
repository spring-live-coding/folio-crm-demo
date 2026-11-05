"use client";
import { useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, Select, Textarea } from "@folio/ui";
import {
  withDealHistory,
  stages,
  today,
  type Database,
  type Contact,
  type Deal,
  type Task,
  type Company,
} from "@/lib/model";
export type Editor =
  | { kind: "contact"; record?: Contact }
  | { kind: "deal"; record?: Deal }
  | { kind: "task"; record?: Task }
  | { kind: "company"; record?: Company };
export function RecordForm({
  editor,
  db,
  onSave,
  onClose,
  onDelete,
}: {
  editor: Editor;
  db: Database;
  onSave: (db: Database) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [error, setError] = useState("");
  const [contactId, setContactId] = useState(
    editor.kind === "deal" ? (editor.record?.contactId ?? "") : "",
  );
  const [companyId, setCompanyId] = useState(
    editor.kind === "deal" ? (editor.record?.companyId ?? "") : "",
  );
  const r = editor.record;
  const companyOptions = (
    <>
      <option value="">No company</option>
      {db.companies.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </>
  );
  const contactOptions = (
    <>
      <option value="">No contact</option>
      {db.contacts.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </>
  );
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (key: string) => String(f.get(key) ?? "").trim();
    const id = r?.id ?? crypto.randomUUID();
    if (!get(editor.kind === "task" ? "title" : "name")) {
      setError("Please enter a name.");
      return;
    }
    if (editor.kind === "contact") {
      const row: Contact = {
        id,
        name: get("name"),
        email: get("email"),
        role: get("role"),
        companyId: get("companyId"),
        status: get("status") as Contact["status"],
        notes: get("notes"),
      };
      if (
        row.email &&
        db.contacts.some(
          (c) =>
            c.id !== id && c.email.toLowerCase() === row.email.toLowerCase(),
        )
      ) {
        setError("A contact with this email already exists.");
        return;
      }
      onSave({
        ...db,
        contacts: r
          ? db.contacts.map((c) => (c.id === id ? row : c))
          : [row, ...db.contacts],
      });
    }
    if (editor.kind === "company") {
      const row: Company = {
        id,
        name: get("name"),
        industry: get("industry"),
        website: get("website"),
      };
      onSave({
        ...db,
        companies: r
          ? db.companies.map((c) => (c.id === id ? row : c))
          : [row, ...db.companies],
      });
    }
    if (editor.kind === "deal") {
      const value = Number(get("value"));
      if (!Number.isFinite(value) || value < 0) {
        setError("Enter a valid, non-negative deal value.");
        return;
      }
      const row: Deal = withDealHistory(editor.record, {
        id,
        name: get("name"),
        value,
        companyId,
        contactId,
        stage: get("stage") as Deal["stage"],
        closeDate: get("closeDate"),
      });
      onSave({
        ...db,
        deals: r
          ? db.deals.map((d) => (d.id === id ? row : d))
          : [row, ...db.deals],
      });
    }
    if (editor.kind === "task") {
      const row: Task = {
        id,
        title: get("title"),
        contactId: get("contactId"),
        due: get("due"),
        done: editor.record?.done ?? false,
        priority: get("priority") as Task["priority"],
      };
      onSave({
        ...db,
        tasks: r
          ? db.tasks.map((t) => (t.id === id ? row : t))
          : [row, ...db.tasks],
      });
    }
  }
  return (
    <Modal title={`${r ? "Edit" : "New"} ${editor.kind}`} onClose={onClose}>
      <form onSubmit={submit} className="record-form">
        {editor.kind === "contact" && (
          <>
            <Field label="Full name">
              <Input
                name="name"
                required
                maxLength={120}
                autoFocus
                defaultValue={editor.record?.name}
                placeholder="e.g. Alex Morgan"
              />
            </Field>
            <Field label="Email">
              <Input
                name="email"
                type="email"
                maxLength={254}
                defaultValue={editor.record?.email}
                placeholder="alex@company.com"
              />
            </Field>
            <div className="form-grid">
              <Field label="Role">
                <Input
                  name="role"
                  maxLength={120}
                  defaultValue={editor.record?.role}
                  placeholder="e.g. Product Manager"
                />
              </Field>
              <Field label="Company">
                <Select
                  name="companyId"
                  defaultValue={editor.record?.companyId ?? ""}
                >
                  {companyOptions}
                </Select>
              </Field>
            </div>
            <Field label="Relationship">
              <Select
                name="status"
                defaultValue={editor.record?.status ?? "Prospect"}
              >
                {["Prospect", "Customer", "Partner"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Notes">
              <Textarea
                name="notes"
                maxLength={5000}
                defaultValue={editor.record?.notes}
                placeholder="The small details worth remembering…"
              />
            </Field>
          </>
        )}
        {editor.kind === "company" && (
          <>
            <Field label="Company name">
              <Input
                name="name"
                required
                maxLength={120}
                autoFocus
                defaultValue={editor.record?.name}
              />
            </Field>
            <Field label="Industry">
              <Input
                name="industry"
                maxLength={120}
                defaultValue={editor.record?.industry}
                placeholder="e.g. Software"
              />
            </Field>
            <Field label="Website">
              <Input
                name="website"
                maxLength={300}
                defaultValue={editor.record?.website}
                placeholder="company.com"
              />
            </Field>
          </>
        )}
        {editor.kind === "deal" && (
          <>
            <Field label="Deal name">
              <Input
                name="name"
                required
                maxLength={120}
                autoFocus
                defaultValue={editor.record?.name}
                placeholder="e.g. Annual partnership"
              />
            </Field>
            <div className="form-grid">
              <Field label="Value (USD)">
                <Input
                  name="value"
                  type="number"
                  min="0"
                  max="999999999"
                  step="0.01"
                  required
                  defaultValue={editor.record?.value ?? 0}
                />
              </Field>
              <Field label="Stage">
                <Select
                  name="stage"
                  defaultValue={editor.record?.stage ?? "Lead"}
                >
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Contact">
              <Select
                name="contactId"
                value={contactId}
                onChange={(e) => {
                  setContactId(e.target.value);
                  const c = db.contacts.find((c) => c.id === e.target.value);
                  if (c) setCompanyId(c.companyId);
                }}
              >
                {contactOptions}
              </Select>
            </Field>
            <Field label="Company">
              <Select
                name="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                {companyOptions}
              </Select>
            </Field>
            <Field label="Expected close date">
              <Input
                name="closeDate"
                type="date"
                required
                defaultValue={editor.record?.closeDate ?? today()}
              />
            </Field>
          </>
        )}
        {editor.kind === "task" && (
          <>
            <Field label="What needs to happen?">
              <Input
                name="title"
                required
                maxLength={200}
                autoFocus
                defaultValue={editor.record?.title}
                placeholder="e.g. Follow up after the demo"
              />
            </Field>
            <Field label="Related contact">
              <Select
                name="contactId"
                defaultValue={editor.record?.contactId ?? ""}
              >
                {contactOptions}
              </Select>
            </Field>
            <div className="form-grid">
              <Field label="Due date">
                <Input
                  name="due"
                  type="date"
                  required
                  defaultValue={editor.record?.due ?? today()}
                />
              </Field>
              <Field label="Priority">
                <Select
                  name="priority"
                  defaultValue={editor.record?.priority ?? "Normal"}
                >
                  <option>Normal</option>
                  <option>High</option>
                </Select>
              </Field>
            </div>
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          {r && (
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <span className="spacer" />
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {r ? "Save changes" : `Create ${editor.kind}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
