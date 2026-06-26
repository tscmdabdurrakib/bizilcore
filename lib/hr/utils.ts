export function parseStaffList(data: unknown) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "staffMembers" in data) {
    return (data as { staffMembers: unknown[] }).staffMembers ?? [];
  }
  return [];
}
