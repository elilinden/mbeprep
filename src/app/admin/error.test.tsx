import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AdminError from "./error";
import AdminLoading from "./loading";

describe("admin route states", () => {
  it("renders a loading state", () => {
    render(<AdminLoading />);

    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      "Loading content operations...",
    );
  });

  it("renders a safe error state with retry", () => {
    const reset = vi.fn();

    render(
      <AdminError
        error={Object.assign(new Error("Database detail"), {
          digest: "demo-digest",
        })}
        reset={reset}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Content operations could not load",
      }),
    ).toBeVisible();
    expect(screen.getByText("Digest: demo-digest")).toBeVisible();
    screen.getByRole("button", { name: "Retry" }).click();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
