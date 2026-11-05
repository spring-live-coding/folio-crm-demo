import { describe, expect, it } from "vitest";
import { greeting } from "../lib/greeting";

describe("greeting", () => {
  it("greets the given name", () => {
    expect(greeting("Ada")).toBe("Hello, Ada");
  });

  it("keeps an empty name as is", () => {
    expect(greeting("")).toBe("Hello, ");
  });
});
