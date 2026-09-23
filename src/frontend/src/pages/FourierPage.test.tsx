import { DEFAULT_PARAMS } from "@/lib/octave";
import { FourierPage } from "@/pages/FourierPage";
import { useOctaveStore } from "@/store/octave-store";
import { renderWithProviders } from "@/test/helpers";
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

beforeEach(() => {
  useOctaveStore.setState({ params: DEFAULT_PARAMS });
});

describe("FourierPage", () => {
  it("decomposes the rank curve into the requested number of components", () => {
    renderWithProviders(<FourierPage />);
    // Default is 4 components → four rows in the dominant-frequency table.
    expect(screen.getByTestId("fourier.components_value")).toHaveTextContent(
      "4",
    );
    expect(screen.getByTestId("fourier.row.4")).toBeInTheDocument();
    expect(screen.queryByTestId("fourier.row.5")).not.toBeInTheDocument();
  });

  it("rebuilds the curve from the components and labels the reconstruction", () => {
    renderWithProviders(<FourierPage />);
    expect(
      screen.getByRole("img", {
        name: /original rank curve with its reconstruction from 4 frequency components/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Reconstruction — 4 components/),
    ).toBeInTheDocument();
    expect(screen.getByText("Original rank curve")).toBeInTheDocument();
  });

  it("adds a component when the components slider increases", () => {
    renderWithProviders(<FourierPage />);
    const slider = screen.getByTestId("fourier.components_slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(screen.getByTestId("fourier.components_value")).toHaveTextContent(
      "5",
    );
    expect(screen.getByTestId("fourier.row.5")).toBeInTheDocument();
    expect(
      screen.getByText(/Reconstruction — 5 components/),
    ).toBeInTheDocument();
  });

  it("switches to the 2D curvature view and shows the anisotropic field", () => {
    renderWithProviders(<FourierPage />);
    // 2D-only controls are hidden until the view is selected.
    expect(screen.queryByTestId("fourier.2d_controls")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("fourier.dimension.2"));

    expect(screen.getByTestId("fourier.2d_controls")).toBeInTheDocument();
    expect(screen.getByTestId("fourier.anisotropy_value")).toHaveTextContent(
      "2.4×",
    );
    expect(screen.getByTestId("fourier.rotation_value")).toHaveTextContent(
      "35°",
    );
    // The heatmap figure replaces the 1D Gaussian plot.
    expect(
      screen.getByRole("img", {
        name: /two-dimensional curvature field: an anisotropic Gaussian 2\.4 times wider/i,
      }),
    ).toBeInTheDocument();
    // The readout table now lists principal-axis components.
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("Cross")).toBeInTheDocument();
  });

  it("updates the Gaussian envelope width from the slider", () => {
    renderWithProviders(<FourierPage />);
    expect(screen.getByTestId("fourier.gaussian_value")).toHaveTextContent(
      "1.2",
    );
    fireEvent.keyDown(screen.getByTestId("fourier.gaussian_slider"), {
      key: "ArrowRight",
    });
    expect(screen.getByTestId("fourier.gaussian_value")).toHaveTextContent(
      "1.3",
    );
  });
});
