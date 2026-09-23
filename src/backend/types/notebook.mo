/// Types for the theory notebook domain: user-owned entries attached to a
/// concept and an integral level, plus the read-only concept index.
import Common "common";

module {
  public type EntryId = Common.EntryId;
  public type ConceptId = Common.ConceptId;
  public type Order = Common.Order;
  public type Timestamp = Common.Timestamp;

  /// A notebook entry as stored. `owner` is the caller principal that created
  /// it; `createdAt`/`updatedAt` are nanosecond timestamps.
  public type NotebookEntry = {
    id : EntryId;
    owner : Principal;
    title : Text;
    body : Text;
    conceptId : ConceptId;
    order : Order;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// The shared (Candid) view of an entry returned by the public API.
  public type NotebookEntryView = {
    id : EntryId;
    title : Text;
    body : Text;
    conceptId : ConceptId;
    order : Order;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  /// A canonical concept in the index: its id, display name, and the page or
  /// simulator it belongs to.
  public type Concept = {
    id : ConceptId;
    name : Text;
    page : Text;
  };

  /// Caller-fixable failures of notebook mutations.
  public type NotebookError = {
    #notFound : EntryId;
    #notAuthorized;
  };
};
