import type { Article, MovementType, RequestStatus, StockCondition } from "@/lib/types";

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(input: string) {
  return shortDateFormatter.format(new Date(input));
}

export function formatDateTime(input: string) {
  return dateTimeFormatter.format(new Date(input));
}

export function formatQuantity(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

export function getStockHealth(article: Article) {
  if (article.availableQty <= article.alertThreshold) {
    return "critical";
  }

  if (article.availableQty <= article.alertThreshold * 1.5) {
    return "watch";
  }

  return "healthy";
}

export function getStockHealthLabel(article: Article) {
  const health = getStockHealth(article);

  if (health === "critical") {
    return "Sous seuil";
  }

  if (health === "watch") {
    return "A surveiller";
  }

  return "Stable";
}

export function getRequestStatusLabel(status: RequestStatus) {
  if (status === "pending") {
    return "En attente";
  }

  if (status === "approved") {
    return "Valid\u00e9e";
  }

  return "Refus\u00e9e";
}

export function getMovementTypeLabel(type: MovementType) {
  const labels: Record<MovementType, string> = {
    entry: "Entr\u00e9e",
    output: "Sortie",
    adjustment: "Ajustement",
    approval: "Validation",
    rejection: "Refus",
    cancellation: "Annulation",
    return: "Retour",
  };

  return labels[type];
}

export function getConditionLabel(condition: StockCondition) {
  const labels: Record<StockCondition, string> = {
    new: "Neuf",
    good: "Bon \u00e9tat",
    maintenance: "Maintenance",
    used: "Utilis\u00e9",
  };

  return labels[condition];
}
