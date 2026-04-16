"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { Filter, Search } from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { ConditionBadge, StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function ArticlesScreen() {
  const { articles, brands, categories } = useInventory();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [stockLevel, setStockLevel] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const lowStockCount = articles.filter(
    (article) => article.availableQty <= article.alertThreshold
  ).length;
  const visibleCategories =
    brand === "all"
      ? categories
      : categories.filter((item) => item.brandId === brand);

  useEffect(() => {
    if (category !== "all" && !visibleCategories.some((item) => item.id === category)) {
      setCategory("all");
    }
  }, [brand, category, visibleCategories]);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !deferredSearch ||
      article.name.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      article.reference.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      getBrandName(brands, article.brandId)
        .toLowerCase()
        .includes(deferredSearch.toLowerCase()) ||
      getCategoryName(categories, article.categoryId)
        .toLowerCase()
        .includes(deferredSearch.toLowerCase());

    const matchesBrand = brand === "all" || article.brandId === brand;
    const matchesCategory = category === "all" || article.categoryId === category;

    const health =
      article.availableQty <= article.alertThreshold
        ? "critical"
        : article.availableQty <= article.alertThreshold * 1.5
          ? "watch"
          : "healthy";

    return (
      matchesSearch &&
      matchesBrand &&
      matchesCategory &&
      (stockLevel === "all" || stockLevel === health)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Referentiel stock"
        title="Articles et materiels"
        description="Le magasin reste net quand chaque reference, chaque seuil et chaque emplacement sont faciles a retrouver."
        actions={
          <>
            <Link href="/stock/entries" className={buttonVariants()}>
              Enregistrer une entree
            </Link>
            <Link
              href="/stock/requests"
              className={buttonVariants({ variant: "outline" })}
            >
              Nouvelle demande
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <SummaryCard label="References" value={`${articles.length}`} detail="catalogue suivi" />
        <SummaryCard label="Marques" value={`${brands.length}`} detail="univers suivis" />
        <SummaryCard
          label="Sous seuil"
          value={`${lowStockCount}`}
          detail="a reassortir"
        />
      </section>

      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-3 w-fit">
            Recherche et filtres
          </Badge>
          <CardTitle className="text-2xl">Trouver rapidement un article</CardTitle>
          <CardDescription>
            Recherche par nom ou reference, puis reduction par categorie et
            niveau de stock.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un article ou une reference"
              className="pl-10"
            />
          </div>
          <Select value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option value="all">Toutes les marques</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Toutes les categories</option>
            {visibleCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select value={stockLevel} onChange={(event) => setStockLevel(event.target.value)}>
            <option value="all">Tous les niveaux</option>
            <option value="critical">Sous seuil</option>
            <option value="watch">A surveiller</option>
            <option value="healthy">Stable</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="neutral" className="mb-3 w-fit">
              Liste metier
            </Badge>
            <CardTitle className="text-2xl">Catalogue disponible</CardTitle>
            <CardDescription>
              Vue lisible pour reperer les references critiques et ouvrir la
              tracabilite detaillee.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            {filteredArticles.length} article(s) affiche(s)
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="grid gap-4 rounded-[26px] border border-border bg-muted/35 p-4 lg:grid-cols-[1.2fr_0.9fr_0.85fr_0.85fr_auto]"
            >
              <div className="space-y-1">
                <p className="text-base font-medium">{article.name}</p>
                <p className="text-sm text-muted-foreground">
                  {article.reference} · {getBrandName(brands, article.brandId)} ·{" "}
                  {getCategoryName(categories, article.categoryId)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Stock
                </p>
                <p className="mt-2 font-medium">
                  {article.availableQty} {article.unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  seuil {article.alertThreshold}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Emplacement
                </p>
                <p className="mt-2 font-medium">{article.location}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StockHealthBadge article={article} />
                <ConditionBadge condition={article.condition} />
              </div>
              <div className="flex items-start justify-end">
                <Link
                  href={`/stock/articles/${article.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                >
                  Ouvrir
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
