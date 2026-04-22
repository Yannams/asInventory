import type { Article, Movement } from "@/lib/types";

export type StockStatus = "out" | "low" | "available";

export function getActiveMovements(movements: Movement[]) {
  return movements.filter((movement) => !movement.replacedByMovementId);
}

export function getArticleActiveMovements(articleId: string, movements: Movement[]) {
  return getActiveMovements(movements).filter((movement) => movement.articleId === articleId);
}

export function computeAvailableQty(articleId: string, movements: Movement[]) {
  return getActiveMovements(movements).reduce((total, movement) => {
    if (movement.articleId !== articleId) {
      return total;
    }

    if (movement.type === "entry") {
      return total + movement.quantity;
    }

    if (movement.type === "output") {
      return total - movement.quantity;
    }

    return total;
  }, 0);
}

export function hydrateArticlesWithStock(articles: Article[], movements: Movement[]) {
  return articles.map((article) => ({
    ...article,
    availableQty: Math.max(0, computeAvailableQty(article.id, movements)),
  }));
}

export function getMovementStockSnapshot(targetMovementId: string, movements: Movement[]) {
  const targetMovement = movements.find((movement) => movement.id === targetMovementId);

  if (!targetMovement) {
    return null;
  }

  const activeArticleMovements = getArticleActiveMovements(targetMovement.articleId, movements).sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()
  );

  let runningQty = 0;

  for (const movement of activeArticleMovements) {
    const stockBefore = runningQty;

    if (movement.type === "entry") {
      runningQty += movement.quantity;
    } else if (movement.type === "output") {
      runningQty = Math.max(0, runningQty - movement.quantity);
    }

    if (movement.id === targetMovementId) {
      return {
        stockBefore,
        stockAfter: runningQty,
      };
    }
  }

  return null;
}

export function getStockStatus(article: Pick<Article, "availableQty" | "alertThreshold">): StockStatus {
  if (article.availableQty <= 0) {
    return "out";
  }

  if (article.availableQty <= article.alertThreshold) {
    return "low";
  }

  return "available";
}

export function getStockStatusLabel(article: Pick<Article, "availableQty" | "alertThreshold">) {
  const status = getStockStatus(article);

  if (status === "out") {
    return "Rupture";
  }

  if (status === "low") {
    return "Sous seuil";
  }

  return "Disponible";
}
