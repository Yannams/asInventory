"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { inventorySeed } from "@/lib/mock-data";
import { getActiveMovements, hydrateArticlesWithStock } from "@/lib/stock";
import {
  clearMovementReplacementInSupabase,
  deleteArticleInSupabase,
  deleteBrandInSupabase,
  deleteCategoryInSupabase,
  deleteMovementInSupabase,
  fetchInventoryFromSupabase,
  insertArticleInSupabase,
  insertBrandInSupabase,
  insertCategoryInSupabase,
  insertMovementInSupabase,
  isSupabaseInventoryEnabled,
  markMovementAsReplacedInSupabase,
  syncArticlesBrandForCategoryInSupabase,
  updateArticleInSupabase,
  updateBrandInSupabase,
  updateCategoryInSupabase,
} from "@/lib/supabase/inventory";
import type {
  Article,
  ArticleDraft,
  ArticleUpdateDraft,
  Brand,
  BrandDraft,
  Category,
  CategoryDraft,
  EntryDraft,
  InventoryState,
  LocationDraft,
  Movement,
  MovementUpdateDraft,
  MutationResult,
  OutputDraft,
  RequestDraft,
  StockCondition,
  StockEntry,
  StockRequest,
} from "@/lib/types";

type InventoryContextValue = InventoryState & {
  isLoading: boolean;
  syncMode: "supabase" | "demo";
  syncError: string | null;
  refreshInventory: () => Promise<void>;
  createArticle: (draft: ArticleDraft) => MutationResult;
  updateArticle: (articleId: string, draft: ArticleUpdateDraft) => MutationResult;
  deleteArticle: (articleId: string) => MutationResult;
  addEntry: (draft: EntryDraft) => MutationResult;
  addOutput: (draft: OutputDraft) => MutationResult;
  updateMovement: (movementId: string, draft: MovementUpdateDraft) => MutationResult;
  deleteMovement: (movementId: string) => MutationResult;
  createRequest: (_draft: RequestDraft) => void;
  approveRequest: (_requestId: string) => void;
  rejectRequest: (_requestId: string, _comment: string) => boolean;
  createBrand: (_draft: BrandDraft) => MutationResult;
  updateBrand: (_brandId: string, _draft: BrandDraft) => MutationResult;
  deleteBrand: (_brandId: string) => MutationResult;
  createCategory: (_draft: CategoryDraft) => MutationResult;
  updateCategory: (_categoryId: string, _draft: CategoryDraft) => MutationResult;
  deleteCategory: (_categoryId: string) => MutationResult;
  createLocation: (_draft: LocationDraft) => MutationResult;
  updateLocation: (_locationId: string, _draft: LocationDraft) => MutationResult;
  deleteLocation: (_locationId: string) => MutationResult;
};

const STORAGE_KEY = "asuka-inventory-mvp-stock-v5";
const InventoryContext = createContext<InventoryContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildDemoSeed() {
  return {
    brands: inventorySeed.brands,
    categories: inventorySeed.categories,
    articles: inventorySeed.articles,
    movements: inventorySeed.movements
      .filter((movement) => movement.type === "entry" || movement.type === "output")
      .map((movement) => {
        if (movement.type === "entry") {
          const relatedEntry = inventorySeed.entries.find(
            (entry) => entry.id.replace("ent", "mov") === movement.id
          );

          return {
            ...movement,
            source: relatedEntry?.source ?? "Reception",
            condition: relatedEntry?.condition ?? ("new" as StockCondition),
          };
        }

        return movement;
      }),
  };
}

function loadDemoState() {
  const fallback = buildDemoSeed();

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<{
      brands: Brand[];
      categories: Category[];
      articles: Article[];
      movements: Movement[];
    }>;

    return {
      brands: parsed.brands?.length ? parsed.brands : fallback.brands,
      categories: parsed.categories?.length ? parsed.categories : fallback.categories,
      articles: parsed.articles?.length ? parsed.articles : fallback.articles,
      movements: parsed.movements?.length ? parsed.movements : fallback.movements,
    };
  } catch (_error) {
    return fallback;
  }
}

