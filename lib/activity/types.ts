export type ActionType =
  | "page_view"
  | "page_leave"
  | "login"
  | "logout"
  | "order_created"
  | "order_status_changed"
  | "product_added"
  | "product_deleted"
  | "customer_added"
  | "sms_sent"
  | "facebook_connected"
  | "facebook_reply_sent"
  | "plan_upgraded"
  | "error";

export const FEATURE_ACTIONS: ActionType[] = [
  "order_created",
  "product_added",
  "customer_added",
  "sms_sent",
  "facebook_reply_sent",
];

export const ACTION_TO_FEATURE: Partial<Record<ActionType, string>> = {
  order_created: "orders",
  order_status_changed: "orders",
  product_added: "products",
  product_deleted: "products",
  customer_added: "customers",
  sms_sent: "sms",
  facebook_reply_sent: "facebook_reply",
};

export interface TrackUserActivityInput {
  userId: string;
  shopId?: string | null;
  actionType: ActionType | string;
  actionLabel?: string | null;
  pagePath?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  durationSeconds?: number | null;
  sessionId?: string | null;
}

export interface ActivityLogRow {
  id: string;
  userId: string;
  shopId: string | null;
  actionType: string;
  actionLabel: string | null;
  pagePath: string | null;
  metadata: Record<string, unknown>;
  durationSeconds: number | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
  shop?: { id: string; name: string } | null;
}
