"use client";

import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { PencilLine, Plus, Tag, Trash2 } from "lucide-react";

import { ActionMenu, ActionMenuItem } from "@/components/action-menu";
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
} from "@/components/list-page";
import { useInventory } from "@/components/inventory-provider";
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
import { useToast } from "@/components/ui/toast";

export function BrandsScreen() {
  const { brands, categories, articles, createBrand, updateBrand, deleteBrand } = useInventory();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const visibleBrands = useMemo(
    () =>
      [...brands]
        .filter((brand) => {
          const categoryCount = categories.filter((category) => category.brandId === brand.id).length;
          const articleCount = articles.filter((article) => article.brandId === brand.id).length;
          const query = deferredSearch.toLowerCase();

          return (
            !query ||
            brand.name.toLowerCase().includes(query) ||
            brand.id.toLowerCase().includes(query) ||
            `${categoryCount}`.includes(query) ||
            `${articleCount}`.includes(query)
          );
        })
        .sort((left, right) => left.name.localeCompare(right.name)),
    [articles, brands, categories, deferredSearch]
  );

  function openCreateDialog() {
    setEditingBrandId(null);
    setName("");
    setDialogOpen(true);
  }

  function openEditDialog(brandId: string, currentName: string) {
    setEditingBrandId(brandId);
    setName(currentName);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingBrandId(null);
    setName("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = editingBrandId
      ? updateBrand(editingBrandId, { name })
      : createBrand({ name });

    toast({
      title: result.ok
        ? editingBrandId
          ? "Marque mise à jour"
          : "Marque ajoutée"
        : "Action impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      closeDialog();
    }
  }

  function handleDelete(brandId: string) {
    const result = deleteBrand(brandId);

    toast({
      title: result.ok ? "Marque supprimée" : "Suppression impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        icon={Tag}
        title="Gestion des marques"
        description="Administre les marques du catalogue et garde une structure claire pour les catégories et les articles."
        action={
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Ajouter une marque
          </Button>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Marques" value={`${brands.length}`} detail="marques configurées" />
        <ListStatCard
          label="Catégories liées"
          value={`${categories.length}`}
          detail="familles rattachées"
        />
        <ListStatCard
          label="Articles dépendants"
          value={`${articles.length}`}
          detail="références classées"
        />
      </ListStatsGrid>
      <ListToolbar>
        <ListSearchBar
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une marque"
          inputClassName="lg:min-w-[360px]"
        />
      </ListToolbar>

      <ListTable>
        <thead>
          <tr className="bg-black/[0.03] text-left">
            <ListTableHeadCell>Marque</ListTableHeadCell>
            <ListTableHeadCell>Identifiant</ListTableHeadCell>
            <ListTableHeadCell>Catégories</ListTableHeadCell>
            <ListTableHeadCell>Articles</ListTableHeadCell>
            <ListTableHeadCell>Actions</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {visibleBrands.map((brand) => {
            const linkedCategories = categories.filter(
              (category) => category.brandId === brand.id
            ).length;
            const linkedArticles = articles.filter((article) => article.brandId === brand.id).length;
            const canDelete = linkedCategories === 0 && linkedArticles === 0;

            return (
              <tr key={brand.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Tag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{brand.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {canDelete ? "Suppression possible" : "Encore reliée au catalogue"}
                      </p>
                    </div>
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">{brand.id}</p>
                </ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-foreground">
                    {linkedCategories}
                  </span>
                </ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-foreground">
                    {linkedArticles}
                  </span>
                </ListTableCell>
                <ListTableCell>
                  <ActionMenu label={`Ouvrir les actions de la marque ${brand.name}`}>
                    <ActionMenuItem
                      icon={PencilLine}
                      onSelect={() => openEditDialog(brand.id, brand.name)}
                    >
                      Modifier
                    </ActionMenuItem>
                    <ActionMenuItem
                      icon={Trash2}
                      destructive
                      disabled={!canDelete}
                      onSelect={() => handleDelete(brand.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>
                {editingBrandId ? "Modifier une marque" : "Ajouter une marque"}
              </DialogTitle>
              <DialogDescription>
                Une marque doit garder un nom unique pour rester exploitable dans le catalogue.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={closeDialog} />
          </DialogHeader>
          <DialogBody>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <LabeledField label="Nom de la marque">
                <Input
                  value={name}
                  placeholder="Ex: Asuka Premium"
                  onChange={(event) => setName(event.target.value)}
                />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button type="submit">
                  {editingBrandId ? "Mettre à jour" : "Ajouter la marque"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
