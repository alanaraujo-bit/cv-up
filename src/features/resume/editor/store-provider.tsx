"use client";

import { createContext, useContext, useState } from "react";
import { useStore } from "zustand";

import type { ResumeDocument } from "../schemas/document";
import { createEditorStore, type EditorState, type EditorStore } from "./store";

const EditorStoreContext = createContext<EditorStore | null>(null);

export function EditorStoreProvider({
  initialDocument,
  children,
}: {
  initialDocument: ResumeDocument;
  children: React.ReactNode;
}) {
  // Created once per mount, so opening another resume starts a clean history.
  const [store] = useState(() => createEditorStore(initialDocument));

  return (
    <EditorStoreContext.Provider value={store}>
      {children}
    </EditorStoreContext.Provider>
  );
}

export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  return useStore(useEditorStoreApi(), selector);
}

/**
 * The store itself, for reading a snapshot without subscribing — used by
 * autosave, which needs the newest document at fire time but must not re-render
 * on every keystroke.
 */
export function useEditorStoreApi(): EditorStore {
  const store = useContext(EditorStoreContext);
  if (!store) {
    throw new Error("useEditorStore must be used inside <EditorStoreProvider>");
  }
  return store;
}
