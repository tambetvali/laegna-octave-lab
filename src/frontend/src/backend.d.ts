import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cell {
    value: Value;
    name: string;
}
export interface Concept {
    id: ConceptId;
    name: string;
    page: string;
}
export type ConceptId = string;
export type EntryId = bigint;
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface NotebookEntryView {
    id: EntryId;
    title: string;
    order: Order;
    body: string;
    conceptId: ConceptId;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export type NotebookError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "notFound";
    notFound: EntryId;
};
export type Order = bigint;
export type Result = {
    __kind__: "ok";
    ok: NotebookEntryView;
} | {
    __kind__: "err";
    err: NotebookError;
};
export type Result_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: NotebookError;
};
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Create a notebook entry owned by the signed-in caller.
     */
    createNotebookEntry(title: string, body: string, conceptId: ConceptId, order: Order): Promise<EntryId>;
    /**
     * / Delete one of the caller's own entries.
     */
    deleteNotebookEntry(id: EntryId): Promise<Result_1>;
    execute(qJson: string): Promise<Result__1>;
    /**
     * / The backend's public API, as Markdown.
     */
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / The canonical concept index: ids, display names, and owning page.
     */
    listConcepts(): Promise<Array<Concept>>;
    /**
     * / List the signed-in caller's own notebook entries.
     */
    listNotebookEntries(): Promise<Array<NotebookEntryView>>;
    schema(): Promise<string>;
    /**
     * / Update one of the caller's own entries.
     */
    updateNotebookEntry(id: EntryId, title: string, body: string, conceptId: ConceptId, order: Order): Promise<Result>;
}