function saveDemoState(payload: {
  brands: Brand[];
  categories: Category[];
  articles: Article[];
  movements: Movement[];
}) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function buildDerivedEntries(movements: Movement[]): StockEntry[] {
  return getActiveMovements(movements)
    .filter((movement) => movement.type === "entry")
    .map((movement) => ({
      id: movement.id,
      articleId: movement.articleId,
      quantity: movement.quantity,
      source: movement.source ?? "Reception",
      condition: movement.condition ?? "new",
      date: movement.date,
      recordedBy: movement.actor,
      note: movement.note,
    }));
}

function getMovementSyncErrorLabel(action: "create" | "update") {
  return action === "update"
    ? "Mouvement non mis à jour avec Supabase."
    : "Mouvement non synchronisé avec Supabase.";
}

function buildLegacyFailure(message: string): MutationResult {
  return { ok: false, message };
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const demoSeed = useMemo(() => loadDemoState(), []);
  const [brands, setBrands] = useState<Brand[]>(demoSeed.brands);
  const [categories, setCategories] = useState<Category[]>(demoSeed.categories);
  const [baseArticles, setBaseArticles] = useState<Article[]>(demoSeed.articles);
  const [movements, setMovements] = useState<Movement[]>(demoSeed.movements);
  const [isLoading, setIsLoading] = useState(isSupabaseInventoryEnabled());
  const [syncMode, setSyncMode] = useState<"supabase" | "demo">(
    isSupabaseInventoryEnabled() ? "supabase" : "demo"
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  const liveStateRef = useRef({
    brands,
    categories,
    baseArticles,
    movements,
    syncMode,
  });

  useEffect(() => {
    liveStateRef.current = {
      brands,
      categories,
      baseArticles,
      movements,
      syncMode,
    };
  }, [baseArticles, brands, categories, movements, syncMode]);

  const refreshInventory = async () => {
    if (!isSupabaseInventoryEnabled()) {
      setSyncMode("demo");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const remote = await fetchInventoryFromSupabase();
      setBrands(remote.brands);
      setCategories(remote.categories);
      setBaseArticles(remote.articles);
      setMovements(remote.movements);
      setSyncMode("supabase");
      setSyncError(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de charger Supabase. Passage en mode demo local.";

      const demo = loadDemoState();
      setBrands(demo.brands);
      setCategories(demo.categories);
      setBaseArticles(demo.articles);
      setMovements(demo.movements);
      setSyncMode("demo");
      setSyncError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshInventory();
  }, []);

  useEffect(() => {
    if (syncMode === "demo") {
      saveDemoState({ brands, categories, articles: baseArticles, movements });
    }
  }, [baseArticles, brands, categories, movements, syncMode]);

  const articles = useMemo(
    () => hydrateArticlesWithStock(baseArticles, movements),
    [baseArticles, movements]
  );

  function syncBrandInsert(optimisticBrand: Brand, payload: { name: string }, previousBrands: Brand[]) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void insertBrandInSupabase(payload)
      .then((inserted) => {
        setBrands((current) =>
          current.map((brand) => (brand.id === optimisticBrand.id ? inserted : brand))
        );
        setSyncError(null);
      })
      .catch((error) => {
        setBrands(previousBrands);
        setSyncError(
          error instanceof Error
            ? `Marque non synchronisee : ${error.message}`
            : "Marque non synchronisee avec Supabase."
        );
      });
  }

  function syncBrandUpdate(brandId: string, payload: { name: string }, previousBrands: Brand[]) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void updateBrandInSupabase(brandId, payload)
      .then((updated) => {
        setBrands((current) =>
          current.map((brand) => (brand.id === brandId ? updated : brand))
        );
        setSyncError(null);
      })
      .catch((error) => {
        setBrands(previousBrands);
        setSyncError(
          error instanceof Error
            ? `Marque non synchronisee : ${error.message}`
            : "Marque non synchronisee avec Supabase."
        );
      });
  }

  function syncBrandDelete(brandId: string, previousBrands: Brand[]) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void deleteBrandInSupabase(brandId).catch((error) => {
      setBrands(previousBrands);
      setSyncError(
        error instanceof Error
          ? `Suppression marque non synchronisee : ${error.message}`
          : "Suppression marque non synchronisee avec Supabase."
      );
    });
  }

  function syncCategoryInsert(
    optimisticCategory: Category,
    payload: { brandId: string; name: string },
    previousCategories: Category[]
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void insertCategoryInSupabase(payload)
      .then((inserted) => {
        setCategories((current) =>
          current.map((category) => (category.id === optimisticCategory.id ? inserted : category))
        );
        setSyncError(null);
      })
      .catch((error) => {
        setCategories(previousCategories);
        setSyncError(
          error instanceof Error
            ? `Categorie non synchronisee : ${error.message}`
            : "Categorie non synchronisee avec Supabase."
        );
      });
  }

  function syncCategoryUpdate(
    categoryId: string,
    payload: { brandId: string; name: string },
    previousCategories: Category[],
    previousArticles: Article[],
    shouldSyncArticles: boolean
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void updateCategoryInSupabase(categoryId, payload)
      .then(() => {
        if (!shouldSyncArticles) {
          setSyncError(null);
          return;
        }

        return syncArticlesBrandForCategoryInSupabase(categoryId, payload.brandId).then(() => {
          setSyncError(null);
        });
      })
      .catch((error) => {
        setCategories(previousCategories);
        setBaseArticles(previousArticles);
        setSyncError(
          error instanceof Error
            ? `Categorie non synchronisee : ${error.message}`
            : "Categorie non synchronisee avec Supabase."
        );
      });
  }

  function syncCategoryDelete(
    categoryId: string,
    previousCategories: Category[]
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void deleteCategoryInSupabase(categoryId).catch((error) => {
      setCategories(previousCategories);
      setSyncError(
        error instanceof Error
          ? `Suppression categorie non synchronisee : ${error.message}`
          : "Suppression categorie non synchronisee avec Supabase."
      );
    });
  }

  function syncArticleInsert(
    optimisticArticle: Article,
    payload: {
      brandId: string;
      categoryId: string;
      name: string;
      reference: string;
      unit: string;
      alertThreshold: number;
    }
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    const previousArticles = liveStateRef.current.baseArticles;

    void insertArticleInSupabase(payload)
      .then((inserted) => {
        setBaseArticles((current) =>
          current.map((article) => (article.id === optimisticArticle.id ? inserted : article))
        );
        setSyncError(null);
      })
      .catch((error) => {
        setBaseArticles(previousArticles);
        setSyncError(
          error instanceof Error
            ? `Article non synchronise : ${error.message}`
            : "Article non synchronise avec Supabase."
        );
      });
  }

  function syncArticleUpdate(
    articleId: string,
    payload: {
      brandId: string;
      categoryId: string;
      name: string;
      reference: string;
      unit: string;
      alertThreshold: number;
    },
    previousArticles: Article[]
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void updateArticleInSupabase(articleId, payload)
      .then((updated) => {
        setBaseArticles((current) =>
          current.map((article) =>
            article.id === articleId
              ? {
                  ...updated,
                  availableQty: article.availableQty,
                }
              : article
          )
        );
        setSyncError(null);
      })
      .catch((error) => {
        setBaseArticles(previousArticles);
        setSyncError(
          error instanceof Error
            ? `Article non synchronisé : ${error.message}`
            : "Article non synchronisé avec Supabase."
        );
      });
  }

  function syncArticleDelete(articleId: string, previousArticles: Article[]) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void deleteArticleInSupabase(articleId).catch((error) => {
      setBaseArticles(previousArticles);
      setSyncError(
        error instanceof Error
          ? `Suppression article non synchronisée : ${error.message}`
          : "Suppression article non synchronisée avec Supabase."
      );
    });
  }

  function syncMovementInsert(
    optimisticMovement: Movement,
    payload: {
      articleId: string;
      type: "entry" | "output";
      quantity: number;
      actor: string;
      source?: string;
      condition?: StockCondition;
      note: string;
      correctionReason?: string;
      replacesMovementId?: string;
    },
    previousMovements: Movement[]
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void insertMovementInSupabase(payload)
      .then((inserted) => {
        setMovements((current) =>
          current.map((movement) => (movement.id === optimisticMovement.id ? inserted : movement))
        );
        setSyncError(null);
      })
      .catch((error) => {
        setMovements(previousMovements);
        setSyncError(
          error instanceof Error
            ? `Mouvement non synchronise : ${error.message}`
            : "Mouvement non synchronise avec Supabase."
        );
      });
  }

  function syncMovementReplacement(
    originalMovement: Movement,
    optimisticMovement: Movement,
    payload: {
      articleId: string;
      type: "entry" | "output";
      quantity: number;
      actor: string;
      source?: string;
      condition?: StockCondition;
      note: string;
      correctionReason: string;
    },
    previousMovements: Movement[]
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    void insertMovementInSupabase({
      ...payload,
      correctionReason: payload.correctionReason,
      replacesMovementId: originalMovement.id,
    })
      .then((inserted) =>
        markMovementAsReplacedInSupabase(originalMovement.id, inserted.id).then(() => inserted)
      )
      .then((inserted) => {
        setMovements((current) =>
          current.map((movement) => {
            if (movement.id === optimisticMovement.id) {
              return inserted;
            }

            if (movement.id === originalMovement.id) {
              return {
                ...movement,
                replacedByMovementId: inserted.id,
              };
            }

            return movement;
          })
        );
        setSyncError(null);
      })
      .catch((error) => {
        setMovements(previousMovements);
        setSyncError(
          error instanceof Error
            ? `Mouvement non synchronisé : ${error.message}`
            : getMovementSyncErrorLabel("update")
        );
      });
  }

  function syncMovementDelete(
    movementId: string,
    previousMovements: Movement[],
    originalMovementId?: string
  ) {
    if (syncMode !== "supabase" || !isSupabaseInventoryEnabled()) {
      return;
    }

    const syncRequest = originalMovementId
      ? deleteMovementInSupabase(movementId).then(() =>
          clearMovementReplacementInSupabase(originalMovementId)
        )
      : deleteMovementInSupabase(movementId);

    void syncRequest.catch((error) => {
      setMovements(previousMovements);
      setSyncError(
        error instanceof Error
          ? `Suppression mouvement non synchronisée : ${error.message}`
          : "Suppression mouvement non synchronisée avec Supabase."
      );
    });
  }

  const createBrand = (draft: BrandDraft) => {
    const name = draft.name.trim();

    if (!name) {
      return { ok: false, message: "Le nom de la marque est obligatoire." };
    }

    if (liveStateRef.current.brands.some((brand) => normalize(brand.name) === normalize(name))) {
      return { ok: false, message: "Cette marque existe deja." };
    }

    const optimisticBrand: Brand = {
      id: createId("brand"),
      name,
    };

    const previousBrands = liveStateRef.current.brands;
    setBrands((current) => [optimisticBrand, ...current]);
    setSyncError(null);
    syncBrandInsert(optimisticBrand, { name }, previousBrands);

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Marque ajoutee. Synchronisation Supabase en cours."
          : "Marque ajoutee en mode demo.",
    };
  };

  const updateBrand = (brandId: string, draft: BrandDraft) => {
    const name = draft.name.trim();
    const brand = liveStateRef.current.brands.find((item) => item.id === brandId);

    if (!brand) {
      return { ok: false, message: "La marque demandee est introuvable." };
    }

    if (!name) {
      return { ok: false, message: "Le nom de la marque est obligatoire." };
    }

    if (
      liveStateRef.current.brands.some(
        (item) => item.id !== brandId && normalize(item.name) === normalize(name)
      )
    ) {
      return { ok: false, message: "Une autre marque porte deja ce nom." };
    }

    const previousBrands = liveStateRef.current.brands;
    setBrands((current) =>
      current.map((item) => (item.id === brandId ? { ...item, name } : item))
    );
    setSyncError(null);
    syncBrandUpdate(brandId, { name }, previousBrands);

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Marque mise a jour. Synchronisation Supabase en cours."
          : "Marque mise a jour en mode demo.",
    };
  };

  const deleteBrand = (brandId: string) => {
    const linkedCategories = liveStateRef.current.categories.filter(
      (category) => category.brandId === brandId
    ).length;
    const linkedArticles = liveStateRef.current.baseArticles.filter(
      (article) => article.brandId === brandId
    ).length;

    if (linkedCategories > 0 || linkedArticles > 0) {
      return {
        ok: false,
        message: "Supprimez d abord les categories et articles relies a cette marque.",
      };
    }

    const previousBrands = liveStateRef.current.brands;
    setBrands((current) => current.filter((brand) => brand.id !== brandId));
    setSyncError(null);
    syncBrandDelete(brandId, previousBrands);

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Marque supprimee. Synchronisation Supabase en cours."
          : "Marque supprimee en mode demo.",
    };
  };

  const createCategory = (draft: CategoryDraft) => {
    const brandId = draft.brandId.trim();
    const name = draft.name.trim();

    if (!brandId) {
      return { ok: false, message: "La marque est obligatoire pour une categorie." };
    }

    if (!liveStateRef.current.brands.some((brand) => brand.id === brandId)) {
      return { ok: false, message: "La marque selectionnee est introuvable." };
    }

    if (!name) {
      return { ok: false, message: "Le nom de la categorie est obligatoire." };
    }

    if (
      liveStateRef.current.categories.some(
        (category) =>
          category.brandId === brandId && normalize(category.name) === normalize(name)
      )
    ) {
      return { ok: false, message: "Cette categorie existe deja pour cette marque." };
    }

    const optimisticCategory: Category = {
      id: createId("cat"),
      brandId,
      name,
    };

    const previousCategories = liveStateRef.current.categories;
    setCategories((current) => [optimisticCategory, ...current]);
    setSyncError(null);
    syncCategoryInsert(optimisticCategory, { brandId, name }, previousCategories);

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Categorie ajoutee. Synchronisation Supabase en cours."
          : "Categorie ajoutee en mode demo.",
    };
  };

  const updateCategory = (categoryId: string, draft: CategoryDraft) => {
    const brandId = draft.brandId.trim();
    const name = draft.name.trim();
    const category = liveStateRef.current.categories.find((item) => item.id === categoryId);

    if (!category) {
      return { ok: false, message: "La categorie demandee est introuvable." };
    }

    if (!brandId) {
      return { ok: false, message: "La marque est obligatoire pour une categorie." };
    }

    if (!liveStateRef.current.brands.some((brand) => brand.id === brandId)) {
      return { ok: false, message: "La marque selectionnee est introuvable." };
    }

    if (!name) {
      return { ok: false, message: "Le nom de la categorie est obligatoire." };
    }

    if (
      liveStateRef.current.categories.some(
        (item) =>
          item.id !== categoryId &&
          item.brandId === brandId &&
          normalize(item.name) === normalize(name)
      )
    ) {
      return { ok: false, message: "Une autre categorie porte deja ce nom pour cette marque." };
    }

    const previousCategories = liveStateRef.current.categories;
    const previousArticles = liveStateRef.current.baseArticles;
    const shouldSyncArticles = category.brandId !== brandId;

    setCategories((current) =>
      current.map((item) =>
        item.id === categoryId
          ? {
              ...item,
              brandId,
              name,
            }
          : item
      )
    );

    if (shouldSyncArticles) {
      setBaseArticles((current) =>
        current.map((article) =>
          article.categoryId === categoryId
            ? {
                ...article,
                brandId,
              }
            : article
        )
      );
    }

    setSyncError(null);
    syncCategoryUpdate(
      categoryId,
      { brandId, name },
      previousCategories,
      previousArticles,
      shouldSyncArticles
    );

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Categorie mise a jour. Synchronisation Supabase en cours."
          : "Categorie mise a jour en mode demo.",
    };
  };

  const deleteCategory = (categoryId: string) => {
    const linkedArticles = liveStateRef.current.baseArticles.filter(
      (article) => article.categoryId === categoryId
    ).length;

    if (linkedArticles > 0) {
      return {
        ok: false,
        message: "Supprimez d abord les articles relies a cette categorie.",
      };
    }

    const previousCategories = liveStateRef.current.categories;
    setCategories((current) => current.filter((category) => category.id !== categoryId));
    setSyncError(null);
    syncCategoryDelete(categoryId, previousCategories);

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Categorie supprimee. Synchronisation Supabase en cours."
          : "Categorie supprimee en mode demo.",
    };
  };

  const createArticle = (draft: ArticleDraft) => {
    const name = draft.name.trim();
    const brandId = draft.brandId.trim();
    const categoryId = draft.categoryId.trim();
    const reference = draft.reference.trim().toUpperCase();
    const unit = draft.unit.trim().toLowerCase();
    const alertThreshold = draft.alertThreshold;

    if (!name) {
      return { ok: false, message: "Le nom de l article est obligatoire." };
    }

    if (!brandId) {
      return { ok: false, message: "La marque est obligatoire." };
    }

    if (!categoryId) {
      return { ok: false, message: "La categorie est obligatoire." };
    }

    const category = liveStateRef.current.categories.find((item) => item.id === categoryId);

    if (!category) {
      return { ok: false, message: "La categorie selectionnee est introuvable." };
    }

    if (category.brandId !== brandId) {
      return { ok: false, message: "La categorie ne correspond pas a la marque choisie." };
    }

    if (!reference) {
      return { ok: false, message: "La reference article est obligatoire." };
    }

    if (!unit) {
      return { ok: false, message: "L unite est obligatoire." };
    }

    if (alertThreshold < 0) {
      return { ok: false, message: "Le seuil d alerte ne peut pas etre negatif." };
    }

    if (
      liveStateRef.current.baseArticles.some(
        (article) => normalize(article.reference) === normalize(reference)
      )
    ) {
      return { ok: false, message: "Cette reference article existe deja." };
    }

    const optimisticArticle: Article = {
      id: createId("art"),
      name,
      brandId,
      categoryId,
      reference,
      availableQty: 0,
      alertThreshold,
      unit,
    };

    setBaseArticles((current) => [optimisticArticle, ...current]);
    setSyncError(null);

    syncArticleInsert(optimisticArticle, {
      brandId,
      categoryId,
      name,
      reference,
      unit,
      alertThreshold,
    });

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Article ajoute. Synchronisation Supabase en cours."
          : "Article ajoute en mode demo.",
    };
  };

  const updateArticle = (articleId: string, draft: ArticleUpdateDraft) => {
    const article = liveStateRef.current.baseArticles.find((item) => item.id === articleId);
    const name = draft.name.trim();
    const brandId = draft.brandId.trim();
    const categoryId = draft.categoryId.trim();
    const reference = draft.reference.trim().toUpperCase();
    const unit = draft.unit.trim().toLowerCase();
    const alertThreshold = draft.alertThreshold;

    if (!article) {
      return { ok: false, message: "L’article demandé est introuvable." };
    }

    if (!name) {
      return { ok: false, message: "Le nom de l’article est obligatoire." };
    }

    if (!brandId) {
      return { ok: false, message: "La marque est obligatoire." };
    }

    if (!categoryId) {
      return { ok: false, message: "La catégorie est obligatoire." };
    }

    const category = liveStateRef.current.categories.find((item) => item.id === categoryId);

    if (!category) {
      return { ok: false, message: "La catégorie sélectionnée est introuvable." };
    }

    if (category.brandId !== brandId) {
      return { ok: false, message: "La catégorie ne correspond pas à la marque choisie." };
    }

    if (!reference) {
      return { ok: false, message: "La référence article est obligatoire." };
    }

    if (!unit) {
      return { ok: false, message: "L’unité est obligatoire." };
    }

    if (alertThreshold < 0) {
      return { ok: false, message: "Le seuil d’alerte ne peut pas être négatif." };
    }

    if (
      liveStateRef.current.baseArticles.some(
        (item) => item.id !== articleId && normalize(item.reference) === normalize(reference)
      )
    ) {
      return { ok: false, message: "Une autre référence article existe déjà." };
    }

    const previousArticles = liveStateRef.current.baseArticles;

    setBaseArticles((current) =>
      current.map((item) =>
        item.id === articleId
          ? {
              ...item,
              name,
              brandId,
              categoryId,
              reference,
              unit,
              alertThreshold,
            }
          : item
      )
    );
    setSyncError(null);

    syncArticleUpdate(
      articleId,
      {
        brandId,
        categoryId,
        name,
        reference,
        unit,
        alertThreshold,
      },
      previousArticles
    );

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Article mis à jour. Synchronisation Supabase en cours."
          : "Article mis à jour en mode démo.",
    };
  };

  const deleteArticle = (articleId: string) => {
    const linkedMovements = liveStateRef.current.movements.filter(
      (movement) => movement.articleId === articleId
    ).length;

    if (linkedMovements > 0) {
      return {
        ok: false,
        message:
          "Supprimez d’abord les mouvements liés à cet article avant de le retirer du catalogue.",
      };
    }

    const previousArticles = liveStateRef.current.baseArticles;
    setBaseArticles((current) => current.filter((article) => article.id !== articleId));
    setSyncError(null);
    syncArticleDelete(articleId, previousArticles);

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Article supprimé. Synchronisation Supabase en cours."
          : "Article supprimé en mode démo.",
    };
  };

  const addEntry = (draft: EntryDraft) => {
    const actor = draft.recordedBy.trim();
    const source = draft.source.trim();
    const note = draft.note.trim();
    const article = articles.find((item) => item.id === draft.articleId);

    if (!article) {
      return { ok: false, message: "L’article sélectionné est introuvable." };
    }

    if (draft.quantity <= 0) {
      return { ok: false, message: "La quantité d’entrée doit être supérieure à zéro." };
    }

    if (!actor) {
      return { ok: false, message: "La personne qui enregistre est obligatoire." };
    }

    if (!source) {
      return { ok: false, message: "La provenance est obligatoire pour une entrée." };
    }

    const optimisticMovement: Movement = {
      id: createId("mov"),
      type: "entry",
      articleId: draft.articleId,
      quantity: draft.quantity,
      actor,
      source,
      condition: draft.condition,
      date: new Date().toISOString(),
      note: note || "Entrée de stock",
    };

    const previousMovements = liveStateRef.current.movements;

    setMovements((current) => [optimisticMovement, ...current]);
    setSyncError(null);

    syncMovementInsert(
      optimisticMovement,
      {
        articleId: draft.articleId,
        type: "entry",
        quantity: draft.quantity,
        actor,
        source,
        condition: draft.condition,
        note: optimisticMovement.note,
      },
      previousMovements
    );

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Entrée ajoutée. Synchronisation Supabase en cours."
          : "Entrée ajoutée en mode démo.",
    };
  };

  const addOutput = (draft: OutputDraft) => {
    const actor = draft.actor.trim();
    const note = draft.note.trim();
    const article = articles.find((item) => item.id === draft.articleId);

    if (!article) {
      return { ok: false, message: "L’article sélectionné est introuvable." };
    }

    if (draft.quantity <= 0) {
      return { ok: false, message: "La quantité de sortie doit être supérieure à zéro." };
    }

    if (draft.quantity > article.availableQty) {
      return {
        ok: false,
        message: "La quantité demandée dépasse le stock disponible pour cet article.",
      };
    }

    if (!actor) {
      return { ok: false, message: "La personne responsable de la sortie est obligatoire." };
    }

    if (!note) {
      return { ok: false, message: "La raison de sortie est obligatoire." };
    }

    const optimisticMovement: Movement = {
      id: createId("mov"),
      type: "output",
      articleId: draft.articleId,
      quantity: draft.quantity,
      actor,
      date: new Date().toISOString(),
      note,
    };

    const previousMovements = liveStateRef.current.movements;

    setMovements((current) => [optimisticMovement, ...current]);
    setSyncError(null);

    syncMovementInsert(
      optimisticMovement,
      {
        articleId: draft.articleId,
        type: "output",
        quantity: draft.quantity,
        actor,
        note,
      },
      previousMovements
    );

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Sortie ajoutée. Synchronisation Supabase en cours."
          : "Sortie ajoutée en mode démo.",
    };
  };

  const updateMovement = (movementId: string, draft: MovementUpdateDraft) => {
    const originalMovement = liveStateRef.current.movements.find((movement) => movement.id === movementId);

    if (!originalMovement) {
      return { ok: false, message: "Le mouvement demandé est introuvable." };
    }

    if (originalMovement.replacedByMovementId) {
      return { ok: false, message: "Ce mouvement a déjà été corrigé. Modifiez plutôt sa version active." };
    }

    const article = articles.find((item) => item.id === originalMovement.articleId);

    if (!article) {
      return { ok: false, message: "L'article lié à ce mouvement est introuvable." };
    }

    if (originalMovement.type !== "entry" && originalMovement.type !== "output") {
      return { ok: false, message: "Seules les entrées et les sorties peuvent être modifiées ici." };
    }

    const actor = draft.actor.trim();
    const note = draft.note.trim();
    const correctionReason = draft.correctionReason.trim();
    const quantity = draft.quantity;

    if (quantity <= 0) {
      return { ok: false, message: "La quantité doit être supérieure à zéro." };
    }

    if (!actor) {
      return { ok: false, message: "La personne qui modifie le mouvement est obligatoire." };
    }

    if (!note) {
      return {
        ok: false,
        message:
          originalMovement.type === "entry"
            ? "L'observation de l'entrée est obligatoire."
            : "La raison de sortie est obligatoire.",
      };
    }

    if (!correctionReason) {
      return { ok: false, message: "Le motif de modification est obligatoire pour garder l'historique." };
    }

    if (originalMovement.type === "entry") {
      const source = draft.source?.trim() ?? "";
      const baselineAvailableQty = article.availableQty - originalMovement.quantity;

      if (!source) {
        return { ok: false, message: "La provenance est obligatoire pour une entrée." };
      }

      if (baselineAvailableQty + quantity < 0) {
        return {
          ok: false,
          message: "Cette correction ferait passer le stock sous zéro pour cet article.",
        };
      }
    } else {
      const baselineAvailableQty = article.availableQty + originalMovement.quantity;

      if (quantity > baselineAvailableQty) {
        return {
          ok: false,
          message: "La quantité corrigée dépasse le stock disponible pour cette sortie.",
        };
      }
    }

    const correctionMovement: Movement = {
      id: createId("mov"),
      type: originalMovement.type,
      articleId: originalMovement.articleId,
      quantity,
      actor,
      source: originalMovement.type === "entry" ? draft.source?.trim() ?? "" : undefined,
      condition: originalMovement.type === "entry" ? draft.condition ?? originalMovement.condition : undefined,
      date: new Date().toISOString(),
      note,
      correctionReason,
      replacesMovementId: originalMovement.id,
    };

    const previousMovements = liveStateRef.current.movements;

    setMovements((current) => [
      correctionMovement,
      ...current.map((movement) =>
        movement.id === originalMovement.id
          ? {
              ...movement,
              replacedByMovementId: correctionMovement.id,
            }
          : movement
      ),
    ]);
    setSyncError(null);

    syncMovementReplacement(
      originalMovement,
      correctionMovement,
      {
        articleId: correctionMovement.articleId,
        type: originalMovement.type,
        quantity: correctionMovement.quantity,
        actor: correctionMovement.actor,
        source: correctionMovement.source,
        condition: correctionMovement.condition,
        note: correctionMovement.note,
        correctionReason,
      },
      previousMovements
    );

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Mouvement corrigé. L'historique est conservé et la synchronisation Supabase est en cours."
          : "Mouvement corrigé en mode démo. L'historique est conservé.",
    };
  };

  const deleteMovement = (movementId: string) => {
    const movement = liveStateRef.current.movements.find((item) => item.id === movementId);

    if (!movement) {
      return { ok: false, message: "Le mouvement demandé est introuvable." };
    }

    if (movement.replacedByMovementId) {
      return {
        ok: false,
        message: "Supprimez plutôt la version active du mouvement pour garder un historique cohérent.",
      };
    }

    const previousMovements = liveStateRef.current.movements;

    if (movement.replacesMovementId) {
      setMovements((current) =>
        current
          .filter((item) => item.id !== movementId)
          .map((item) =>
            item.id === movement.replacesMovementId
              ? {
                  ...item,
                  replacedByMovementId: undefined,
                }
              : item
          )
      );
      setSyncError(null);
      syncMovementDelete(movementId, previousMovements, movement.replacesMovementId);
    } else {
      setMovements((current) => current.filter((item) => item.id !== movementId));
      setSyncError(null);
      syncMovementDelete(movementId, previousMovements);
    }

    return {
      ok: true,
      message:
        syncMode === "supabase"
          ? "Mouvement supprimé. Synchronisation Supabase en cours."
          : "Mouvement supprimé en mode démo.",
    };
  };

  const contextValue: InventoryContextValue = {
    brands,
    categories,
    locations: [],
    articles,
    entries: buildDerivedEntries(movements),
    requests: [] as StockRequest[],
    movements,
    isLoading,
    syncMode,
    syncError,
    refreshInventory,
    createArticle,
    updateArticle,
    deleteArticle,
    addEntry,
    addOutput,
    updateMovement,
    deleteMovement,
    createRequest: () => {},
    approveRequest: () => {},
    rejectRequest: () => false,
    createBrand,
    updateBrand,
    deleteBrand,
    createCategory,
    updateCategory,
    deleteCategory,
    createLocation: () => buildLegacyFailure("Section hors scope pour le MVP stock."),
    updateLocation: () => buildLegacyFailure("Section hors scope pour le MVP stock."),
    deleteLocation: () => buildLegacyFailure("Section hors scope pour le MVP stock."),
  };

  return <InventoryContext.Provider value={contextValue}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const context = useContext(InventoryContext);

  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }

  return context;
}
