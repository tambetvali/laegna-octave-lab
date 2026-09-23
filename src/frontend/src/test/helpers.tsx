import type { backendInterface } from "@/backend";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderResult, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * The module mock for `@caffeineai/core-infrastructure` must be registered with
 * a top-level `vi.mock` call in each test file — Vitest only hoists top-level
 * `vi.mock` statements, so a helper function cannot install it. The holder must
 * also be created with `vi.hoisted`, because the factory runs above the test
 * file's imports. Copy this snippet into a test file that renders a page using
 * `useActor` or `useInternetIdentity`, then set `coreInfraMock.actor` and
 * `coreInfraMock.identity` per test before rendering:
 *
 * ```ts
 * const coreInfraMock = vi.hoisted(() => ({
 *   actor: null as unknown,
 *   isFetching: false,
 *   identity: {
 *     isAuthenticated: false,
 *     isInitializing: false,
 *     login: vi.fn(),
 *     clear: vi.fn(),
 *   } as MockIdentity,
 * }));
 *
 * vi.mock("@caffeineai/core-infrastructure", () => ({
 *   useActor: () => ({
 *     actor: coreInfraMock.actor,
 *     isFetching: coreInfraMock.isFetching,
 *   }),
 *   useInternetIdentity: () => coreInfraMock.identity,
 * }));
 * ```
 */

/**
 * A typed local stand-in for the app's backend actor. Every method the pages
 * call is present; tests override only the ones they exercise. This is a mock
 * seam — it proves the frontend's contract with the actor, never the canister.
 */
export type MockActor = {
  [K in keyof backendInterface]: ReturnType<typeof vi.fn>;
};

/** Build a mock actor whose methods all resolve to empty/neutral values. */
export function createMockActor(
  overrides: Partial<Record<keyof backendInterface, unknown>> = {},
): MockActor {
  const base = {
    _initialize_access_control: vi.fn().mockResolvedValue(undefined),
    _internet_identity_sign_in_finish: vi
      .fn()
      .mockResolvedValue({ __kind__: "ok", ok: null }),
    _internet_identity_sign_in_start: vi
      .fn()
      .mockResolvedValue(new Uint8Array()),
    assignCallerUserRole: vi.fn().mockResolvedValue(undefined),
    createNotebookEntry: vi.fn().mockResolvedValue(1n),
    deleteNotebookEntry: vi
      .fn()
      .mockResolvedValue({ __kind__: "ok", ok: null }),
    execute: vi.fn().mockResolvedValue({ hasMore: false, rows: [] }),
    getApiDoc: vi.fn().mockResolvedValue(""),
    getCallerUserRole: vi.fn().mockResolvedValue("guest"),
    isCallerAdmin: vi.fn().mockResolvedValue(false),
    listConcepts: vi.fn().mockResolvedValue([]),
    listNotebookEntries: vi.fn().mockResolvedValue([]),
    schema: vi.fn().mockResolvedValue(""),
    updateNotebookEntry: vi
      .fn()
      .mockResolvedValue({ __kind__: "ok", ok: null }),
  };
  return { ...base, ...overrides } as unknown as MockActor;
}

/** The identity context shape the pages read. */
export interface MockIdentity {
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: () => void;
  clear: () => void;
}

/** Build an identity context with sensible signed-out defaults. */
export function createMockIdentity(
  overrides: Partial<MockIdentity> = {},
): MockIdentity {
  return {
    isAuthenticated: false,
    isInitializing: false,
    login: vi.fn(),
    clear: vi.fn(),
    ...overrides,
  };
}

/**
 * Render a component inside a fresh React Query provider. The app's own
 * `main.tsx` wraps everything in `QueryClientProvider`, so tests must too.
 */
export function renderWithProviders(ui: ReactElement): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
