import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MapEntity "mo:caffeineai-oql/MapEntity";
import Entity "mo:caffeineai-oql/Entity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";
import Types "types/notebook";
import NotebookApi "mixins/notebook-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // Notebook entries keyed by id; ownership lives in the `owner` field.
  let notebookEntries : Map.Map<Types.EntryId, Types.NotebookEntry>;
  let notebookState : { var nextEntryId : Nat };

  include NotebookApi(notebookEntries, notebookState);

  include ApiDocMixin();

  include Expose({
    entities = [
      notebookEntries.toEntity("notebookEntry", "NotebookEntry", "id")
        .sample({
          id = 0;
          owner = Principal.fromText("aaaaa-aa");
          title = "";
          body = "";
          conceptId = "";
          order = 0;
          createdAt = 0;
          updatedAt = 0;
        })
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });
};
