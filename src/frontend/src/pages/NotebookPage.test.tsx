import type { backendInterface } from "@/backend";
import { ORDER_LABELS } from "@/lib/octave";
import { NotebookPage } from "@/pages/NotebookPage";
import {
  type MockIdentity,
  createMockActor,
  createMockIdentity,
  renderWithProviders,
} from "@/test/helpers";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// `vi.mock` is hoisted above the imports only when it is a top-level statement,
// so it must be written here rather than inside a helper function. The holder
// it closes over must be hoisted too, or it is still in its temporal dead zone
// when the factory first runs.
const coreInfraMock = vi.hoisted(() => ({
  actor: null as unknown,
  isFetching: false,
  identity: {
    isAuthenticated: false,
    isInitializing: false,
    login: vi.fn(),
    clear: vi.fn(),
  } as MockIdentity,
}));

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({
    actor: coreInfraMock.actor,
    isFetching: coreInfraMock.isFetching,
  }),
  useInternetIdentity: () => coreInfraMock.identity,
}));

const CONCEPTS = [
  { id: "octave", name: "Octave" },
  { id: "love", name: "Love" },
];

function entry(
  overrides: Partial<
    backendInterface["listNotebookEntries"] extends () => Promise<infer R>
      ? R extends Array<infer E>
        ? E
        : never
      : never
  > = {},
) {
  return {
    id: 1n,
    title: "Lifting the octave",
    body: "The octave lifts one level at a time.",
    conceptId: "octave",
    order: 1n,
    createdAt: 1_700_000_000_000_000_000n,
    updatedAt: 1_700_000_000_000_000_000n,
    ...overrides,
  };
}

beforeEach(() => {
  coreInfraMock.actor = createMockActor();
  coreInfraMock.isFetching = false;
  coreInfraMock.identity = createMockIdentity();
});

