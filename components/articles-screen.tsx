"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { FilterMenu } from "@/components/filter-menu";
import { LabeledField } from "@/components/labeled-field";
import {
  ListFeedbackBanner,
  ListPageHeader,
  ListSearchBar,
  ListStatCard,
  ListStatsGrid,
  ListTable,
  ListTableCell,
  ListTableHeadCell,
  ListToolbar,
  ListToolbarRow,
} from "@/components/list-page";
import { useInventory } from "@/components/inventory-provider";
import { StockHealthBadge } from "@/components/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Feedback = {
  kind: "success" | "error";
  text: string;
};

export function ArticlesScreen() {
  const { articles, brands, categories, entries, createArticle } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "low" | "out">("all");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [name, setName] = useState("");
  const [articleBrandId, setArticleBrandId] = useState(brands[0]?.id ?? "");
  const [articleCategoryId, setArticleCategoryId] = useState("");
  const [reference, setReference] = useState("");
  const [unit, setUnit] = useState("piece");
  const [alertThreshold, setAlertThreshold] = useState("0");
  const deferredSearch = useDeferredValue(search);

  const totalUnits = articles.reduce((sum, article) => sum + article.availableQty, 0);
  const lowStockCount = articles.filter(
    (article) => article.availableQty <= article.alertThreshold
  ).length;
  const latestEntryByArticle = useMemo(
    () =>
      entries.reduce<Record<string, (typeof entries)[number]>>((accumulator, entry) => {
        const current = accumulator[entry.articleId];

        if (!current || new Date(entry.date).getTime() > new Date(current.date).getTime()) {
          accumulator[entry.articleId] = entry;
        }

        return accumulator;
      }, {}),
    [entries]
  );

  const visibleCategories =
    brandFilter === "all"
      ? categories
      : categories.filter((category) => category.brandId === brandFilter);

  const articleCategories = useMemo(
    () => categories.filter((category) => category.brandId === articleBrandId),
    [articleBrandId, categories]
  );

  useEffect(() => {
    if (categoryFilter !== "all" && !visibleCategories.some((item) => item.id === categoryFilter)) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, visibleCategories]);

  useEffect(() => {
    if (brands.length === 0) {
      setArticleBrandId("");
      setArticleCategoryId("");
      return;
    }

    if (!brands.some((item) => item.id === articleBrandId)) {
      setArticleBrandId(brands[0].id);
    }
  }, [articleBrandId, brands]);

  useEffect(() => {
    if (articleCategories.length === 0) {
      setArticleCategoryId("");
      return;
    }

    if (!articleCategories.some((item) => item.id === articleCategoryId)) {
      setArticleCategoryId(articleCategories[0].id);
    }
  }, [articleCategories, articleCategoryId]);

  const filteredArticles = articles.filter((article) => {
    const query = deferredSearch.toLowerCase();
    const matchesSearch =
      !query ||
      article.name.toLowerCase().includes(query) ||
      article.reference.toLowerCase().includes(query) ||
      getBrandName(brands, article.brandId).toLowerCase().includes(query) ||
      getCategoryName(categories, article.categoryId).toLowerCase().includes(query) ||
      article.unit.toLowerCase().includes(query);

    const status =
      article.availableQty <= 0
        ? "out"
        : article.availableQty <= article.alertThreshold
          ? "low"
          : "available";

    const matchesBrand = brandFilter === "all" || article.brandId === brandFilter;
    const matchesCategory = categoryFilter === "all" || article.categoryId === categoryFilter;

    return (
      matchesSearch &&
      matchesBrand &&
      matchesCategory &&
      (stockFilter === "all" || stockFilter === status)
    );
  });

  function resetForm() {
    setName("");
    setArticleBrandId(brands[0]?.id ?? "");
    setArticleCategoryId("");
    setReference("");
    setUnit("piece");
    setAlertThreshold("0");
  }

  function closeDialog() {
    setDialogOpen(false);
    resetForm();
  }

  function handleCreateArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = createArticle({
      name,
      brandId: articleBrandId,
      categoryId: articleCategoryId,
      reference,
      availableQty: 0,
      alertThreshold: Number(alertThreshold) || 0,
      unit,
    });

    setFeedback({
      kind: result.ok ? "success" : "error",
      text: result.message,
    });

    if (result.ok) {
      closeDialog();
    }
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Gestion des articles"
        description="Cree les references du stock, rattache-les a une marque et une categorie, puis surveille leur niveau."
        action={
          <>
            <Link href="/configuration/brands" className={buttonVariants({ variant: "outline" })}>
              Marques
            </Link>
            <Link
              href="/configuration/categories"
              className={buttonVariants({ variant: "outline" })}
            >
              Categories
            </Link>
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un article
            </Button>
          </>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Articles" value={`${articles.length}`} detail="references suivies" />
        <ListStatCard label="Stock total" value={`${totalUnits}`} detail="unites disponibles" />
        <ListStatCard
          label="Sous seuil"
          value={`${lowStockCount}`}
          detail="references a surveiller"
          valueClassName="text-amber-600"
        />
      </ListStatsGrid>
      {feedback ? <ListFeedbackBanner kind={feedback.kind} text={feedback.text} /> : null}

      <ListToolbar>
        <ListToolbarRow className="xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)]">
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un article, une reference, une marque ou une categorie"
          />
          <FilterMenu
            activeCount={
              (brandFilter !== "all" ? 1 : 0) +
              (categoryFilter !== "all" ? 1 : 0) +
              (stockFilter !== "all" ? 1 : 0)
            }
            onClear={() => {
              setBrandFilter("all");
              setCategoryFilter("all");
              setStockFilter("all");
            }}
          >
            <LabeledField label="Marque">
              <Select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="all">Toutes les marques</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </LabeledField>
            <LabeledField label="Categorie">
              <Select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Toutes les categories</option>
                {visibleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </LabeledField>
            <LabeledField label="Niveau de stock">
              <Select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as typeof stockFilter)}
              >
                <option value="all">Tous les niveaux</option>
                <option value="available">Disponible</option>
                <option value="low">Sous seuil</option>
                <option value="out">Rupture</option>
              </Select>
            </LabeledField>
          </FilterMenu>
        </ListToolbarRow>
      </ListToolbar>

      <ListTable>
        <thead>
          <tr className="bg-black/[0.03] text-left">
            <ListTableHeadCell>Article</ListTableHeadCell>
            <ListTableHeadCell>Marque</ListTableHeadCell>
            <ListTableHeadCell>Categorie</ListTableHeadCell>
            <ListTableHeadCell>Reference</ListTableHeadCell>
            <ListTableHeadCell>Stock</ListTableHeadCell>
            <ListTableHeadCell>Derniere entree</ListTableHeadCell>
            <ListTableHeadCell>Actions</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredArticles.map((article) => {
            const latestEntry = latestEntryByArticle[article.id];

            return (
              <tr key={article.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <p className="text-lg font-semibold text-foreground">{article.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StockHealthBadge article={article} />
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">
                    {getBrandName(brands, article.brandId)}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">
                    {getCategoryName(categories, article.categoryId)}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">{article.reference}</p>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">
                    {article.availableQty} {article.unit}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    seuil {article.alertThreshold}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">
                    {latestEntry ? formatDateTime(latestEntry.date) : "Aucune entree"}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <Link
                    href={`/stock/articles/${article.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                  >
                    Ouvrir
                  </Link>
                </ListTableCell>
              </tr>
            );
          })}
        </tbody>
      </ListTable>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>Ajouter un article</DialogTitle>
              <DialogDescription>
                Cree une nouvelle reference en la classant des le depart dans le bon univers produit.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={closeDialog} />
          </DialogHeader>
          <DialogBody>
            <form className="space-y-4" onSubmit={handleCreateArticle}>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Nom de l article">
                  <Input
                    value={name}
                    placeholder="Ex: Ecran iPhone 13 OLED"
                    onChange={(event) => setName(event.target.value)}
                  />
                </LabeledField>
                <LabeledField label="Reference">
                  <Input
                    value={reference}
                    placeholder="Ex: SCR-IP13-OLED"
                    onChange={(event) => setReference(event.target.value.toUpperCase())}
                  />
                </LabeledField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Marque">
                  <Select
                    value={articleBrandId}
                    onChange={(event) => setArticleBrandId(event.target.value)}
                    disabled={brands.length === 0}
                  >
                    {brands.length === 0 ? (
                      <option value="">Ajoutez d abord une marque</option>
                    ) : (
                      brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))
                    )}
                  </Select>
                </LabeledField>
                <LabeledField label="Categorie">
                  <Select
                    value={articleCategoryId}
                    onChange={(event) => setArticleCategoryId(event.target.value)}
                    disabled={articleCategories.length === 0}
                  >
                    {articleCategories.length === 0 ? (
                      <option value="">Ajoutez d abord une categorie</option>
                    ) : (
                      articleCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </Select>
                </LabeledField>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Unite">
                  <Input
                    value={unit}
                    placeholder="Ex: piece"
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </LabeledField>
                <LabeledField label="Seuil d alerte">
                  <Input
                    type="number"
                    min="0"
                    value={alertThreshold}
                    onChange={(event) => setAlertThreshold(event.target.value)}
                  />
                </LabeledField>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={brands.length === 0 || articleCategories.length === 0}
                >
                  Ajouter l article
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
