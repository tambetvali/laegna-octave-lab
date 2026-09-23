/// Domain logic for the theory notebook: entry CRUD scoped to the caller's
/// principal, and the static concept index.
import Map "mo:core/Map";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Types "../types/notebook";

module {
  /// The canonical concept index. Static data — no state.
  public func listConcepts() : [Types.Concept] {
    [
      { id = "octave"; name = "Octave"; page = "theory" },
      { id = "integral-level"; name = "Integral Level"; page = "theory" },
      { id = "love"; name = "Love"; page = "theory" },
      { id = "transcendence"; name = "Transcendence"; page = "theory" },
      { id = "rank-space"; name = "Rank Space"; page = "theory" },
      { id = "projection"; name = "Projection"; page = "simulator" },
      { id = "fourier"; name = "Fourier"; page = "simulator" },
      { id = "gaussian"; name = "Gaussian"; page = "simulator" },
    ];
  };

  /// Create an entry owned by `owner`; returns the new entry's id.
  public func createEntry(
    entries : Map.Map<Types.EntryId, Types.NotebookEntry>,
    state : { var nextEntryId : Nat },
    owner : Principal,
    title : Text,
    body : Text,
    conceptId : Types.ConceptId,
    order : Types.Order,
  ) : Types.EntryId {
    let id = state.nextEntryId;
    state.nextEntryId := id + 1;
    let now = Time.now();
    entries.add(id, {
      id;
      owner;
      title;
      body;
      conceptId;
      order;
      createdAt = now;
      updatedAt = now;
    });
    id;
  };

  /// All entries owned by `owner`, newest first.
  public func listEntries(
    entries : Map.Map<Types.EntryId, Types.NotebookEntry>,
    owner : Principal,
  ) : [Types.NotebookEntryView] {
    let owned = entries.values().filter(func entry = entry.owner == owner).toArray();
    let sorted = owned.sort(func (a, b) = if (a.createdAt > b.createdAt) { #less } else if (a.createdAt < b.createdAt) { #greater } else { #equal });
    sorted.map(toView);
  };

  /// Update an entry the caller owns. `#notFound` when no such entry exists,
  /// `#notAuthorized` when it belongs to someone else.
  public func updateEntry(
    entries : Map.Map<Types.EntryId, Types.NotebookEntry>,
    caller : Principal,
    id : Types.EntryId,
    title : Text,
    body : Text,
    conceptId : Types.ConceptId,
    order : Types.Order,
  ) : Result.Result<Types.NotebookEntryView, Types.NotebookError> {
    switch (entries.get(id)) {
      case null { #err(#notFound(id)) };
      case (?entry) {
        if (entry.owner != caller) {
          return #err(#notAuthorized);
        };
        let updated : Types.NotebookEntry = {
          id = entry.id;
          owner = entry.owner;
          title;
          body;
          conceptId;
          order;
          createdAt = entry.createdAt;
          updatedAt = Time.now();
        };
        entries.add(id, updated);
        #ok(toView(updated));
      };
    };
  };

  /// Delete an entry the caller owns.
  public func deleteEntry(
    entries : Map.Map<Types.EntryId, Types.NotebookEntry>,
    caller : Principal,
    id : Types.EntryId,
  ) : Result.Result<(), Types.NotebookError> {
    switch (entries.get(id)) {
      case null { #err(#notFound(id)) };
      case (?entry) {
        if (entry.owner != caller) {
          return #err(#notAuthorized);
        };
        entries.remove(id);
        #ok(());
      };
    };
  };

  /// Project a stored entry onto its shared view (drops `owner`).
  public func toView(entry : Types.NotebookEntry) : Types.NotebookEntryView {
    {
      id = entry.id;
      title = entry.title;
      body = entry.body;
      conceptId = entry.conceptId;
      order = entry.order;
      createdAt = entry.createdAt;
      updatedAt = entry.updatedAt;
    };
  };
};
