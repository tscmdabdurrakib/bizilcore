"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { BlockNode, BlockType, BlogPostDTO, SaveStatus } from "@/lib/blog-editor/types";
import {
  cloneBlocks,
  createBlock,
  createEmptyDocument,
  moveBlock,
  removeBlockFromTree,
  updateBlockTree,
  insertBlockAt,
} from "@/lib/blog-editor/utils/blocks";

const MAX_HISTORY = 50;

function sanitizePostMeta(post: BlogPostDTO): Partial<BlogPostDTO> {
  const { content: _content, ...meta } = post;
  return meta;
}

interface HistoryEntry {
  blocks: BlockNode[];
  title: string;
}

interface EditorState {
  postId: string | null;
  title: string;
  blocks: BlockNode[];
  selectedBlockId: string | null;
  focusBlockId: string | null;
  contentVersion: number;
  saveStatus: SaveStatus;
  focusMode: boolean;
  fullscreen: boolean;
  contentWidth: number;
  readOnly: boolean;
  history: HistoryEntry[];
  historyIndex: number;
  postMeta: Partial<BlogPostDTO>;

  initPost: (post: BlogPostDTO) => void;
  setTitle: (title: string) => void;
  setBlocks: (blocks: BlockNode[]) => void;
  setSelectedBlockId: (id: string | null) => void;
  setFocusBlockId: (id: string | null) => void;
  bumpContentVersion: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setFocusMode: (on: boolean) => void;
  setFullscreen: (on: boolean) => void;
  setContentWidth: (w: number) => void;
  setReadOnly: (on: boolean) => void;
  setPostMeta: (meta: Partial<BlogPostDTO>) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  addBlock: (type: BlockType, index?: number, attrs?: Record<string, unknown>) => void;
  updateBlock: (id: string, updater: (block: BlockNode) => BlockNode) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlockUp: (id: string) => void;
  moveBlockDown: (id: string) => void;
  reorderBlocks: (from: number, to: number) => void;
  transformBlock: (id: string, type: BlockType) => void;
  addInnerBlock: (parentId: string, type: BlockType) => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    postId: null,
    title: "Untitled",
    blocks: createEmptyDocument(),
    selectedBlockId: null,
    focusBlockId: null,
    contentVersion: 0,
    saveStatus: "idle",
    focusMode: false,
    fullscreen: false,
    contentWidth: 720,
    readOnly: false,
    history: [],
    historyIndex: -1,
    postMeta: {},

    initPost: post => {
      const blocks = post.content?.length
        ? cloneBlocks(post.content)
        : createEmptyDocument();
      const clonedBlocks = cloneBlocks(blocks);
      set(state => {
        state.postId = post.id;
        state.title = post.title;
        state.blocks = clonedBlocks;
        state.postMeta = sanitizePostMeta(post);
        state.history = [{ blocks: cloneBlocks(clonedBlocks), title: post.title }];
        state.historyIndex = 0;
        state.contentVersion = 0;
        state.focusBlockId = clonedBlocks[0]?.id ?? null;
      });
    },

    setTitle: title => set(state => { state.title = title; }),
    setBlocks: blocks => set(state => {
      state.blocks = blocks.length ? blocks : createEmptyDocument();
      state.contentVersion += 1;
    }),
    setSelectedBlockId: id => set(state => { state.selectedBlockId = id; }),
    setFocusBlockId: id => set(state => { state.focusBlockId = id; }),
    bumpContentVersion: () => set(state => { state.contentVersion += 1; }),
    setSaveStatus: status => set(state => { state.saveStatus = status; }),
    setFocusMode: on => set(state => { state.focusMode = on; }),
    setFullscreen: on => set(state => { state.fullscreen = on; }),
    setContentWidth: w => set(state => { state.contentWidth = w; }),
    setReadOnly: on => set(state => { state.readOnly = on; }),
    setPostMeta: meta => set(state => { state.postMeta = { ...state.postMeta, ...meta }; }),

    pushHistory: () => {
      const { blocks, title, history, historyIndex } = get();
      const entry: HistoryEntry = { blocks: cloneBlocks(blocks), title };
      const next = history.slice(0, historyIndex + 1);
      next.push(entry);
      if (next.length > MAX_HISTORY) next.shift();
      set(state => {
        state.history = next;
        state.historyIndex = next.length - 1;
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;
      const prev = history[historyIndex - 1];
      set(state => {
        state.blocks = cloneBlocks(prev.blocks);
        state.title = prev.title;
        state.historyIndex = historyIndex - 1;
        state.contentVersion += 1;
      });
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      const next = history[historyIndex + 1];
      set(state => {
        state.blocks = cloneBlocks(next.blocks);
        state.title = next.title;
        state.historyIndex = historyIndex + 1;
        state.contentVersion += 1;
      });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    addBlock: (type, index, attrs) => {
      get().pushHistory();
      const block = createBlock(type, attrs);
      set(state => {
        const idx = index ?? state.blocks.length;
        state.blocks = insertBlockAt(state.blocks, idx, block);
        state.selectedBlockId = block.id;
        state.focusBlockId = block.id;
      });
    },

    updateBlock: (id, updater) => {
      set(state => {
        state.blocks = updateBlockTree(state.blocks, id, updater);
      });
    },

    removeBlock: id => {
      get().pushHistory();
      set(state => {
        const idx = state.blocks.findIndex(b => b.id === id);
        state.blocks = removeBlockFromTree(state.blocks, id);
        if (state.blocks.length === 0) state.blocks = createEmptyDocument();
        if (state.selectedBlockId === id) state.selectedBlockId = null;
        const focusIdx = Math.max(0, idx - 1);
        state.focusBlockId = state.blocks[focusIdx]?.id ?? state.blocks[0]?.id ?? null;
        state.contentVersion += 1;
      });
    },

    duplicateBlock: id => {
      get().pushHistory();
      const { blocks } = get();
      const idx = blocks.findIndex(b => b.id === id);
      if (idx === -1) return;
      const copy = cloneBlocks([blocks[idx]])[0];
      copy.id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      set(state => {
        state.blocks = insertBlockAt(state.blocks, idx + 1, copy);
      });
    },

    moveBlockUp: id => {
      const idx = get().blocks.findIndex(b => b.id === id);
      if (idx <= 0) return;
      get().pushHistory();
      set(state => { state.blocks = moveBlock(state.blocks, idx, idx - 1); });
    },

    moveBlockDown: id => {
      const idx = get().blocks.findIndex(b => b.id === id);
      if (idx === -1 || idx >= get().blocks.length - 1) return;
      get().pushHistory();
      set(state => { state.blocks = moveBlock(state.blocks, idx, idx + 1); });
    },

    reorderBlocks: (from, to) => {
      get().pushHistory();
      set(state => { state.blocks = moveBlock(state.blocks, from, to); });
    },

    transformBlock: (id, type) => {
      get().pushHistory();
      set(state => {
        state.blocks = updateBlockTree(state.blocks, id, block => ({
          ...createBlock(type),
          id: block.id,
          content: block.content,
        }));
      });
    },

    addInnerBlock: (parentId, type) => {
      get().pushHistory();
      const block = createBlock(type);
      set(state => {
        state.blocks = updateBlockTree(state.blocks, parentId, parent => ({
          ...parent,
          innerBlocks: [...(parent.innerBlocks ?? []), block],
        }));
        state.selectedBlockId = block.id;
        state.focusBlockId = block.id;
      });
    },
  }))
);