describe("NotebookPage", () => {
  it("prompts a signed-out visitor to sign in and does not query entries", async () => {
    const actor = createMockActor();
    coreInfraMock.actor = actor;
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: false });

    renderWithProviders(<NotebookPage />);

    expect(screen.getByTestId("notebook.signed_out_state")).toBeInTheDocument();
    expect(screen.getByTestId("notebook.sign_in_button")).toBeInTheDocument();
    // Entries are identity-scoped, so a signed-out visitor must not fetch them.
    expect(actor.listNotebookEntries).not.toHaveBeenCalled();
  });

  it("shows the empty state when the signed-in user has no entries", async () => {
    coreInfraMock.actor = createMockActor({
      listConcepts: vi.fn().mockResolvedValue(CONCEPTS),
      listNotebookEntries: vi.fn().mockResolvedValue([]),
    });
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: true });

    renderWithProviders(<NotebookPage />);

    expect(
      await screen.findByTestId("notebook.empty_state"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("notebook.count")).toHaveTextContent("0 entries");
  });

  it("lists the signed-in user's entries with concept and order labels", async () => {
    coreInfraMock.actor = createMockActor({
      listConcepts: vi.fn().mockResolvedValue(CONCEPTS),
      listNotebookEntries: vi.fn().mockResolvedValue([entry()]),
    });
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: true });

    renderWithProviders(<NotebookPage />);

    const item = await screen.findByTestId("notebook.item.1");
    expect(within(item).getByText("Lifting the octave")).toBeInTheDocument();
    expect(within(item).getByText("Octave")).toBeInTheDocument();
    // The order is shown with the app's own label for the first order.
    expect(within(item).getByText(ORDER_LABELS.first)).toBeInTheDocument();
    expect(screen.getByTestId("notebook.count")).toHaveTextContent("1 entry");
  });

  it("creates an entry through the actor with the chosen concept and order", async () => {
    const user = userEvent.setup();
    const createNotebookEntry = vi.fn().mockResolvedValue(2n);
    coreInfraMock.actor = createMockActor({
      listConcepts: vi.fn().mockResolvedValue(CONCEPTS),
      listNotebookEntries: vi.fn().mockResolvedValue([]),
      createNotebookEntry,
    });
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: true });

    renderWithProviders(<NotebookPage />);
    await screen.findByTestId("notebook.empty_state");

    await user.type(
      screen.getByTestId("notebook.title_input"),
      "My derivation",
    );
    await user.type(screen.getByTestId("notebook.body_input"), "Step one.");

    await user.click(screen.getByTestId("notebook.concept_select"));
    await user.click(await screen.findByRole("option", { name: "Love" }));

    await user.click(screen.getByTestId("notebook.submit_button"));

    await waitFor(() => {
      expect(createNotebookEntry).toHaveBeenCalledTimes(1);
    });
    // order "first" maps to index 1 in the local ladder.
    expect(createNotebookEntry).toHaveBeenCalledWith(
      "My derivation",
      "Step one.",
      "love",
      1n,
    );
  });

  it("refuses to save an incomplete draft and explains why", async () => {
    const user = userEvent.setup();
    const createNotebookEntry = vi.fn().mockResolvedValue(1n);
    coreInfraMock.actor = createMockActor({
      listConcepts: vi.fn().mockResolvedValue(CONCEPTS),
      listNotebookEntries: vi.fn().mockResolvedValue([]),
      createNotebookEntry,
    });
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: true });

    renderWithProviders(<NotebookPage />);
    await screen.findByTestId("notebook.empty_state");

    await user.type(screen.getByTestId("notebook.title_input"), "Only a title");
    await user.click(screen.getByTestId("notebook.submit_button"));

    expect(
      await screen.findByTestId("notebook.error_message"),
    ).toHaveTextContent(/add a title, a body, and a concept/i);
    expect(createNotebookEntry).not.toHaveBeenCalled();
  });

  it("deletes an entry only after the confirmation step", async () => {
    const user = userEvent.setup();
    const deleteNotebookEntry = vi
      .fn()
      .mockResolvedValue({ __kind__: "ok", ok: null });
    coreInfraMock.actor = createMockActor({
      listConcepts: vi.fn().mockResolvedValue(CONCEPTS),
      listNotebookEntries: vi.fn().mockResolvedValue([entry()]),
      deleteNotebookEntry,
    });
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: true });

    renderWithProviders(<NotebookPage />);
    await screen.findByTestId("notebook.item.1");

    await user.click(screen.getByTestId("notebook.delete_button.1"));
    // The destructive action is gated behind a confirmation.
    expect(deleteNotebookEntry).not.toHaveBeenCalled();
    expect(screen.getByTestId("notebook.delete_confirm.1")).toBeInTheDocument();

    await user.click(screen.getByTestId("notebook.confirm_button.1"));

    await waitFor(() => {
      expect(deleteNotebookEntry).toHaveBeenCalledWith(1n);
    });
  });

  it("saves edits to an existing entry through the actor", async () => {
    const user = userEvent.setup();
    const updateNotebookEntry = vi
      .fn()
      .mockResolvedValue({ __kind__: "ok", ok: null });
    coreInfraMock.actor = createMockActor({
      listConcepts: vi.fn().mockResolvedValue(CONCEPTS),
      listNotebookEntries: vi.fn().mockResolvedValue([entry()]),
      updateNotebookEntry,
    });
    coreInfraMock.identity = createMockIdentity({ isAuthenticated: true });

    renderWithProviders(<NotebookPage />);
    await screen.findByTestId("notebook.item.1");

    await user.click(screen.getByTestId("notebook.edit_button.1"));
    const titleInput = screen.getByTestId("notebook.edit_title_input.1");
    await user.clear(titleInput);
    await user.type(titleInput, "Revised title");
    await user.click(screen.getByTestId("notebook.save_button.1"));

    await waitFor(() => {
      expect(updateNotebookEntry).toHaveBeenCalledTimes(1);
    });
    expect(updateNotebookEntry).toHaveBeenCalledWith(
      1n,
      "Revised title",
      "The octave lifts one level at a time.",
      "octave",
      1n,
    );
  });
});
