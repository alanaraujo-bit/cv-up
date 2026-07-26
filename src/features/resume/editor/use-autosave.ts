"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAction } from "next-safe-action/hooks";

import { saveResumeDocumentAction } from "../actions";
import { useEditorStore, useEditorStoreApi } from "./store-provider";

/** Long enough to batch a burst of typing, short enough to feel automatic. */
const DEBOUNCE_MS = 900;

/**
 * Persists the document whenever it goes dirty.
 *
 * The timer is armed by the *first* unsaved change rather than reset by every
 * keystroke: a true debounce would postpone the save indefinitely while
 * someone types a long paragraph. Because the document is read from the store
 * at fire time, the save still carries the newest state either way.
 */
export function useAutosave(resumeId: string) {
  const store = useEditorStoreApi();
  const saveState = useEditorStore((state) => state.saveState);

  const { executeAsync } = useAction(saveResumeDocumentAction);

  // Guards against an older in-flight save resolving after a newer one.
  const requestId = useRef(0);

  const save = useCallback(async () => {
    const { document, setSaveState, markSaved } = store.getState();
    const id = ++requestId.current;
    setSaveState("saving");

    try {
      const result = await executeAsync({ resumeId, document });
      if (id !== requestId.current) return;

      if (result?.data) markSaved(new Date());
      else setSaveState("error");
    } catch {
      if (id === requestId.current) store.getState().setSaveState("error");
    }
  }, [store, executeAsync, resumeId]);

  useEffect(() => {
    if (saveState !== "dirty") return;

    const timer = setTimeout(() => void save(), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [saveState, save]);

  // Unsaved work must not disappear silently on a reload or a closed tab.
  useEffect(() => {
    if (saveState !== "dirty" && saveState !== "saving") return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);
}
