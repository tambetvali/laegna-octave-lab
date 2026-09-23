import { createActor } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { type Order as LocalOrder, ORDER_LABELS } from "@/lib/octave";
import { useActor, useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BookOpen,
  LogIn,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

/** The three local orders, in ladder order. */
const ORDERS: LocalOrder[] = ["zeroeth", "first", "second"];

/** Convert a Motoko nanosecond timestamp into a Date, or null when invalid. */
function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a backend timestamp for display. */
function formatTimestamp(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** A short, readable excerpt of an entry body. */
function excerpt(body: string, max = 180): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

/** The draft held in local state while the user writes an entry. */
interface EntryDraft {
  title: string;
  body: string;
  conceptId: string;
  order: LocalOrder;
}

const EMPTY_DRAFT: EntryDraft = {
  title: "",
  body: "",
  conceptId: "",
  order: "first",
};

/** The notebook — the user's own derivations, stored on the canister. */
export function NotebookPage() {
  const { actor, isFetching } = useActor(createActor);
  const { isAuthenticated, isInitializing, login } = useInternetIdentity();
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editDraft, setEditDraft] = useState<EntryDraft>(EMPTY_DRAFT);
  const [pendingDeleteId, setPendingDeleteId] = useState<bigint | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const conceptsQuery = useQuery({
    queryKey: ["concepts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listConcepts();
    },
    enabled: !!actor && !isFetching,
  });

  const entriesQuery = useQuery({
    queryKey: ["notebookEntries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listNotebookEntries();
    },
    enabled: !!actor && !isFetching && isAuthenticated,
  });

  const concepts = conceptsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];

  const conceptName = (id: string) =>
    concepts.find((concept) => concept.id === id)?.name ?? id;

  const createEntry = useMutation({
    mutationFn: async (payload: EntryDraft) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createNotebookEntry(
        payload.title.trim(),
        payload.body.trim(),
        payload.conceptId,
        BigInt(ORDERS.indexOf(payload.order)),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notebookEntries"] });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async (payload: { id: bigint; draft: EntryDraft }) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.updateNotebookEntry(
        payload.id,
        payload.draft.title.trim(),
        payload.draft.body.trim(),
        payload.draft.conceptId,
        BigInt(ORDERS.indexOf(payload.draft.order)),
      );
      if (result.__kind__ === "err")
        throw new Error("Could not save the entry");
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notebookEntries"] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      const result = await actor.deleteNotebookEntry(id);
      if (result.__kind__ === "err")
        throw new Error("Could not delete the entry");
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notebookEntries"] });
    },
  });

  const draftValid =
    draft.title.trim().length > 0 &&
    draft.body.trim().length > 0 &&
    draft.conceptId.length > 0;

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftValid) {
      setFormError("Add a title, a body, and a concept before saving.");
      return;
    }
    setFormError(null);
    const captured = draft;
    setDraft(EMPTY_DRAFT);
    createEntry.mutate(captured, {
      onError: () => {
        setFormError("The entry could not be saved. Your draft is still here.");
        setDraft((current) =>
          current.title === "" && current.body === "" ? captured : current,
        );
      },
    });
  }

  function startEditing(entry: {
    id: bigint;
    title: string;
    body: string;
    conceptId: string;
    order: bigint;
  }) {
    setEditingId(entry.id);
    setEditDraft({
      title: entry.title,
      body: entry.body,
      conceptId: entry.conceptId,
      order: ORDERS[Number(entry.order)] ?? "first",
    });
  }

  function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) return;
    if (
      editDraft.title.trim().length === 0 ||
      editDraft.body.trim().length === 0 ||
      editDraft.conceptId.length === 0
    ) {
      setFormError("Add a title, a body, and a concept before saving.");
      return;
    }
    setFormError(null);
    updateEntry.mutate(
      { id: editingId, draft: editDraft },
      { onSuccess: () => setEditingId(null) },
    );
  }

  const signedOut = !isInitializing && !isAuthenticated;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <header className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Theory notebook
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Your own derivations, kept on the ladder
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Write down what you work out. Each entry attaches to a concept and an
          integral order, so the theory and your own notes stay connected.
        </p>
      </header>

      {signedOut ? (
        <section
          className="surface-output mt-10 flex flex-col items-start p-8"
          data-ocid="notebook.signed_out_state"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
            <LogIn className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-lg font-semibold">
            Sign in to open your notebook
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Entries are stored against your identity, so only you can read and
            edit them. Sign in to start writing.
          </p>
          <Button
            type="button"
            className="mt-5"
            onClick={() => login()}
            data-ocid="notebook.sign_in_button"
          >
            <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Sign in
          </Button>
        </section>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Entries */}
          <section aria-label="Notebook entries">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">
                Your entries
              </h2>
              {entriesQuery.isSuccess ? (
                <span
                  className="readout text-xs text-muted-foreground"
                  data-ocid="notebook.count"
                >
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
              ) : null}
            </div>

            {entriesQuery.isLoading ? (
              <div
                className="space-y-3"
                aria-busy="true"
                data-ocid="notebook.loading_state"
              >
                {Array.from({ length: 3 }, (_, i) => `entry-skeleton-${i}`).map(
                  (id) => (
                    <div key={id} className="surface-output p-5">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="mt-3 h-3 w-full" />
                      <Skeleton className="mt-2 h-3 w-4/5" />
                    </div>
                  ),
                )}
              </div>
            ) : entriesQuery.isError ? (
              <div
                className="surface-output flex flex-col items-start p-6"
                data-ocid="notebook.error_state"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/15 text-destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm text-foreground">
                  Your entries could not be loaded.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void entriesQuery.refetch()}
                  data-ocid="notebook.retry_button"
                >
                  Try again
                </Button>
              </div>
            ) : entries.length === 0 ? (
              <div
                className="surface-output flex flex-col items-start p-8"
                data-ocid="notebook.empty_state"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">
                  Nothing written yet
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Start with the idea you are working on right now. Attach it to
                  a concept and an order, and it will sit alongside the theory.
                </p>
              </div>
            ) : (
              <ul className="space-y-3" data-ocid="notebook.list">
                {entries.map((entry, i) => {
                  const isEditing = editingId === entry.id;
                  const isDeleting = pendingDeleteId === entry.id;
                  return (
                    <li
                      key={entry.id.toString()}
                      className="surface-output p-5"
                      data-ocid={`notebook.item.${i + 1}`}
                    >
                      {isEditing ? (
                        <form onSubmit={handleUpdate} className="space-y-3">
                          <div>
                            <Label
                              htmlFor={`edit-title-${entry.id}`}
                              className="text-xs uppercase tracking-widest"
                            >
                              Title
                            </Label>
                            <Input
                              id={`edit-title-${entry.id}`}
                              value={editDraft.title}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  title: e.target.value,
                                }))
                              }
                              className="surface-input mt-1.5"
                              data-ocid={`notebook.edit_title_input.${i + 1}`}
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor={`edit-body-${entry.id}`}
                              className="text-xs uppercase tracking-widest"
                            >
                              Body
                            </Label>
                            <Textarea
                              id={`edit-body-${entry.id}`}
                              value={editDraft.body}
                              onChange={(e) =>
                                setEditDraft((d) => ({
                                  ...d,
                                  body: e.target.value,
                                }))
                              }
                              rows={5}
                              className="surface-input mt-1.5"
                              data-ocid={`notebook.edit_body_input.${i + 1}`}
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <Label
                                htmlFor={`edit-concept-${entry.id}`}
                                className="text-xs uppercase tracking-widest"
                              >
                                Concept
                              </Label>
                              <Select
                                value={editDraft.conceptId}
                                onValueChange={(value) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    conceptId: value,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  id={`edit-concept-${entry.id}`}
                                  className="surface-input mt-1.5"
                                  data-ocid={`notebook.edit_concept_select.${i + 1}`}
                                >
                                  <SelectValue placeholder="Choose a concept" />
                                </SelectTrigger>
                                <SelectContent>
                                  {concepts.map((concept) => (
                                    <SelectItem
                                      key={concept.id}
                                      value={concept.id}
                                    >
                                      {concept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label
                                htmlFor={`edit-order-${entry.id}`}
                                className="text-xs uppercase tracking-widest"
                              >
                                Integral order
                              </Label>
                              <Select
                                value={editDraft.order}
                                onValueChange={(value) =>
                                  setEditDraft((d) => ({
                                    ...d,
                                    order: value as LocalOrder,
                                  }))
                                }
                              >
                                <SelectTrigger
                                  id={`edit-order-${entry.id}`}
                                  className="surface-input mt-1.5"
                                  data-ocid={`notebook.edit_order_select.${i + 1}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {ORDERS.map((order) => (
                                    <SelectItem key={order} value={order}>
                                      {ORDER_LABELS[order]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              type="submit"
                              size="sm"
                              disabled={updateEntry.isPending}
                              data-ocid={`notebook.save_button.${i + 1}`}
                            >
                              {updateEntry.isPending
                                ? "Saving…"
                                : "Save changes"}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingId(null)}
                              data-ocid={`notebook.cancel_button.${i + 1}`}
                            >
                              <X
                                className="mr-1.5 h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate font-display text-base font-semibold">
                                {entry.title}
                              </h3>
                              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {conceptName(entry.conceptId)}
                                </Badge>
                                <span className="readout text-[11px] text-muted-foreground">
                                  {
                                    ORDER_LABELS[
                                      ORDERS[Number(entry.order)] ?? "first"
                                    ]
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${entry.title}`}
                                onClick={() => startEditing(entry)}
                                data-ocid={`notebook.edit_button.${i + 1}`}
                              >
                                <Pencil
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${entry.title}`}
                                onClick={() => setPendingDeleteId(entry.id)}
                                data-ocid={`notebook.delete_button.${i + 1}`}
                              >
                                <Trash2
                                  className="h-4 w-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {excerpt(entry.body)}
                          </p>
                          <p className="readout mt-3 text-[11px] text-muted-foreground">
                            updated {formatTimestamp(entry.updatedAt)}
                          </p>

                          {isDeleting ? (
                            <div
                              className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3"
                              data-ocid={`notebook.delete_confirm.${i + 1}`}
                            >
                              <p className="text-xs text-foreground">
                                Delete this entry? This cannot be undone.
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={deleteEntry.isPending}
                                  onClick={() =>
                                    deleteEntry.mutate(entry.id, {
                                      onSuccess: () => setPendingDeleteId(null),
                                    })
                                  }
                                  data-ocid={`notebook.confirm_button.${i + 1}`}
                                >
                                  {deleteEntry.isPending
                                    ? "Deleting…"
                                    : "Delete"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPendingDeleteId(null)}
                                  data-ocid={`notebook.cancel_delete_button.${i + 1}`}
                                >
                                  Keep it
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* New entry */}
          <section
            className="surface-output h-fit p-5 lg:sticky lg:top-24"
            aria-label="New notebook entry"
            data-ocid="notebook.new_entry_panel"
          >
            <header className="mb-4">
              <h2 className="font-display text-lg font-semibold">New entry</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Attach it to a concept and an order.
              </p>
            </header>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label
                  htmlFor="entry-title"
                  className="text-xs uppercase tracking-widest"
                >
                  Title
                </Label>
                <Input
                  id="entry-title"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Lifting the octave one level"
                  className="surface-input mt-1.5"
                  data-ocid="notebook.title_input"
                />
              </div>

              <div>
                <Label
                  htmlFor="entry-body"
                  className="text-xs uppercase tracking-widest"
                >
                  Body
                </Label>
                <Textarea
                  id="entry-body"
                  value={draft.body}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, body: e.target.value }))
                  }
                  rows={6}
                  placeholder="What did you work out? Write the derivation, the intuition, or the counterexample."
                  className="surface-input mt-1.5"
                  data-ocid="notebook.body_input"
                />
              </div>

              <div>
                <Label
                  htmlFor="entry-concept"
                  className="text-xs uppercase tracking-widest"
                >
                  Concept
                </Label>
                <Select
                  value={draft.conceptId}
                  onValueChange={(value) =>
                    setDraft((d) => ({ ...d, conceptId: value }))
                  }
                >
                  <SelectTrigger
                    id="entry-concept"
                    className="surface-input mt-1.5"
                    data-ocid="notebook.concept_select"
                  >
                    <SelectValue placeholder="Choose a concept" />
                  </SelectTrigger>
                  <SelectContent>
                    {concepts.map((concept) => (
                      <SelectItem key={concept.id} value={concept.id}>
                        {concept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="entry-order"
                  className="text-xs uppercase tracking-widest"
                >
                  Integral order
                </Label>
                <Select
                  value={draft.order}
                  onValueChange={(value) =>
                    setDraft((d) => ({ ...d, order: value as LocalOrder }))
                  }
                >
                  <SelectTrigger
                    id="entry-order"
                    className="surface-input mt-1.5"
                    data-ocid="notebook.order_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDERS.map((order) => (
                      <SelectItem key={order} value={order}>
                        {ORDER_LABELS[order]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formError ? (
                <p
                  className="text-xs text-destructive"
                  role="alert"
                  data-ocid="notebook.error_message"
                >
                  {formError}
                </p>
              ) : null}

              <Button
                type="submit"
                className="w-full"
                disabled={createEntry.isPending}
                data-ocid="notebook.submit_button"
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {createEntry.isPending ? "Saving…" : "Save entry"}
              </Button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
