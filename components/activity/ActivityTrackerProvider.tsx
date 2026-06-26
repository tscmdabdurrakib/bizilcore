"use client";

import { useActivityTracker } from "@/hooks/useActivityTracker";

export default function ActivityTrackerProvider() {
  useActivityTracker();
  return null;
}
