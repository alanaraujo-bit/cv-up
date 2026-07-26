"use client";

import { createStore } from "zustand";

import type { ResumeDocument } from "../schemas/document";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

/** Deep enough undo to recover from a bad afternoon, shallow enough to stay cheap. */
const HISTORY_LIMIT = 50;

/**
 * Consecutive edits inside this window collapse into one undo step, so undo
 * jumps back a phrase rather than a keystroke.
 */
const COALESCE_MS = 600;

export interface EditorState {
  document: ResumeDocument;
  past: ResumeDocument[];
  future: ResumeDocument[];
  lastPushAt: number;
  saveState: SaveState;
  lastSavedAt: Date | null;

  /** Field edits — coalesced into the previous history entry when rapid. */
  edit: (next: ResumeDocument) => void;
  /** Structural edits (add/remove/reorder) — always their own undo step. */
  commit: (next: ResumeDocument) => void;
  undo: () => void;
  redo: () => void;

  setSaveState: (state: SaveState) => void;
  markSaved: (at: Date) => void;
}

export type EditorStore = ReturnType<typeof createEditorStore>;

function pushHistory(past: ResumeDocument[], entry: ResumeDocument) {
  const next = [...past, entry];
  return next.length > HISTORY_LIMIT ? next.slice(-HISTORY_LIMIT) : next;
}

/**
 * One store per open resume. A module-level store would leak state between
 * resumes when navigating from one editor to another.
 */
export function createEditorStore(initial: ResumeDocument) {
  return createStore<EditorState>()((set) => ({
    document: initial,
    past: [],
    future: [],
    lastPushAt: 0,
    saveState: "idle",
    lastSavedAt: null,

    edit: (next) =>
      set((state) => {
        const now = Date.now();
        const coalesce = now - state.lastPushAt < COALESCE_MS;

        return {
          document: next,
          past: coalesce ? state.past : pushHistory(state.past, state.document),
          lastPushAt: coalesce ? state.lastPushAt : now,
          future: [],
          saveState: "dirty",
        };
      }),

    commit: (next) =>
      set((state) => ({
        document: next,
        past: pushHistory(state.past, state.document),
        lastPushAt: Date.now(),
        future: [],
        saveState: "dirty",
      })),

    undo: () =>
      set((state) => {
        const previous = state.past[state.past.length - 1];
        if (!previous) return state;

        return {
          document: previous,
          past: state.past.slice(0, -1),
          future: [state.document, ...state.future],
          // Force the next edit to start a fresh history entry.
          lastPushAt: 0,
          saveState: "dirty",
        };
      }),

    redo: () =>
      set((state) => {
        const next = state.future[0];
        if (!next) return state;

        return {
          document: next,
          past: pushHistory(state.past, state.document),
          future: state.future.slice(1),
          lastPushAt: 0,
          saveState: "dirty",
        };
      }),

    setSaveState: (saveState) => set({ saveState }),
    markSaved: (at) => set({ saveState: "saved", lastSavedAt: at }),
  }));
}
