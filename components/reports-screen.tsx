"use client";

import { useEffect, useState, type ReactNode } from "react";

import { FilterMenu } from "@/components/filter-menu";
import { LabeledField } from "@/components/labeled-field";
import { ListPageHeader, ListStatCard, ListStatsGrid, ListToolbar } from "@/components/list-page";
import { useInventory } from "@/components/inventory-provider";
import { MovementTypeBadge, StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/format";

export function ReportsScreen() {
  const { articles, brands, categories, movements } = useInventory();
  const [period, setPeriod] = useState("weekly");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [technician, setTechnician] = useState("all");
  const [startDate, setStartDate] = useState("2026-04-08");
  const [endDate, setEndDate] = useState("2026-04-15");
  const activeFilterCount =
    (period !== "weekly" ? 1 : 0) +
    (brand !== "all" ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (technician !== "all" ? 1 : 0) +
    (startDate !== "2026-04-08" ? 1 : 0) +
    (endDate !== "2026-04-15" ? 1 : 0);

  useEffect(() => {
    if (period === "weekly") {
      setStartDate("2026-04-08");
      setEndDate("2026-04-15");
    }

    if (period === "monthly") {
      setStartDate("2026-04-01");
      setEndDate("2026-04-30");
    }
  }, [period]);

  const technicians = Array.from(new Set(movements.map((movement) => movement.actor)));
  const visibleCategories =
    brand === "all"
      ? categories
      : categories.filter((item) => item.brandId === brand);

  useEffect(() => {
    if (category !== "all" && !visibleCategories.some((item) => item.id === category)) {
      setCategory("all");
    }
  }, [brand, category, visibleCategories]);

  const filteredMovements = movements.filter((movement) => {
    const article = articles.find((item) => item.id === movement.articleId);
    const movementDate = movement.date.slice(0, 10);
    const matchesDate = movementDate >= startDate && movementDate <= endDate;
    const matchesBrand = brand === "all" || article?.brandId === brand;
    const matchesCategory = category === "all" || article?.categoryId === category;
    const matchesTechnician = technician === "all" || movement.actor === technician;

    return matchesDate && matchesBrand && matchesCategory && matchesTechnician;
  });

  const outputMovements = filteredMovements.filter((movement) => movement.type === "output");
  const totalStock = articles.reduce((sum, article) => sum + article.availableQty, 0);
  const criticalCount = articles.filter(
    (article) => article.availableQty <= article.alertThreshold
  ).length;

  const articleUsage = outputMovements.reduce<Record<string, number>>((accumulator, movement) => {
    accumulator[movement.articleId] = (accumulator[movement.articleId] || 0) + movement.quantity;
    return accumulator;
  }, {});

  const topArticles = Object.entries(articleUsage)
    .map(([articleId, quantity]) => ({
      article: articles.find((article) => article.id === articleId),
      quantity,
    }))
    .filter((item) => item.article)
    .sort((left, right) => right.quantity - left.quantity);

  const technicianUsage = outputMovements.reduce<Record<string, number>>(
    (accumulator, movement) => {
      accumulator[movement.actor] = (accumulator[movement.actor] || 0) + movement.quantity;
      return accumulator;
    },
    {}
  );

  const topTechnicians = Object.entries(technicianUsage).sort(
    (left, right) => right[1] - left[1]
  );

  const headlineArticle = topArticles[0]?.article?.name ?? "Aucune sortie";

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Lire la consommation avant de penser export."
        description="La V1 reste consultative, mais elle donne deja une lecture hebdomadaire ou mensuelle utile pour la decision."
      />

      <ListToolbar>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="neutral" className="mb-2 w-fit">
              Periode et filtres
            </Badge>
            <p className="text-sm text-muted-foreground">
              Vue hebdo, mensuelle ou libre avec reduction par categorie et acteur.
            </p>
          </div>
          <FilterMenu
            activeCount={activeFilterCount}
            onClear={() => {
              setPeriod("weekly");
              setBrand("all");
              setCategory("all");
              setTechnician("all");
              setStartDate("2026-04-08");
              setEndDate("2026-04-15");
            }}
            title="Filtres de rapport"
          >
            <LabeledField label="Periode">
              <Select value={period} onChange={(event) => setPeriod(event.target.value)}>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuel</option>
                <option value="custom">Libre</option>
              </Select>
            </LabeledField>
            <LabeledField label="Marque">
              <Select value={brand} onChange={(event) => setBrand(event.target.value)}>
                <option value="all">Toutes les marques</option>
                {brands.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </LabeledField>
            <LabeledField label="Categorie">
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">Toutes les categories</option>
                {visibleCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </LabeledField>
            <LabeledField label="Acteur">
              <Select value={technician} onChange={(event) => setTechnician(event.target.value)}>
                <option value="all">Tous les acteurs</option>
                {technicians.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </LabeledField>
            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledField label="Date debut">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </LabeledField>
              <LabeledField label="Date fin">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </LabeledField>
            </div>
          </FilterMenu>
        </div>
      </ListToolbar>

      <ListStatsGrid>
        <ListStatCard label="Mouvements" value={`${filteredMovements.length}`} />
        <ListStatCard label="Sorties" value={`${outputMovements.length}`} />
        <ListStatCard label="Article le plus sorti" value={headlineArticle} />
      </ListStatsGrid>

      <section className="grid gap-4 lg:grid-cols-2">
        <ListStatCard label="Stock restant" value={`${totalStock}`} />
        <ListStatCard label="Sous seuil" value={`${criticalCount}`} valueClassName="text-amber-600" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Synthese de consommation
            </Badge>
            <CardTitle className="text-2xl">Articles les plus sortis</CardTitle>
            <CardDescription>
              Un tableau simple pour lire ce qui consomme vraiment le stock sur
              la periode.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topArticles.length ? (
              topArticles.map((item) => (
                <div
                  key={item.article?.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-border bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{item.article?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.article?.reference} ·{" "}
                      {item.article ? getBrandName(brands, item.article.brandId) : ""} ·{" "}
                      {item.article ? getCategoryName(categories, item.article.categoryId) : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.article ? <StockHealthBadge article={item.article} /> : null}
                    <div className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                      {item.quantity} sorties
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucun mouvement de sortie sur cette periode.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Lecture decideur
            </Badge>
            <CardTitle className="text-2xl">Consommation par acteur</CardTitle>
            <CardDescription>
              La consommation par technicien ou equipe aide a expliquer les
              variations d une periode a l autre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topTechnicians.length ? (
              topTechnicians.map(([actor, quantity]) => (
                <div
                  key={actor}
                  className="flex items-center justify-between rounded-[24px] border border-border bg-white p-4"
                >
                  <div>
                    <p className="font-medium">{actor}</p>
                    <p className="text-sm text-muted-foreground">
                      Periode du {formatDate(startDate)} au {formatDate(endDate)}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    {quantity} sorties
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucune consommation a afficher avec les filtres choisis.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Seuils critiques
            </Badge>
            <CardTitle className="text-2xl">Stock restant</CardTitle>
            <CardDescription>
              Les references sensibles restent visibles depuis la lecture rapport.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {articles
              .filter((article) => article.availableQty <= article.alertThreshold)
              .map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between rounded-[24px] border border-border bg-muted/35 p-4"
                >
                  <div>
                    <p className="font-medium">{article.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {article.availableQty} {article.unit} disponibles
                    </p>
                  </div>
                  <StockHealthBadge article={article} />
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Lecture brute
            </Badge>
            <CardTitle className="text-2xl text-white">
              Mouvements inclus dans la synthese
            </CardTitle>
            <CardDescription className="text-white/65">
              Une vue courte des evenements qui alimentent les chiffres affiches.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredMovements.slice(0, 5).map((movement) => {
              const article = articles.find((item) => item.id === movement.articleId);

              return (
                <div
                  key={movement.id}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                      <MovementTypeBadge type={movement.type} />
                      <p className="font-medium text-white">{article?.name}</p>
                      <p className="text-sm text-white/68">{movement.note}</p>
                    </div>
                    <p className="text-sm text-white/55">{formatDate(movement.date)}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
