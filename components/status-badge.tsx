import { Badge } from "@/components/ui/badge";
import {
  getConditionLabel,
  getMovementTypeLabel,
  getRequestStatusLabel,
} from "@/lib/format";
import { getStockStatus, getStockStatusLabel } from "@/lib/stock";
import type { Article, MovementType, RequestStatus, StockCondition } from "@/lib/types";

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  if (status === "approved") {
    return <Badge variant="default">{getRequestStatusLabel(status)}</Badge>;
  }

  if (status === "rejected") {
    return <Badge variant="neutral">{getRequestStatusLabel(status)}</Badge>;
  }

  return <Badge variant="warning">{getRequestStatusLabel(status)}</Badge>;
}

export function MovementTypeBadge({ type }: { type: MovementType }) {
  if (type === "output" || type === "rejection" || type === "cancellation") {
    return <Badge variant="warning">{getMovementTypeLabel(type)}</Badge>;
  }

  if (type === "approval" || type === "entry" || type === "return") {
    return <Badge variant="default">{getMovementTypeLabel(type)}</Badge>;
  }

  return <Badge variant="neutral">{getMovementTypeLabel(type)}</Badge>;
}

export function StockHealthBadge({ article }: { article: Article }) {
  const health = getStockStatus(article);

  if (health === "available") {
    return <Badge variant="default">{getStockStatusLabel(article)}</Badge>;
  }

  if (health === "low") {
    return <Badge variant="warning">{getStockStatusLabel(article)}</Badge>;
  }

  return <Badge variant="neutral">{getStockStatusLabel(article)}</Badge>;
}

export function ConditionBadge({ condition }: { condition: StockCondition }) {
  if (condition === "new") {
    return <Badge variant="default">{getConditionLabel(condition)}</Badge>;
  }

  return <Badge variant="neutral">{getConditionLabel(condition)}</Badge>;
}
