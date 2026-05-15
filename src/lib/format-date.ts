
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Not set"
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date)
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Not set"
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date)
}

export { formatDate, formatDateTime }

