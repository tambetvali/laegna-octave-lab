/// Service-discoverability documentation for the theory notebook backend.
/// Static Markdown only — this mixin reads no state and takes no parameters.
mixin () {
  /// The backend's public API, as Markdown.
  public query func getApiDoc() : async Text {
    "# Theory Notebook Backend\n\n" #
    "A small canister that stores the user's theory notebook: entries attached to a\n" #
    "concept and an integral level, plus a static concept index that links essays,\n" #
    "simulators, and notebook entries. The framing follows the octave / integral\n" #
    "level / love / transcendence / rank space vocabulary of the three home sites\n" #
    "(spireason.neocities.org, laegna.notaku.site, github.com/tambetvali).\n\n" #
    "## Authentication and identity\n\n" #
    "Every notebook method is scoped to the caller's principal. There is no\n" #
    "anonymous read or write: `createNotebookEntry`, `listNotebookEntries`,\n" #
    "`updateNotebookEntry`, and `deleteNotebookEntry` all use the caller principal\n" #
    "as the owner key, so an anonymous caller owns nothing and sees nothing.\n\n" #
    "The app's frontend pins an Internet Identity derivation origin, published at\n" #
    "`/.well-known/ii-derivation-origin` when available. An agent that already holds\n" #
    "the user's Internet Identity authorization derives the correct per-app\n" #
    "principal against that origin, for example:\n\n" #
    "    icp identity link web <name> --app <host>\n\n" #
    "Such a delegation acts with the user's full authority in this app until it\n" #
    "expires.\n\n" #
    "### Registration prerequisite\n\n" #
    "Authorization state is separate from notebook ownership. A principal is\n" #
    "registered only when it signs in through the app's own frontend, which calls\n" #
    "`_internet_identity_sign_in_finish` (or `_initialize_access_control`). A direct\n" #
    "API caller must therefore register once before any role-guarded call:\n\n" #
    "1. Call `_initialize_access_control()` as a signed-in (non-anonymous) caller.\n" #
    "   The first principal to do so becomes `#admin`; every later principal becomes\n" #
    "   `#user`.\n" #
    "2. Then call `getCallerUserRole()` / `isCallerAdmin()`.\n\n" #
    "A caller can be unregistered even when the app already knows it: registration\n" #
    "happens only through the app's frontend, so a principal that never signed in\n" #
    "there is unregistered even if it belongs to the app's owner. A signed-in caller\n" #
    "derived against a different origin is a different principal than the one the\n" #
    "frontend registered.\n\n" #
    "Unregistered and anonymous callers receive:\n\n" #
    "- `getCallerUserRole()` — anonymous callers get `#guest`; a signed-in but\n" #
    "  unregistered caller traps with `User is not registered`.\n" #
    "- `isCallerAdmin()` — same rule, because it reads the role first.\n" #
    "- `assignCallerUserRole(user, role)` — traps with\n" #
    "  `Unauthorized: Only admins can assign user roles` unless the caller is\n" #
    "  `#admin`.\n\n" #
    "Notebook CRUD does not consult roles; it is scoped purely by principal\n" #
    "ownership.\n\n" #
    "## Notebook entries\n\n" #
    "An entry is `{ id, title, body, conceptId, order, createdAt, updatedAt }` as\n" #
    "returned to callers. The stored record additionally carries `owner`, which is\n" #
    "never exposed by the public API.\n\n" #
    "- `createNotebookEntry(title : Text, body : Text, conceptId : Text, order : Nat) : async Nat`\n" #
    "  — creates an entry owned by the caller and returns its new `id`. `id` values\n" #
    "  are assigned from a monotonically increasing counter and are never reused.\n" #
    "- `listNotebookEntries() : async [NotebookEntryView]`\n" #
    "  — the caller's own entries, newest first by `createdAt`. A query call.\n" #
    "- `updateNotebookEntry(id : Nat, title : Text, body : Text, conceptId : Text, order : Nat) : async Result<NotebookEntryView, NotebookError>`\n" #
    "  — replaces the mutable fields of an entry the caller owns and refreshes\n" #
    "  `updatedAt`. `createdAt` and `owner` are preserved.\n" #
    "- `deleteNotebookEntry(id : Nat) : async Result<(), NotebookError>`\n" #
    "  — removes an entry the caller owns.\n\n" #
    "`NotebookError` is a variant:\n\n" #
    "- `#notFound(id)` — no entry with that id exists.\n" #
    "- `#notAuthorized` — the entry exists but belongs to a different principal.\n\n" #
    "Ownership rules: entries are scoped to the caller's principal. `update` and\n" #
    "`delete` return `#notFound` when the id is unknown and `#notAuthorized` when the\n" #
    "entry belongs to someone else. `listNotebookEntries` silently omits other\n" #
    "principals' entries.\n\n" #
    "## Concepts\n\n" #
    "`listConcepts() : async [Concept]` returns the static concept index. Each\n" #
    "`Concept` is `{ id, name, page }`, where `page` is `\"theory\"` or `\"simulator\"`.\n" #
    "The canonical concept ids are:\n\n" #
    "- `octave`\n" #
    "- `integral-level`\n" #
    "- `love`\n" #
    "- `transcendence`\n" #
    "- `rank-space`\n" #
    "- `projection`\n" #
    "- `fourier`\n" #
    "- `gaussian`\n\n" #
    "`conceptId` on an entry is free-form `Text`; the index above is the canonical\n" #
    "set the frontend links against, not a validated enum.\n\n" #
    "## Query surface (OQL)\n\n" #
    "The canister exposes the Caffeine OQL surface for the Data Intelligence agent:\n\n" #
    "- `schema() : async Text` — a JSON schema document. Entities the caller cannot\n" #
    "  read are hidden, along with edges to them.\n" #
    "- `execute(qJson : Text) : async Result` — runs a JSON query and returns a\n" #
    "  typed Candid result. An unparseable query traps with\n" #
    "  `OQL: invalid query — <reason>`.\n\n" #
    "The exposed entity is `notebookEntries` (type `NotebookEntry`), keyed by `id`\n" #
    "and owned by the `owner` field. Its authorization is `controllerOrScoped`:\n" #
    "controllers read every row, and any other caller reads only the rows its\n" #
    "principal owns. This is the same ownership rule as the CRUD methods, so a\n" #
    "caller can never see another principal's entries through a query or a join.\n\n" #
    "## Units and encodings\n\n" #
    "- `id` and `order` are `Nat`.\n" #
    "- `createdAt` and `updatedAt` are `Int` nanosecond timestamps since the Unix\n" #
    "  epoch (`Time.now()`). Divide by 1_000_000_000 for seconds.\n" #
    "- `conceptId` is `Text`.\n" #
    "- `owner` is a `Principal` and is not part of the returned view.\n" #
    "- `order` is the entry's integral level index in the user's octave framing: a\n" #
    "  non-negative integer where 0 is the base level and each increment moves one\n" #
    "  integral level up. It is a label, not a sort key — `listNotebookEntries`\n" #
    "  orders by `createdAt`, not by `order`.\n\n" #
    "## Lifecycle, retries, and gotchas\n\n" #
    "- `createNotebookEntry` is not idempotent: each call allocates a new id and a\n" #
    "  new entry. Retrying a create after a timeout produces a duplicate.\n" #
    "- `updateNotebookEntry` and `deleteNotebookEntry` are idempotent in effect for\n" #
    "  an existing entry, but a retried `delete` returns `#notFound(id)` because the\n" #
    "  entry is already gone.\n" #
    "- `listNotebookEntries`, `listConcepts`, `schema`, and `getApiDoc` are query\n" #
    "  calls and are safe to poll.\n" #
    "- `createNotebookEntry` returns the id directly; there is no separate lookup\n" #
    "  endpoint, so keep the returned id.\n" #
    "- `updateNotebookEntry` replaces `title`, `body`, `conceptId`, and `order`\n" #
    "  wholesale — omitted fields are not preserved, because all four are required\n" #
    "  parameters.\n" #
    "- `getCallerUserRole` traps for a signed-in but unregistered caller rather than\n" #
    "  returning a default; call `_initialize_access_control` first.\n";
  };
};
