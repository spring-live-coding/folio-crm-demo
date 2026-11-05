import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Button, Field, Input } from "../packages/ui/src";
afterEach(cleanup);
it("does not submit a form from a default action button", () => {
  let submits = 0;
  render(
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submits++;
      }}
    >
      <Button>Secondary action</Button>
      <Button type="submit">Save</Button>
    </form>,
  );
  fireEvent.click(screen.getByText("Secondary action"));
  expect(submits).toBe(0);
  fireEvent.click(screen.getByText("Save"));
  expect(submits).toBe(1);
});
it("associates field labels with native controls", () => {
  render(
    <Field label="Full name">
      <Input name="name" />
    </Field>,
  );
  expect(screen.getByLabelText("Full name").tagName).toBe("INPUT");
});
