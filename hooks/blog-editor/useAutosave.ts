"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useAutosaveMutation } from "./useBlogPost";
import { AUTOSAVE_INTERVAL_MS } from "@/lib/blog-editor/api-helpers";

export function useAutosave(postId: string) {
  const title = useEditorStore(s => s.title);
  const blocks = useEditorStore(s => s.blocks);
  const setSaveStatus = useEditorStore(s => s.setSaveStatus);
  const autosave = useAutosaveMutation(postId);
  const stateRef = useRef({ title, blocks });

  useEffect(() => {
    stateRef.current = { title, blocks };
  }, [title, blocks]);

  useEffect(() => {
    const timer = setInterval(async () => {
      const { title: t, blocks: b } = stateRef.current;
      setSaveStatus("saving");
      try {
        await autosave.mutateAsync({ title: t, content: b });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [postId, autosave, setSaveStatus]);

  const saveNow = async () => {
    const { title: t, blocks: b } = stateRef.current;
    setSaveStatus("saving");
    try {
      await autosave.mutateAsync({ title: t, content: b });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  return { saveNow };
}
