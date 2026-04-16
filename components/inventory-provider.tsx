"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { inventorySeed } from "@/lib/mock-data";
import type {
  EntryDraft,
  InventoryState,
  Movement,
  RequestDraft,
  StockEntry,
  StockRequest,
} from "@/lib/types";

type InventoryContextValue = InventoryState & {
  addEntry: (draft: EntryDraft) => void;
  createRequest: (draft: RequestDraft) => void;
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string, comment: string) => boolean;
};

const STORAGE_KEY = "as-world-tech-inventory-v3";

const InventoryContext = createContext<InventoryContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InventoryState>(inventorySeed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as InventoryState;
        setState(parsed);
      }
    } catch (_error) {
      setState(inventorySeed);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const addEntry = (draft: EntryDraft) => {
    startTransition(() => {
      setState((current) => {
        const entry: StockEntry = {
          id: createId("ent"),
          articleId: draft.articleId,
          quantity: draft.quantity,
          source: draft.source,
          date: new Date().toISOString(),
          recordedBy: draft.recordedBy,
          note: draft.note,
        };

        const movement: Movement = {
          id: createId("mov"),
          type: "entry",
          articleId: draft.articleId,
          quantity: draft.quantity,
          actor: draft.recordedBy,
          date: entry.date,
          note: draft.note || `Entree enregistree depuis ${draft.source}`,
        };

        return {
          ...current,
          articles: current.articles.map((article) =>
            article.id === draft.articleId
              ? { ...article, availableQty: article.availableQty + draft.quantity }
              : article
          ),
          entries: [entry, ...current.entries],
          movements: [movement, ...current.movements],
        };
      });
    });
  };

  const createRequest = (draft: RequestDraft) => {
    startTransition(() => {
      setState((current) => {
        const request: StockRequest = {
          id: createId("req"),
          requester: draft.requester,
          articleId: draft.articleId,
          quantity: draft.quantity,
          reason: draft.reason,
          jobReference: draft.jobReference,
          status: "pending",
          requestedAt: new Date().toISOString(),
          reviewComment: draft.note,
        };

        return {
          ...current,
          requests: [request, ...current.requests],
        };
      });
    });
  };

  const approveRequest = (requestId: string) => {
    startTransition(() => {
      setState((current) => {
        const target = current.requests.find((request) => request.id === requestId);

        if (!target || target.status !== "pending") {
          return current;
        }

        const reviewedAt = new Date().toISOString();

        const approvalMovement: Movement = {
          id: createId("mov"),
          type: "approval",
          articleId: target.articleId,
          quantity: target.quantity,
          actor: "Responsable terrain",
          relatedRequestId: target.id,
          date: reviewedAt,
          note: `Validation ${target.jobReference}`,
        };

        const outputMovement: Movement = {
          id: createId("mov"),
          type: "output",
          articleId: target.articleId,
          quantity: target.quantity,
          actor: target.requester,
          relatedRequestId: target.id,
          date: reviewedAt,
          note: target.reason,
        };

        return {
          ...current,
          articles: current.articles.map((article) =>
            article.id === target.articleId
              ? { ...article, availableQty: Math.max(0, article.availableQty - target.quantity) }
              : article
          ),
          requests: current.requests.map((request) =>
            request.id === requestId
              ? { ...request, status: "approved", reviewComment: "Sortie validee" }
              : request
          ),
          movements: [outputMovement, approvalMovement, ...current.movements],
        };
      });
    });
  };

  const rejectRequest = (requestId: string, comment: string) => {
    if (!comment.trim()) {
      return false;
    }

    startTransition(() => {
      setState((current) => {
        const target = current.requests.find((request) => request.id === requestId);

        if (!target || target.status !== "pending") {
          return current;
        }

        const rejectionMovement: Movement = {
          id: createId("mov"),
          type: "rejection",
          articleId: target.articleId,
          quantity: target.quantity,
          actor: "Responsable terrain",
          relatedRequestId: target.id,
          date: new Date().toISOString(),
          note: comment,
        };

        return {
          ...current,
          requests: current.requests.map((request) =>
            request.id === requestId
              ? { ...request, status: "rejected", reviewComment: comment }
              : request
          ),
          movements: [rejectionMovement, ...current.movements],
        };
      });
    });

    return true;
  };

  return (
    <InventoryContext.Provider
      value={{
        ...state,
        addEntry,
        createRequest,
        approveRequest,
        rejectRequest,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);

  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }

  return context;
}
