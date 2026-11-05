import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import Home from "../app/page";
import { STORAGE_KEY, parseDatabase } from "../lib/model";
beforeEach(() => {
  localStorage.clear();
  location.hash = "";
  // jsdom does not implement the native dialog API. These tests exercise application
  // workflows, while focus containment is delegated to the browser's native dialog.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("creates and edits a contact, then safely deletes it", () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: "New contact" }));
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Sam Rivera" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "sam@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create contact" }));
  expect(screen.getByText("Sam Rivera")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Edit Sam Rivera" }));
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Sam Rivers" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(
    parseDatabase(localStorage.getItem(STORAGE_KEY)!).contacts[0].name,
  ).toBe("Sam Rivers");
  fireEvent.click(screen.getByRole("button", { name: "Edit Sam Rivers" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(screen.queryByText("Sam Rivers")).toBeNull();
});
it("moves a deal and recalculates the pipeline after a win", () => {
  render(<Home />);
  fireEvent.click(
    screen.getByRole("button", { name: "Pipeline" }),
  );
  fireEvent.change(screen.getByLabelText("Stage for Studio partnership"), {
    target: { value: "Won" },
  });
  const db = parseDatabase(localStorage.getItem(STORAGE_KEY)!);
  expect(db.deals.find((d) => d.id === "d1")?.stage).toBe("Won");
  fireEvent.click(
    screen.getByRole("button", { name: "Overview" }),
  );
  expect(screen.getByText("$152,500")).toBeTruthy();
});
it("completes and reopens a task through filtered views", () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: /^Tasks/ }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "Complete Send the updated partnership proposal",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: /^Completed/ }));
  fireEvent.click(
    screen.getByRole("button", {
      name: "Reopen Send the updated partnership proposal",
    }),
  );
  expect(
    parseDatabase(localStorage.getItem(STORAGE_KEY)!).tasks.find(
      (t) => t.id === "t1",
    )?.done,
  ).toBe(false);
});
it("filters contacts and exposes both design-system layers", () => {
  render(<Home />);
  fireEvent.click(
    screen.getByRole("button", { name: "Contacts" }),
  );
  fireEvent.change(screen.getByLabelText("Filter contacts"), {
    target: { value: "Olivia" },
  });
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(2);
  fireEvent.click(
    screen.getByRole("button", { name: "Design system" }),
  );
  expect(screen.getByRole("heading", { name: "Buttons" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Tokens" }));
  expect(screen.getByRole("heading", { name: "Semantic color" })).toBeTruthy();
});
it("opens a deal from the pipeline, closes it on a full screen and lands on the won screen", () => {
  render(<Home />);
  fireEvent.click(screen.getByRole("button", { name: "Pipeline" }));
  fireEvent.click(screen.getByRole("button", { name: /^Studio partnership/ }));
  expect(location.hash).toBe("#Deal/d1");
  expect(screen.getByRole("heading", { name: "Studio partnership" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Close the deal" }));
  expect(location.hash).toBe("#Deal/d1/close");
  expect(screen.getByRole("heading", { name: "Close Studio partnership" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText(/What was agreed/), {
    target: { value: "Twelve-month partnership, kickoff in October." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Mark as won" }));
  expect(location.hash).toBe("#Deal/d1/won");
  expect(screen.getByRole("heading", { name: "Won. Nicely done." })).toBeTruthy();
  const db = parseDatabase(localStorage.getItem(STORAGE_KEY)!);
  const deal = db.deals.find((d) => d.id === "d1")!;
  expect(deal.stage).toBe("Won");
  expect(deal.summary).toBe("Twelve-month partnership, kickoff in October.");
  expect(
    db.tasks.some(
      (t) =>
        t.title === "Share the onboarding timeline with Olivia" &&
        t.contactId === "c1" &&
        !t.done,
    ),
  ).toBe(true);
  expect(screen.getByText("Twelve-month partnership, kickoff in October.")).toBeTruthy();
});
it("moves a deal forward from its page, marks one as lost and shows a missing deal gracefully", () => {
  render(<Home />);
  location.hash = "Deal/d5";
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(screen.getByRole("heading", { name: "Platform integration" })).toBeTruthy();
  fireEvent.click(screen.getAllByRole("button", { name: /^Move to Qualified/ })[0]);
  expect(
    parseDatabase(localStorage.getItem(STORAGE_KEY)!).deals.find((d) => d.id === "d5")?.stage,
  ).toBe("Qualified");
  fireEvent.click(screen.getByRole("button", { name: "Mark as lost" }));
  expect(location.hash).toBe("#Deal/d5/lost");
  expect(screen.getByRole("heading", { name: "Let Platform integration go" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Mark as lost" }));
  expect(location.hash).toBe("#Deal/d5/won");
  expect(screen.getByRole("heading", { name: "Not this time." })).toBeTruthy();
  expect(
    parseDatabase(localStorage.getItem(STORAGE_KEY)!).deals.find((d) => d.id === "d5")?.stage,
  ).toBe("Lost");
  location.hash = "Deal/nope";
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(screen.getByText("That deal isn’t here anymore")).toBeTruthy();
});
