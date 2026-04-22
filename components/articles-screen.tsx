"use client";

import { useDeferredValue, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpFromLine,
  Boxes,
  Eye,
  FilePenLine,
  PackagePlus,
  Plus,
  Trash2,
} from "lucide-react";

import {
  ActionMenu,
  ActionMenuItem,
  ActionMenuLink,
  ActionMenuSeparator,
} from "@/components/action-menu";
import { useAuth } from "@/components/auth-provider";
import { FilterMenu } from "@/components/filter-menu";
import { LabeledField } from "@/components/labeled-field";
import {
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
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { formatDateTime, getConditionLabel } from "@/lib/format";
import type { Article, StockCondition } from "@/lib/types";

type ArticleDialogMode = "create" | "edit";

export function ArticlesScreen() {
  const { user } = useAuth();
  const {
    articles,
    brands,
    categories,
    entries,
    movements,
    createArticle,
    updateArticle,
    deleteArticle,
    addEntry,
    addOutput,
  } = useInventory();
  const { toast } = useToast();
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);
  const [articleDialogMode, setArticleDialogMode] = useState<ArticleDialogMode>("create");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [entryArticleId, setEntryArticleId] = useState<string | null>(null);
  const [outputArticleId, setOutputArticleId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "low" | "out">("all");
  const [name, setName] = useState("");
  const [articleBrandId, setArticleBrandId] = useState(brands[0]?.id ?? "");
  const [articleCategoryId, setArticleCategoryId] = useState("");
  const [reference, setReference] = useState("");
  const [unit, setUnit] = useState("pièce");
  const [alertThreshold, setAlertThreshold] = useState("0");
  const [entryQuantity, setEntryQuantity] = useState("1");
  const [entrySource, setEntrySource] = useState("Fournisseur principal");
  const [entryCondition, setEntryCondition] = useState<StockCondition>("new");
  const [entryNote, setEntryNote] = useState("Réception contrôlée");
  const [outputQuantity, setOutputQuantity] = useState("1");
  const [outputReason, setOutputReason] = useState("");
  const deferredSearch = useDeferredValue(search);
  const actor = user?.email ?? "Utilisateur connecté";

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

  const articleToDelete = deleteArticleId
    ? articles.find((article) => article.id === deleteArticleId) ?? null
    : null;
  const entryArticle = entryArticleId
    ? articles.find((article) => article.id === entryArticleId) ?? null
    : null;
  const outputArticle = outputArticleId
    ? articles.find((article) => article.id === outputArticleId) ?? null
    : null;
  const entryProjectedQty = (entryArticle?.availableQty ?? 0) + (Number(entryQuantity) || 0);
  const outputProjectedQty = Math.max(
    0,
    (outputArticle?.availableQty ?? 0) - (Number(outputQuantity) || 0)
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

  function resetArticleForm() {
    setEditingArticleId(null);
    setName("");
    setArticleBrandId(brands[0]?.id ?? "");
    setArticleCategoryId("");
    setReference("");
    setUnit("pièce");
    setAlertThreshold("0");
  }

  function openCreateArticleDialog() {
    setArticleDialogMode("create");
    resetArticleForm();
    setArticleDialogOpen(true);
  }

  function openEditArticleDialog(article: Article) {
    setArticleDialogMode("edit");
    setEditingArticleId(article.id);
    setName(article.name);
    setArticleBrandId(article.brandId);
    setArticleCategoryId(article.categoryId);
    setReference(article.reference);
    setUnit(article.unit);
    setAlertThreshold(`${article.alertThreshold}`);
    setArticleDialogOpen(true);
  }

  function closeArticleDialog() {
    setArticleDialogOpen(false);
    setArticleDialogMode("create");
    resetArticleForm();
  }

  function openEntryDialog(articleId: string) {
    setEntryArticleId(articleId);
    setEntryQuantity("1");
    setEntrySource("Fournisseur principal");
    setEntryCondition("new");
    setEntryNote("Réception contrôlée");
  }

  function openOutputDialog(articleId: string) {
    setOutputArticleId(articleId);
    setOutputQuantity("1");
    setOutputReason("");
  }

  function handleCreateOrUpdateArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      name,
      brandId: articleBrandId,
      categoryId: articleCategoryId,
      reference,
      alertThreshold: Number(alertThreshold) || 0,
      unit,
    };

    const result =
      articleDialogMode === "edit" && editingArticleId
        ? updateArticle(editingArticleId, payload)
        : createArticle({
            ...payload,
            availableQty: 0,
          });

    toast({
      title:
        result.ok && articleDialogMode === "edit"
          ? "Article modifié"
          : result.ok
            ? "Article ajouté"
            : "Action impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      closeArticleDialog();
    }
  }

  function handleDeleteArticle() {
    if (!articleToDelete) {
      return;
    }

    const result = deleteArticle(articleToDelete.id);

    toast({
      title: result.ok ? "Article supprimé" : "Suppression impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      setDeleteArticleId(null);
    }
  }

  function handleAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!entryArticle) {
      return;
    }

    const result = addEntry({
      articleId: entryArticle.id,
      quantity: Number(entryQuantity) || 0,
      source: entrySource.trim(),
      condition: entryCondition,
      recordedBy: actor,
      note: entryNote.trim(),
    });

    toast({
      title: result.ok ? "Entrée enregistrée" : "Enregistrement impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      setEntryArticleId(null);
    }
  }

  function handleAddOutput(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!outputArticle) {
      return;
    }

    const result = addOutput({
      articleId: outputArticle.id,
      quantity: Number(outputQuantity) || 0,
      actor,
      note: outputReason.trim(),
    });

    toast({
      title: result.ok ? "Sortie enregistrée" : "Enregistrement impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      setOutputArticleId(null);
    }
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        icon={Boxes}
        title="Gestion des articles"
        description="Crée les références du stock, rattache-les à une marque et une catégorie, puis pilote les actions clés depuis chaque ligne."
        action={
          <Button className="gap-2" onClick={openCreateArticleDialog}>
            <Plus className="h-4 w-4" />
            Ajouter un article
          </Button>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Articles" value={`${articles.length}`} detail="références suivies" />
        <ListStatCard label="Stock total" value={`${totalUnits}`} detail="unités disponibles" />
        <ListStatCard
          label="Sous seuil"
          value={`${lowStockCount}`}
          detail="références à surveiller"
          valueClassName="text-amber-600"
        />
      </ListStatsGrid>

      <ListToolbar>
        <ListToolbarRow className="xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)]">
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un article, une référence, une marque ou une catégorie"
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
            <LabeledField label="Catégorie">
              <Select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Toutes les catégories</option>
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
            <ListTableHeadCell>Catégorie</ListTableHeadCell>
            <ListTableHeadCell>Référence</ListTableHeadCell>
            <ListTableHeadCell>Stock</ListTableHeadCell>
            <ListTableHeadCell>Dernière entrée</ListTableHeadCell>
            <ListTableHeadCell className="w-[84px]">Actions</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredArticles.map((article) => {
            const latestEntry = latestEntryByArticle[article.id];
            const articleMovementCount = movements.filter(
              (movement) => movement.articleId === article.id
            ).length;

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
                    seuil {article.alertThreshold} • {articleMovementCount} mouvement(s)
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">
                    {latestEntry ? formatDateTime(latestEntry.date) : "Aucune entrée"}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <ActionMenu label={`Ouvrir les actions de l’article ${article.name}`}>
                    <ActionMenuLink icon={Eye} href={`/stock/articles/${article.id}`}>
                      Voir l’article
                    </ActionMenuLink>
                    <ActionMenuItem icon={PackagePlus} onSelect={() => openEntryDialog(article.id)}>
                      Ajouter une entrée
                    </ActionMenuItem>
                    <ActionMenuItem icon={ArrowUpFromLine} onSelect={() => openOutputDialog(article.id)}>
                      Ajouter une sortie
                    </ActionMenuItem>
                    <ActionMenuSeparator />
                    <ActionMenuItem icon={FilePenLine} onSelect={() => openEditArticleDialog(article)}>
                      Modifier
                    </ActionMenuItem>
                    <ActionMenuItem
                      icon={Trash2}
                      destructive
                      onSelect={() => setDeleteArticleId(article.id)}
                    >
                      Supprimer
                    </ActionMenuItem>
                  </ActionMenu>
                </ListTableCell>
              </tr>
            );
          })}
        </tbody>
      </ListTable>

      <Dialog
        open={articleDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeArticleDialog();
            return;
          }

          setArticleDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>
                {articleDialogMode === "edit" ? "Modifier l’article" : "Ajouter un article"}
              </DialogTitle>
              <DialogDescription>
                Renseignez une fiche claire dès le départ pour éviter les doublons et accélérer les futures opérations.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={closeArticleDialog} />
          </DialogHeader>
          <DialogBody>
            <form className="space-y-4" onSubmit={handleCreateOrUpdateArticle}>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Nom de l’article">
                  <Input
                    value={name}
                    placeholder="Ex : Écran iPhone 13 OLED"
                    onChange={(event) => setName(event.target.value)}
                  />
                </LabeledField>
                <LabeledField label="Référence">
                  <Input
                    value={reference}
                    placeholder="Ex : SCR-IP13-OLED"
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
                      <option value="">Ajoutez d’abord une marque</option>
                    ) : (
                      brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))
                    )}
                  </Select>
                </LabeledField>
                <LabeledField label="Catégorie">
                  <Select
                    value={articleCategoryId}
                    onChange={(event) => setArticleCategoryId(event.target.value)}
                    disabled={articleCategories.length === 0}
                  >
                    {articleCategories.length === 0 ? (
                      <option value="">Ajoutez d’abord une catégorie</option>
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
                <LabeledField label="Unité">
                  <Input
                    value={unit}
                    placeholder="Ex : pièce"
                    onChange={(event) => setUnit(event.target.value)}
                  />
                </LabeledField>
                <LabeledField label="Seuil d’alerte">
                  <Input
                    type="number"
                    min="0"
                    value={alertThreshold}
                    onChange={(event) => setAlertThreshold(event.target.value)}
                  />
                </LabeledField>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeArticleDialog}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={brands.length === 0 || articleCategories.length === 0}
                >
                  {articleDialogMode === "edit" ? "Enregistrer les changements" : "Ajouter l’article"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteArticleId)} onOpenChange={(open) => !open && setDeleteArticleId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div>
              <DialogTitle>Supprimer l’article</DialogTitle>
              <DialogDescription>
                Cette action retire la fiche du catalogue si aucun mouvement n’est encore lié.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setDeleteArticleId(null)} />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="rounded-[24px] border border-border bg-muted/35 p-4">
              <p className="text-sm font-medium text-foreground">{articleToDelete?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{articleToDelete?.reference}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDeleteArticleId(null)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleDeleteArticle}>
                Confirmer la suppression
              </Button>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(entryArticleId)} onOpenChange={(open) => !open && setEntryArticleId(null)}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>Ajouter une entrée</DialogTitle>
              <DialogDescription>
                L’article est déjà sélectionné pour aller plus vite depuis la liste.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setEntryArticleId(null)} />
          </DialogHeader>
          <DialogBody>
            <div className="mb-5 grid gap-4 rounded-[24px] bg-black p-5 text-white sm:grid-cols-3">
              <ImpactTile label="Stock actuel" value={`${entryArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Entrée saisie" value={`${Number(entryQuantity) || 0}`} />
              <ImpactTile label="Après entrée" value={`${entryProjectedQty}`} />
            </div>
            <form className="space-y-4" onSubmit={handleAddEntry}>
              <LabeledField label="Article">
                <Input value={entryArticle?.name ?? ""} disabled />
              </LabeledField>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Quantité reçue">
                  <Input
                    type="number"
                    min="1"
                    value={entryQuantity}
                    onChange={(event) => setEntryQuantity(event.target.value)}
                  />
                </LabeledField>
                <LabeledField label="État du lot">
                  <Select
                    value={entryCondition}
                    onChange={(event) => setEntryCondition(event.target.value as StockCondition)}
                  >
                    {(["new", "good", "maintenance", "used"] as StockCondition[]).map((value) => (
                      <option key={value} value={value}>
                        {getConditionLabel(value)}
                      </option>
                    ))}
                  </Select>
                </LabeledField>
              </div>
              <LabeledField label="Provenance">
                <Input value={entrySource} onChange={(event) => setEntrySource(event.target.value)} />
              </LabeledField>
              <LabeledField label="Observation">
                <Textarea value={entryNote} onChange={(event) => setEntryNote(event.target.value)} />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEntryArticleId(null)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!entryArticle}>
                  Ajouter l’entrée
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(outputArticleId)} onOpenChange={(open) => !open && setOutputArticleId(null)}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>Ajouter une sortie</DialogTitle>
              <DialogDescription>
                Cette sortie sera enregistrée directement sur l’article sélectionné.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setOutputArticleId(null)} />
          </DialogHeader>
          <DialogBody>
            <div className="mb-5 grid gap-4 rounded-[24px] bg-black p-5 text-white sm:grid-cols-3">
              <ImpactTile label="Disponible" value={`${outputArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Sortie saisie" value={`${Number(outputQuantity) || 0}`} />
              <ImpactTile label="Reste après sortie" value={`${outputProjectedQty}`} />
            </div>
            <form className="space-y-4" onSubmit={handleAddOutput}>
              <LabeledField label="Article">
                <Input value={outputArticle?.name ?? ""} disabled />
              </LabeledField>
              <LabeledField label="Quantité">
                <Input
                  type="number"
                  min="1"
                  value={outputQuantity}
                  onChange={(event) => setOutputQuantity(event.target.value)}
                />
              </LabeledField>
              <LabeledField label="Raison de sortie">
                <Textarea
                  value={outputReason}
                  placeholder="Ex : Vente client, SAV, démonstration, casse..."
                  onChange={(event) => setOutputReason(event.target.value)}
                />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOutputArticleId(null)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!outputArticle}>
                  Enregistrer la sortie
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
