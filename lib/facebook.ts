const GRAPH_URL = "https://graph.facebook.com/v19.0";
const APP_ID = process.env.FACEBOOK_APP_ID ?? "";
const APP_SECRET = process.env.FACEBOOK_APP_SECRET ?? "";
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN ?? "";

export const ORDER_KEYWORDS = ["নেব", "চাই", "অর্ডার", "দিন", "পাঠান", "buy", "order", "inbox", "কিনব", "বুক"];

export function getFacebookOAuthURL(redirectUri: string): string {
  const scopes = ["pages_read_engagement", "pages_manage_metadata", "pages_read_user_content"].join(",");
  return `https://www.facebook.com/v19.0/dialog/oauth?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
  const url = `${GRAPH_URL}/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("FB code exchange failed");
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.access_token;
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const url = `${GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${shortToken}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("FB long-lived token exchange failed");
  const data = await res.json();
  return data.access_token ?? shortToken;
}

export async function getUserPages(userToken: string): Promise<{ id: string; name: string; access_token: string }[]> {
  const res = await fetch(`${GRAPH_URL}/me/accounts?access_token=${userToken}`);
  if (!res.ok) throw new Error("FB get pages failed");
  const data = await res.json();
  return data.data ?? [];
}

export async function getPagePosts(pageId: string, pageToken: string, limit = 10) {
  const fields = "id,message,created_time,comments{message,from,created_time,id}";
  const res = await fetch(`${GRAPH_URL}/${pageId}/feed?fields=${fields}&limit=${limit}&access_token=${pageToken}`);
  if (!res.ok) throw new Error("FB get posts failed");
  const data = await res.json();
  return data.data ?? [];
}

export function looksLikeOrder(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return ORDER_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

export function verifyWebhook(mode: string, token: string, challenge: string): string | null {
  if (mode === "subscribe" && token === VERIFY_TOKEN) return challenge;
  return null;
}

export { VERIFY_TOKEN };
