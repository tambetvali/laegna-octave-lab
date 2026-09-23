import { DEFAULT_PARAMS } from "@/lib/octave";
import { LovePage } from "@/pages/LovePage";
import { useOctaveStore } from "@/store/octave-store";
import { renderWithProviders } from "@/test/helpers";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  useOctaveStore.setState({ params: DEFAULT_PARAMS });
});

describe("LovePage", () => {
  it("shows x · y as the next-order result for two people", () => {
    renderWithProviders(<LovePage />);
    // Defaults are x = 3, y = 4 → additive 7, multiplicative 12.
    const additive = screen.getByTestId("love.result.1");
    expect(additive).toHaveTextContent("Additive love");
    expect(additive).toHaveTextContent("7");
    expect(additive).toHaveTextContent("x + y");

    const multiplicative = screen.getByTestId("love.result.2");
    expect(multiplicative).toHaveTextContent("Multiplicative love");
    expect(multiplicative).toHaveTextContent("12");
    expect(multiplicative).toHaveTextContent("x · y");
  });

  it("updates the next-order result live as inputs change", () => {
    renderWithProviders(<LovePage />);
    fireEvent.change(screen.getByTestId("love.x_input"), {
      target: { value: "5" },
    });

    // 5 * 4 = 20, 5 + 4 = 9.
    expect(screen.getByTestId("love.result.2")).toHaveTextContent("20");
    expect(screen.getByTestId("love.result.1")).toHaveTextContent("9");
  });

  it("clamps inputs into the accepted 0..99 range", () => {
    renderWithProviders(<LovePage />);
    fireEvent.change(screen.getByTestId("love.y_input"), {
      target: { value: "500" },
    });
    // Clamped to 99: 3 * 99 = 297.
    expect(screen.getByTestId("love.result.2")).toHaveTextContent("297");
  });

  it("opens the multitude slider at two people and grows the limit", () => {
    renderWithProviders(<LovePage />);
    expect(screen.getByTestId("love.people_value")).toHaveTextContent("2");

    const slider = screen.getByTestId("love.people_slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(screen.getByTestId("love.people_value")).toHaveTextContent("3");
  });

  it("renders the additive vs multiplicative plot with both series", () => {
    renderWithProviders(<LovePage />);
    expect(
      screen.getByRole("img", {
        name: /additive love 3 plus y compared with multiplicative love 3 times y/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Additive — 3 \+ y/)).toBeInTheDocument();
    expect(screen.getByText(/Multiplicative — 3 · y/)).toBeInTheDocument();
  });
});
