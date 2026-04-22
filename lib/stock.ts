import type { Article, Movement } from "@/lib/types";

export type StockStatus = "out" | "low" | "available";

export function computeAvailableQty(articleId: string, movements: Movement[]) {
  return movements.reduce((total, movement) => {
    if (movement.articleId !== articleId) {
      return total;
    }

    if (movement.type === "entry" || movement.type === "adjustment" || movement.type === "return") {
      return total + movement.quantity;
    }

    if (movement.type === "output" || movement.type === "cancellation") {
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
