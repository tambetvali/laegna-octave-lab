import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.listNotebookEntries()).resolves.toEqual([]);
});

it("returns the canonical concept index", async () => {
  const concepts = await actor.listConcepts();
  expect(concepts.length).toBeGreaterThan(0);
  expect(concepts).toContainEqual(
    expect.objectContaining({ id: "octave", name: "Octave" }),
  );
});

it("round-trips a notebook entry through the real canister", async () => {
  const id = await actor.createNotebookEntry(
    "Lifting the octave",
    "The lift is not a bigger number.",
    "octave",
    1n,
  );
  const entries = await actor.listNotebookEntries();
  expect(entries).toContainEqual(
    expect.objectContaining({
      id,
      title: "Lifting the octave",
      body: "The lift is not a bigger number.",
      conceptId: "octave",
      order: 1n,
    }),
  );
});

it("updates and deletes an entry the caller owns", async () => {
  const id = await actor.createNotebookEntry("Draft", "Body", "love", 0n);

  // The declarations' actor decodes a Candid variant as `{ ok: ... }` /
  // `{ err: ... }` — not the `__kind__` shape the TypeScript wrapper uses.
  const updated = await actor.updateNotebookEntry(
    id,
    "Revised",
    "New body",
    "love",
    2n,
  );
  expect("ok" in updated).toBe(true);
  if ("ok" in updated) {
    expect(updated.ok).toMatchObject({ title: "Revised", order: 2n });
  }

  const deleted = await actor.deleteNotebookEntry(id);
  expect("ok" in deleted).toBe(true);
  const remaining = await actor.listNotebookEntries();
  expect(remaining.some((entry) => entry.id === id)).toBe(false);
});

it("reports notFound when updating an entry that does not exist", async () => {
  const result = await actor.updateNotebookEntry(9999n, "x", "y", "octave", 0n);
  expect("err" in result).toBe(true);
  if ("err" in result) {
    expect("notFound" in result.err).toBe(true);
  }
});

it("does not show one caller's entries to another", async () => {
  const alice = createIdentity("alice");
  const bob = createIdentity("bob");

  actor.setIdentity(alice);
  await actor.createNotebookEntry("Alice's note", "private", "octave", 0n);

  actor.setIdentity(bob);
  const bobEntries = await actor.listNotebookEntries();
  expect(bobEntries).toEqual([]);
});

it("rejects one caller updating another caller's entry", async () => {
  const alice = createIdentity("alice");
  const bob = createIdentity("bob");

  actor.setIdentity(alice);
  const id = await actor.createNotebookEntry("Alice's note", "private", "octave", 0n);

  actor.setIdentity(bob);
  const result = await actor.updateNotebookEntry(id, "hijacked", "x", "octave", 0n);
  expect("err" in result).toBe(true);
  if ("err" in result) {
    expect("notAuthorized" in result.err).toBe(true);
  }
});
