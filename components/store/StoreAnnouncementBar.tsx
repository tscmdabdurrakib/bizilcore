"use client";

interface Props {
  message: string;
  expiresAt?: string | null;
}

export function StoreAnnouncementBar({ message, expiresAt }: Props) {
  if (!message) return null;
  if (expiresAt && new Date(expiresAt) < new Date()) return null;

  return (
    <div className="bg-black text-white text-center text-sm font-medium py-2.5 px-4">
      {message}
    </div>
  );
}
