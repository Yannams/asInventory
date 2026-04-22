"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRightLeft, FolderTree, PencilLine, Plus, Trash2 } from "lucide-react";

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
import { getBrandName } from "@/lib/catalog";

type Feedback = {
  kind: "success" | "error";
  text: string;
};

export function CategoriesScreen() {
  const {
    brands,
    categories,
    articles,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const deferredSearch = useDeferredValue(search);
  const activeFilterCount = brandFilter !== "all" ? 1 : 0;

  useEffect(() => {
    if (brands.length === 0) {
      setBrandId("");
      return;
    }

    if (!brands.some((brand) => brand.id === brandId)) {
      setBrandId(brands[0].id);
    }
  }, [brandId, brands]);

  const visibleCategories = useMemo(
    () =>
      [...categories]
        .filter((category) => {
          const query = deferredSearch.toLowerCase();
          const matchesBrand = brandFilter === "all" || category.brandId === brandFilter;
          const matchesSearch =
            !query ||
            category.name.toLowerCase().includes(query) ||
            category.id.toLowerCase().includes(query) ||
            getBrandName(brands, category.brandId).toLowerCase().includes(query);

          return matchesBrand && matchesSearch;
        })
        .sort((left, right) => left.name.localeCompare(right.name)),
    [brandFilter, brands, categories, deferredSearch]
  );

  function openCreateDialog() {
    setEditingCategoryId(null);
    setBrandId(brands[0]?.id ?? "");
    setName("");
    setFeedback(null);
    setDialogOpen(true);
  }

  function openEditDialog(categoryId: string, currentBrandId: string, currentName: string) {
    setEditingCategoryId(categoryId);
    setBrandId(currentBrandId);
    setName(currentName);
    setFeedback(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingCategoryId(null);
    setName("");
    setBrandId(brands[0]?.id ?? "");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = editingCategoryId
      ? updateCategory(editingCategoryId, { brandId, name })
      : createCategory({ brandId, name });

    setFeedback({
      kind: result.ok ? "success" : "error",
      text: result.message,
    });

    if (result.ok) {
      closeDialog();
    }
  }

  function handleDelete(categoryId: string) {
    const result = deleteCategory(categoryId);

    setFeedback({
      kind: result.ok ? "success" : "error",
      text: result.message,
    });
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Gestion des categories"
        description="Organisez les familles d articles par marque dans une liste unique, claire et facile a administrer."
        action={
          <>
            <Link href="/configuration/brands" className={buttonVariants({ variant: "outline" })}>
              Voir les brands
            </Link>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Ajouter une categorie
            </Button>
          </>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Categories" value={`${categories.length}`} detail="rubriques catalogue" />
        <ListStatCard label="Brands" value={`${brands.length}`} detail="marques supportees" />
        <ListStatCard
          label="Articles relies"
          value={`${articles.length}`}
          detail="references appuyees sur ces categories"
        />
      </ListStatsGrid>
      {feedback ? <ListFeedbackBanner kind={feedback.kind} text={feedback.text} /> : null}

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une categorie"
          />
          <FilterMenu activeCount={activeFilterCount} onClear={() => setBrandFilter("all")}>
            <LabeledField label="Brand">
              <Select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="all">Toutes les brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>
            </LabeledField>
          </FilterMenu>
        </ListToolbarRow>
      </ListToolbar>

      <ListTable>
        <thead>
          <tr className="bg-black/[0.03] text-left">
            <ListTableHeadCell>Categorie</ListTableHeadCell>
            <ListTableHeadCell>Brand</ListTableHeadCell>
            <ListTableHeadCell>Articles</ListTableHeadCell>
            <ListTableHeadCell>Reaffectation</ListTableHeadCell>
            <ListTableHeadCell>Actions</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {visibleCategories.map((category) => {
            const linkedArticles = articles.filter((article) => article.categoryId === category.id).length;
            const canDelete = linkedArticles === 0;

            return (
              <tr key={category.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FolderTree className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{category.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{category.id}</p>
                    </div>
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">
                    {getBrandName(brands, category.brandId)}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-foreground">
                    {linkedArticles}
                  </span>
                </ListTableCell>
                <ListTableCell>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    <ArrowRightLeft className="h-4 w-4" />
                    {linkedArticles > 0 ? "Articles suivront la brand" : "Libre"}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(category.id, category.brandId, category.name)}
                    >
                      <PencilLine className="h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!canDelete}
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
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
              <DialogTitle>
                {editingCategoryId ? "Modifier une categorie" : "Ajouter une categorie"}
              </DialogTitle>
              <DialogDescription>
                Si la categorie change de brand, les articles relies sont realignes automatiquement.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={closeDialog} />
          </DialogHeader>
          <DialogBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <LabeledField label="Brand">
                <Select
                  value={brandId}
                  onChange={(event) => setBrandId(event.target.value)}
                  disabled={brands.length === 0}
                >
                  {brands.length === 0 ? (
                    <option value="">Ajoutez d abord une brand</option>
                  ) : (
                    brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))
                  )}
                </Select>
              </LabeledField>
              <LabeledField label="Nom de la categorie">
                <Input
                  value={name}
                  placeholder="Ex: Accessoires premium"
                  onChange={(event) => setName(event.target.value)}
                />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button type="submit" disabled={brands.length === 0}>
                  {editingCategoryId ? "Mettre a jour" : "Ajouter la categorie"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
