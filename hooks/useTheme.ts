"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bizilcore-dark";

function readDark(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function applyDark(on: boolean) {
  document.documentElement.classList.toggle("dark", on);
  localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
}

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const saved = readDark();
    setIsDark(saved);
    applyDark(saved);

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const next = e.newValue === "1";
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setDark = useCallback((on: boolean) => {
    setIsDark(on);
    applyDark(on);
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      applyDark(next);
      return next;
    });
  }, []);

  return { isDark, setDark, toggle };
}
