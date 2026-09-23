import { DEFAULT_PARAMS } from "@/lib/octave";
import { TranscendencePage } from "@/pages/TranscendencePage";
import { useOctaveStore } from "@/store/octave-store";
import { renderWithProviders } from "@/test/helpers";
import { fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  useOctaveStore.setState({ params: DEFAULT_PARAMS });
});

describe("TranscendencePage", () => {
  it("renders the explorer with the mapping rule stated in words", () => {
    renderWithProviders(<TranscendencePage />);
    expect(
      screen.getByRole("heading", { name: /transcendence explorer/i }),
    ).toBeInTheDocument();
    // The mapping rule: constant becomes a line, a line becomes a curve.
    expect(screen.getByText(/a constant becomes a line/i)).toBeInTheDocument();
  });

  it("shows the base and transcended curves side by side", () => {
    renderWithProviders(<TranscendencePage />);
    const plot = screen.getByRole("img", { name: /base .* order curve/i });
    expect(plot).toBeInTheDocument();
    // The legend names both series.
    expect(
      screen.getByText(/transcended — one integral level up/i),
    ).toBeInTheDocument();
  });

  it("changes the level readout and table when the integral level changes", () => {
    renderWithProviders(<TranscendencePage />);
    const levelValue = screen.getByTestId("transcendence.level_value");
    expect(levelValue).toHaveTextContent("0 → 1");

    const slider = screen.getByTestId("transcendence.level_slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(screen.getByTestId("transcendence.level_value")).toHaveTextContent(
      "1 → 2",
    );
    // The active row follows the level.
    const activeRow = screen.getByTestId("transcendence.row.2");
    expect(activeRow.className).toContain("bg-primary/10");
  });

  it("shows a numeric sample table with one row per level", () => {
    renderWithProviders(<TranscendencePage />);
    const table = screen.getByTestId("transcendence.table");
    const rows = within(table).getAllByRole("row");
    // Header plus levels 0..5.
    expect(rows).toHaveLength(7);
    expect(within(table).getByText("Next-level rank")).toBeInTheDocument();
  });

  it("toggles the lifted curve on and off", () => {
    renderWithProviders(<TranscendencePage />);
    const toggle = screen.getByTestId("transcendence.toggle_lifted");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByText(/transcended — one integral level up/i),
    ).not.toBeInTheDocument();
  });

  it("switches the base order and updates the plot label", () => {
    renderWithProviders(<TranscendencePage />);
    fireEvent.click(screen.getByTestId("transcendence.order.3"));
    expect(
      screen.getByRole("img", { name: /base second order curve/i }),
    ).toBeInTheDocument();
  });
});
