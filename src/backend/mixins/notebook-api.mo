/// Public API of the theory notebook domain.
import Map "mo:core/Map";
import Result "mo:core/Result";
import Types "../types/notebook";
import NotebookLib "../lib/notebook";

mixin (
  entries : Map.Map<Types.EntryId, Types.NotebookEntry>,
  state : { var nextEntryId : Nat },
) {
  /// Create a notebook entry owned by the signed-in caller.
  public shared ({ caller }) func createNotebookEntry(
    title : Text,
    body : Text,
    conceptId : Types.ConceptId,
    order : Types.Order,
  ) : async Types.EntryId {
    NotebookLib.createEntry(entries, state, caller, title, body, conceptId, order);
  };

  /// List the signed-in caller's own notebook entries.
  public query ({ caller }) func listNotebookEntries() : async [Types.NotebookEntryView] {
    NotebookLib.listEntries(entries, caller);
  };

  /// Update one of the caller's own entries.
  public shared ({ caller }) func updateNotebookEntry(
    id : Types.EntryId,
    title : Text,
    body : Text,
    conceptId : Types.ConceptId,
    order : Types.Order,
  ) : async Result.Result<Types.NotebookEntryView, Types.NotebookError> {
    NotebookLib.updateEntry(entries, caller, id, title, body, conceptId, order);
  };

  /// Delete one of the caller's own entries.
  public shared ({ caller }) func deleteNotebookEntry(
    id : Types.EntryId,
  ) : async Result.Result<(), Types.NotebookError> {
    NotebookLib.deleteEntry(entries, caller, id);
  };

  /// The canonical concept index: ids, display names, and owning page.
  public query func listConcepts() : async [Types.Concept] {
    NotebookLib.listConcepts();
  };
};
