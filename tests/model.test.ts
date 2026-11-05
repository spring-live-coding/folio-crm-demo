import { describe, expect, it } from "vitest";
import {
  contactsCsv,
  dealTimeline,
  moveDeal,
  parseDatabase,
  withDealHistory,
  removeCompany,
  removeContact,
  openDeals,
} from "../lib/model";
import { createSeed } from "../lib/seed";
describe("CRM data integrity", () => {
  it("round-trips complete backups without losing relationships", () => {
    const db = createSeed();
    expect(parseDatabase(JSON.stringify(db))).toEqual(db);
  });
  it("rejects malformed, unsupported, or dangling backup data", () => {
    for (const data of [
      null,
      {},
      { ...createSeed(), version: 2 },
      { ...createSeed(), tasks: [{ id: "x" }] },
      { ...createSeed(), companies: [] },
    ])
      expect(() => parseDatabase(JSON.stringify(data))).toThrow();
  });
  it("rejects impossible dates and duplicate identifiers", () => {
    const db = createSeed();
    db.tasks[0].due = "2026-02-30";
    expect(() => parseDatabase(JSON.stringify(db))).toThrow();
    const second = createSeed();
    second.contacts.push(second.contacts[0]);
    expect(() => parseDatabase(JSON.stringify(second))).toThrow();
  });
  it("unlinks deleted contacts while retaining opportunities and follow-ups", () => {
    const db = createSeed();
    const next = removeContact(db, "c1");
    expect(next.contacts.some((c) => c.id === "c1")).toBe(false);
    expect(next.deals.find((d) => d.id === "d1")?.contactId).toBe("");
    expect(next.tasks.find((t) => t.id === "t1")?.contactId).toBe("");
    expect(next.deals).toHaveLength(db.deals.length);
    expect(parseDatabase(JSON.stringify(next))).toEqual(next);
  });
  it("unlinks deleted companies without deleting contacts or deals", () => {
    const next = removeCompany(createSeed(), "co1");
    expect(next.contacts.find((c) => c.id === "c1")?.companyId).toBe("");
    expect(next.deals.find((d) => d.id === "d1")?.companyId).toBe("");
    expect(parseDatabase(JSON.stringify(next))).toEqual(next);
  });
  it("excludes won and lost deals from the open pipeline", () => {
    const db = createSeed();
    expect(openDeals(db).reduce((sum, d) => sum + d.value, 0)).toBe(184500);
    db.deals[0].stage = "Lost";
    expect(openDeals(db).some((d) => d.id === "d1")).toBe(false);
  });
  it("escapes spreadsheet formulas, quotes, commas, and newlines in CSV", () => {
    const db = createSeed();
    db.contacts[0].name = '=HYPERLINK("bad")';
    db.contacts[0].notes = "Hello,\nworld";
    const csv = contactsCsv(db);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"Hello,\nworld"');
  });
});
describe("Deal history", () => {
  it("seeds every deal with a created date and a history that ends at its current stage", () => {
    const db = createSeed();
    for (const deal of db.deals) {
      expect(deal.createdAt).toBeTruthy();
      expect(deal.history?.[0]?.kind).toBe("created");
      const lastMove = [...(deal.history ?? [])].reverse().find((e) => e.kind === "stage");
      expect(lastMove?.to ?? "Lead").toBe(deal.stage);
    }
    expect(db.deals.find((d) => d.id === "d1")?.history?.length).toBeGreaterThanOrEqual(8);
  });
  it("appends a stage event when a deal moves and stamps new deals", () => {
    const db = createSeed();
    const moved = moveDeal(db, "d5", "Qualified");
    const history = moved.deals.find((d) => d.id === "d5")?.history ?? [];
    expect(history.at(-1)).toMatchObject({ kind: "stage", from: "Lead", to: "Qualified" });
    const fresh = withDealHistory(undefined, {
      id: "dx",
      name: "New",
      companyId: "",
      contactId: "",
      value: 1,
      stage: "Lead",
      closeDate: "2026-12-01",
    });
    expect(fresh.createdAt).toBeTruthy();
    expect(fresh.history).toEqual([{ at: fresh.createdAt, kind: "created" }]);
    const edited = withDealHistory(fresh, { ...fresh, stage: "Proposal" });
    expect(edited.history?.at(-1)).toMatchObject({ from: "Lead", to: "Proposal" });
    expect(withDealHistory(fresh, { ...fresh, value: 2 }).history).toHaveLength(1);
  });
  it("builds a newest-first timeline from history and completed follow-ups", () => {
    const db = createSeed();
    const deal = db.deals.find((d) => d.id === "d1")!;
    const timeline = dealTimeline(db, deal);
    expect(timeline.length).toBe((deal.history?.length ?? 0) + 2);
    for (let i = 1; i < timeline.length; i++)
      expect(timeline[i - 1].at >= timeline[i].at).toBe(true);
    expect(timeline.some((e) => e.kind === "task" && e.detail?.includes("Share the two proposal options"))).toBe(true);
  });
  it("rejects malformed history and accepts backups without any", () => {
    const db = createSeed();
    const bare = {
      ...db,
      deals: db.deals.map((d) =>
        Object.fromEntries(
          Object.entries(d).filter(([k]) => k !== "createdAt" && k !== "history"),
        ),
      ),
    };
    expect(() => parseDatabase(JSON.stringify(bare))).not.toThrow();
    const bad = createSeed();
    bad.deals[0].history = [{ at: "2026-02-30", kind: "created" }];
    expect(() => parseDatabase(JSON.stringify(bad))).toThrow();
    const badKind = createSeed();
    badKind.deals[0].history = [{ at: "2026-01-01", kind: "party" as never }];
    expect(() => parseDatabase(JSON.stringify(badKind))).toThrow();
  });
});
