/// Initial migration: the previously deployed actor had no stable fields, so
/// this introduces the notebook state (entries, id counter) and the
/// authorization state.
import Map "mo:core/Map";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type EntryId = Nat;
  type ConceptId = Text;
  type Order = Nat;
  type Timestamp = Int;

  type NotebookEntry = {
    id : EntryId;
    owner : Principal;
    title : Text;
    body : Text;
    conceptId : ConceptId;
    order : Order;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    notebookEntries : Map.Map<EntryId, NotebookEntry>;
    notebookState : { var nextEntryId : Nat };
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      notebookEntries = Map.empty();
      notebookState = { var nextEntryId = 0 };
    };
  };
};
