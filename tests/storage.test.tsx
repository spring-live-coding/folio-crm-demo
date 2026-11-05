import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCrm } from "../lib/use-crm";
import { STORAGE_KEY } from "../lib/model";
import { createSeed } from "../lib/seed";
beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("browser persistence", () => {
  it("persists changed records and restores them after remount", () => {
    const { result, unmount } = renderHook(() => useCrm());
    const next = {
      ...result.current.db,
      contacts: result.current.db.contacts.map((c) =>
        c.id === "c1" ? { ...c, name: "Updated Olivia" } : c,
      ),
    };
    act(() => result.current.update(next));
    unmount();
    const restored = renderHook(() => useCrm());
    expect(restored.result.current.db.contacts[0].name).toBe("Updated Olivia");
    expect(restored.result.current.ready).toBe(true);
  });
  it("keeps malformed stored data untouched and reports a recovery warning", () => {
    localStorage.setItem(STORAGE_KEY, "broken");
    const { result } = renderHook(() => useCrm());
    expect(result.current.storageError).toContain("could not be loaded");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("broken");
  });
  it("keeps edits available in memory when browser storage rejects writes", () => {
    const { result } = renderHook(() => useCrm());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    act(() => result.current.update({ ...createSeed(), contacts: [] }));
    expect(result.current.db.contacts).toHaveLength(0);
    expect(result.current.storageError).toContain("memory only");
  });
  it("updates the workspace when another tab saves", () => {
    const { result } = renderHook(() => useCrm());
    const next = { ...createSeed(), contacts: [], tasks: [], deals: [] };
    act(() =>
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: JSON.stringify(next),
        }),
      ),
    );
    expect(result.current.db.contacts).toHaveLength(0);
  });
});
