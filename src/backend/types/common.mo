/// Cross-cutting types shared across domains.
module {
  /// A notebook entry identifier.
  public type EntryId = Nat;

  /// A concept identifier, e.g. "octave", "integral-level", "love".
  public type ConceptId = Text;

  /// An integral level / order in the user's octave framing.
  public type Order = Nat;

  /// Nanoseconds since the epoch (`Time.now()`).
  public type Timestamp = Int;
};
