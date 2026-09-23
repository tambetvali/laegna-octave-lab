import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// The generated components expose stable hooks as `data-ocid`, not
// `data-testid`; point Testing Library's test-id queries at the real attribute.
configure({ testIdAttribute: "data-ocid" });

// jsdom does not implement ResizeObserver, which Radix UI primitives (the
// Slider in the octave calculator and every simulator) use on mount. A no-op
// observer is enough: the tests assert on values and text, never on layout.
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });
}

// jsdom does not implement the Pointer Events capture API, which Radix UI's
// Select calls on its trigger when it opens. Without these stubs the click
// throws `target.hasPointerCapture is not a function` and the menu never opens.
if (!("hasPointerCapture" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "hasPointerCapture", {
    writable: true,
    configurable: true,
    value: () => false,
  });
}
if (!("setPointerCapture" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "setPointerCapture", {
    writable: true,
    configurable: true,
    value: () => {},
  });
}
if (!("releasePointerCapture" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "releasePointerCapture", {
    writable: true,
    configurable: true,
    value: () => {},
  });
}

// jsdom does not implement scrollIntoView either, and Radix Select calls it on
// the highlighted option when the menu opens.
if (!("scrollIntoView" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    writable: true,
    configurable: true,
    value: () => {},
  });
}

// React Testing Library does not auto-clean when globals are enabled unless
// the environment is detected; do it explicitly so each test starts fresh.
afterEach(() => {
  cleanup();
});
