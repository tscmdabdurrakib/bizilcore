export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskCategory = "order" | "delivery" | "supplier" | "accounts" | "general";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export function getPriorityStyle(priority: TaskPriority) {
  switch (priority) {
    case "urgent": return { label: "জরুরি", color: "#DC2626", bg: "#FEE2E2" };
    case "high":   return { label: "হাই",   color: "#EA580C", bg: "#FFEDD5" };
    case "medium": return { label: "মিডিয়াম", color: "#CA8A04", bg: "#FEF9C3" };
    case "low":    return { label: "লো",    color: "#16A34A", bg: "#DCFCE7" };
    default:       return { label: "মিডিয়াম", color: "#CA8A04", bg: "#FEF9C3" };
  }
}

export function getStatusLabel(status: TaskStatus) {
  switch (status) {
    case "todo":        return "করতে হবে";
    case "in_progress": return "চলছে";
    case "review":      return "রিভিউ";
    case "done":        return "সম্পন্ন";
    default:            return status;
  }
}

export function getCategoryLabel(category: TaskCategory) {
  switch (category) {
    case "order":    return "অর্ডার";
    case "delivery": return "ডেলিভারি";
    case "supplier": return "সাপ্লায়ার";
    case "accounts": return "অ্যাকাউন্টস";
    case "general":  return "সাধারণ";
    default:         return category;
  }
}
