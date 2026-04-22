import { supabase } from "@/lib/supabase/client";
import type { Article, Brand, Category, Movement, StockCondition } from "@/lib/types";

type BrandRow = {
  id: string;
  name: string;
};

type CategoryRow = {
  id: string;
  brand_id: string | null;
  name: string;
};

type ArticleRow = {
  id: string;
  brand_id: string | null;
  category_id: string | null;
  name: string;
  reference: string;
  unit: string;
  alert_threshold: number;
  created_at: string;
};

type MovementRow = {
  id: string;
  article_id: string;
  type: "entry" | "output";
  quantity: number;
  actor: string;
  source: string | null;
  condition: StockCondition | null;
  note: string | null;
  created_at: string;
};

export function isSupabaseInventoryEnabled() {
  return Boolean(supabase);
}

function mapBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    brandId: row.brand_id ?? "",
    name: row.name,
  };
}

function mapArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    name: row.name,
    brandId: row.brand_id ?? "",
    categoryId: row.category_id ?? "",
    reference: row.reference,
    availableQty: 0,
    alertThreshold: row.alert_threshold,
    unit: row.unit,
  };
}

function mapMovement(row: MovementRow): Movement {
  return {
    id: row.id,
    articleId: row.article_id,
    type: row.type,
    quantity: row.quantity,
    actor: row.actor,
    source: row.source ?? undefined,
    condition: row.condition ?? undefined,
    date: row.created_at,
    note: row.note ?? "",
  };
}

export async function fetchInventoryFromSupabase() {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const [brandsResult, categoriesResult, articlesResult, movementsResult] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("categories").select("id, brand_id, name").order("name"),
    supabase
      .from("articles")
      .select("id, brand_id, category_id, name, reference, unit, alert_threshold, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("stock_movements")
      .select("id, article_id, type, quantity, actor, source, condition, note, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (brandsResult.error) {
    throw brandsResult.error;
  }

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  if (articlesResult.error) {
    throw articlesResult.error;
  }

  if (movementsResult.error) {
    throw movementsResult.error;
  }

  return {
    brands: (brandsResult.data ?? []).map(mapBrand),
    categories: (categoriesResult.data ?? []).map(mapCategory),
    articles: (articlesResult.data ?? []).map(mapArticle),
    movements: (movementsResult.data ?? []).map(mapMovement),
  };
}

export async function insertBrandInSupabase(input: { name: string }) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("brands")
    .insert({ name: input.name })
    .select("id, name")
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapBrand(result.data);
}

export async function updateBrandInSupabase(brandId: string, input: { name: string }) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("brands")
    .update({ name: input.name })
    .eq("id", brandId)
    .select("id, name")
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapBrand(result.data);
}

export async function deleteBrandInSupabase(brandId: string) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase.from("brands").delete().eq("id", brandId);

  if (result.error) {
    throw result.error;
  }
}

export async function insertCategoryInSupabase(input: { brandId: string; name: string }) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("categories")
    .insert({
      brand_id: input.brandId,
      name: input.name,
    })
    .select("id, brand_id, name")
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapCategory(result.data);
}

export async function updateCategoryInSupabase(
  categoryId: string,
  input: { brandId: string; name: string }
) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("categories")
    .update({
      brand_id: input.brandId,
      name: input.name,
    })
    .eq("id", categoryId)
    .select("id, brand_id, name")
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapCategory(result.data);
}

export async function deleteCategoryInSupabase(categoryId: string) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase.from("categories").delete().eq("id", categoryId);

  if (result.error) {
    throw result.error;
  }
}

export async function syncArticlesBrandForCategoryInSupabase(categoryId: string, brandId: string) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("articles")
    .update({ brand_id: brandId })
    .eq("category_id", categoryId);

  if (result.error) {
    throw result.error;
  }
}

export async function insertArticleInSupabase(input: {
  brandId: string;
  categoryId: string;
  name: string;
  reference: string;
  unit: string;
  alertThreshold: number;
}) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("articles")
    .insert({
      brand_id: input.brandId,
      category_id: input.categoryId,
      name: input.name,
      reference: input.reference,
      unit: input.unit,
      alert_threshold: input.alertThreshold,
    })
    .select("id, brand_id, category_id, name, reference, unit, alert_threshold, created_at")
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapArticle(result.data);
}

export async function insertMovementInSupabase(input: {
  articleId: string;
  type: "entry" | "output";
  quantity: number;
  actor: string;
  source?: string;
  condition?: StockCondition;
  note: string;
}) {
  if (!supabase) {
    throw new Error("Supabase n'est pas configure.");
  }

  const result = await supabase
    .from("stock_movements")
    .insert({
      article_id: input.articleId,
      type: input.type,
      quantity: input.quantity,
      actor: input.actor,
      source: input.source ?? null,
      condition: input.condition ?? null,
      note: input.note,
    })
    .select("id, article_id, type, quantity, actor, source, condition, note, created_at")
    .single();

  if (result.error) {
    throw result.error;
  }

  return mapMovement(result.data);
}
