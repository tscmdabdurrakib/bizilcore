"use client";

import { create } from "zustand";

interface UIState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
  activeSidebarTab: "settings" | "seo" | "revisions" | "comments" | "design";
  slashMenuOpen: boolean;
  slashMenuQuery: string;
  slashMenuBlockId: string | null;
  mediaLibraryOpen: boolean;
  mediaLibraryCallback: ((url: string, meta?: Record<string, unknown>) => void) | null;
  publishDialogOpen: boolean;
  highContrast: boolean;

  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftDrawerOpen: (v: boolean) => void;
  setRightDrawerOpen: (v: boolean) => void;
  setActiveSidebarTab: (tab: UIState["activeSidebarTab"]) => void;
  openSlashMenu: (blockId: string, query?: string) => void;
  closeSlashMenu: () => void;
  setSlashMenuQuery: (query: string) => void;
  openMediaLibrary: (cb: (url: string, meta?: Record<string, unknown>) => void) => void;
  closeMediaLibrary: () => void;
  setPublishDialogOpen: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
}

export const useEditorUIStore = create<UIState>((set) => ({
  leftPanelOpen: true,
  rightPanelOpen: true,
  leftDrawerOpen: false,
  rightDrawerOpen: false,
  activeSidebarTab: "settings",
  slashMenuOpen: false,
  slashMenuQuery: "",
  slashMenuBlockId: null,
  mediaLibraryOpen: false,
  mediaLibraryCallback: null,
  publishDialogOpen: false,
  highContrast: false,

  toggleLeftPanel: () => set(s => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set(s => ({ rightPanelOpen: !s.rightPanelOpen })),
  setLeftDrawerOpen: v => set({ leftDrawerOpen: v }),
  setRightDrawerOpen: v => set({ rightDrawerOpen: v }),
  setActiveSidebarTab: tab => set({ activeSidebarTab: tab }),
  openSlashMenu: (blockId, query = "") =>
    set({ slashMenuOpen: true, slashMenuBlockId: blockId, slashMenuQuery: query }),
  closeSlashMenu: () =>
    set({ slashMenuOpen: false, slashMenuBlockId: null, slashMenuQuery: "" }),
  setSlashMenuQuery: query => set({ slashMenuQuery: query }),
  openMediaLibrary: cb => set({ mediaLibraryOpen: true, mediaLibraryCallback: cb }),
  closeMediaLibrary: () => set({ mediaLibraryOpen: false, mediaLibraryCallback: null }),
  setPublishDialogOpen: v => set({ publishDialogOpen: v }),
  setHighContrast: v => set({ highContrast: v }),
}));
