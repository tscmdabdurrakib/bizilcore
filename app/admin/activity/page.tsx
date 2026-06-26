"use client";

import { useState } from "react";
import ActivityStatsCards from "./components/ActivityStatsCards";
import LiveFeed from "./components/LiveFeed";
import UserTimeline from "./components/UserTimeline";
import FeatureHeatmap from "./components/FeatureHeatmap";
import AlertCards from "./components/AlertCards";

export default function AdminActivityPage() {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  return (
    <div className="space-y-6">
      <ActivityStatsCards />

      <AlertCards
        onSelectUser={(userId) => {
          setSelectedUserId(userId);
          setSelectedShopId(null);
        }}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <LiveFeed />
        <UserTimeline
          initialShopId={selectedShopId}
          initialUserId={selectedUserId}
        />
      </div>

      <FeatureHeatmap
        onShopClick={(shopId) => {
          setSelectedShopId(shopId);
          setSelectedUserId("");
        }}
      />
    </div>
  );
}
