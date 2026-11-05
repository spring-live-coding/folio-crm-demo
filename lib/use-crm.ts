"use client";
import { useEffect, useState } from "react";
import { parseDatabase, STORAGE_KEY, type Database } from "./model";
import { createSeed } from "./seed";
export function useCrm() {
  const [db, setDb] = useState<Database>(() => createSeed());
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    // Browser storage is intentionally hydrated after SSR to keep the initial render deterministic.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate browser-only state after mount
      if (raw) setDb(parseDatabase(raw));
    } catch {
      setStorageError(
        "Stored data could not be loaded. Showing sample data. Export any important data before saving changes.",
      );
    }
    setReady(true);
    function sync(event: StorageEvent) {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setDb(parseDatabase(event.newValue));
          setStorageError("");
        } catch {
          setStorageError("Another tab saved data that could not be read.");
        }
      }
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function update(next: Database) {
    setDb(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Changes are in memory only; download a backup before closing this tab.",
      );
    }
  }
  return { db, update, ready, storageError };
}
