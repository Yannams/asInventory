"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { ArrowUpFromLine, Eye, FilePenLine, PackagePlus, Repeat2, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

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
import { ConditionBadge, MovementTypeBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { formatDateTime, formatQuantity, getConditionLabel } from "@/lib/format";
import { getActiveMovements, getMovementStockSnapshot } from "@/lib/stock";
import type { Movement, MovementType, StockCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

type MovementFilter = "all" | MovementType;
type DialogMode = "create" | "edit";

export function MovementsScreen({
  initialKind = null,
}: {
  initialKind?: "entry" | "output" | null;
}) {
  const pathname = usePathname() ?? "/stock/movements";
  const router = useRouter();
  const { user } = useAuth();
  const { articles, movements, addEntry, addOutput, updateMovement, deleteMovement } =
    useInventory();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [movementType, setMovementType] = useState<MovementType>("entry");
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [articleId, setArticleId] = useState(articles[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [source, setSource] = useState("Fournisseur principal");
  const [condition, setCondition] = useState<StockCondition>("new");
  const [note, setNote] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MovementFilter>("all");
  const [articleFilter, setArticleFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const actor = user?.email ?? "Utilisateur connecté";

  const movementById = useMemo(
    () => new Map(movements.map((movement) => [movement.id, movement])),
    [movements]
  );
  const activeMovements = useMemo(() => getActiveMovements(movements), [movements]);
  const entryCount = activeMovements.filter((movement) => movement.type === "entry").length;
  const outputCount = activeMovements.filter((movement) => movement.type === "output").length;

  const sortedMovements = useMemo(
    () =>
      [...movements].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      ),
    [movements]
  );

  const filteredMovements = sortedMovements.filter((movement) => {
    const article = articles.find((item) => item.id === movement.articleId);
    const normalizedQuery = deferredQuery.toLowerCase();
    const matchesType = typeFilter === "all" || movement.type === typeFilter;
    const matchesArticle = articleFilter === "all" || movement.articleId === articleFilter;
    const matchesQuery =
      !normalizedQuery ||
      movement.actor.toLowerCase().includes(normalizedQuery) ||
      movement.note.toLowerCase().includes(normalizedQuery) ||
      movement.source?.toLowerCase().includes(normalizedQuery) ||
      movement.correctionReason?.toLowerCase().includes(normalizedQuery) ||
      article?.name.toLowerCase().includes(normalizedQuery) ||
      article?.reference.toLowerCase().includes(normalizedQuery);

    return matchesType && matchesArticle && matchesQuery;
  });

  const selectedArticle = articles.find((article) => article.id === articleId);
  const editingMovement = editingMovementId
    ? movements.find((movement) => movement.id === editingMovementId) ?? null
    : null;
  const quantityNumber = Number(quantity) || 0;
  const projectedQty = getProjectedQty({
    articleQty: selectedArticle?.availableQty ?? 0,
    movementType,
    quantity: quantityNumber,
    originalQuantity: editingMovement?.quantity,
  });

  useEffect(() => {
    if (articles.length === 0) {
      setArticleId("");
      return;
    }

    if (!articles.some((article) => article.id === articleId)) {
      setArticleId(articles[0].id);
    }
  }, [articleId, articles]);

  useEffect(() => {
    if (!initialKind || dialogOpen) {
      return;
    }

    openCreateDialog(initialKind);
    router.replace(pathname, { scroll: false });
  }, [dialogOpen, initialKind, pathname, router]);

  function resetForm(nextType: MovementType = "entry") {
    setMovementType(nextType);
    setEditingMovementId(null);
    setArticleId(articles[0]?.id ?? "");
    setQuantity("1");
    setSource("Fournisseur principal");
    setCondition("new");
    setNote(nextType === "entry" ? "Réception contrôlée" : "");
    setCorrectionReason("");
  }

  function openCreateDialog(type: MovementType = "entry") {
    setDialogMode("create");
    resetForm(type);
    setDialogOpen(true);
  }

  function openEditDialog(movement: Movement) {
    setDialogMode("edit");
    setEditingMovementId(movement.id);
    setMovementType(movement.type);
    setArticleId(movement.articleId);
    setQuantity(`${movement.quantity}`);
    setSource(movement.source ?? "Fournisseur principal");
    setCondition(movement.condition ?? "new");
    setNote(movement.note);
    setCorrectionReason("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDialogMode("create");
    resetForm("entry");
  }

  function handleDelete(movement: Movement) {
    const result = deleteMovement(movement.id);

    toast({
      title: result.ok ? "Mouvement supprimé" : "Suppression impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (dialogMode === "edit" && editingMovementId) {
      const result = updateMovement(editingMovementId, {
        quantity: quantityNumber,
        actor,
        source: movementType === "entry" ? source.trim() : undefined,
        condition: movementType === "entry" ? condition : undefined,
        note: note.trim(),
        correctionReason: correctionReason.trim(),
      });

      toast({
        title: result.ok ? "Mouvement modifié" : "Modification impossible",
        description: result.message,
        variant: result.ok ? "success" : "error",
      });

      if (result.ok) {
        closeDialog();
      }

      return;
    }

    const result =
      movementType === "entry"
        ? addEntry({
            articleId,
            quantity: quantityNumber,
            source: source.trim(),
            condition,
            recordedBy: actor,
            note: note.trim(),
          })
        : addOutput({
            articleId,
            quantity: quantityNumber,
            actor,
            note: note.trim(),
          });

    toast({
      title:
        result.ok && movementType === "entry"
          ? "Entrée enregistrée"
          : result.ok
            ? "Sortie enregistrée"
            : "Enregistrement impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      closeDialog();
    }
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        icon={Repeat2}
        title="Mouvements de stock"
        description="Centralise les entrées, les sorties et leur historique de correction sur un seul écran."
        action={
          <Button className="gap-2" onClick={() => openCreateDialog("entry")}>
            <PackagePlus className="h-4 w-4" />
            Ajouter une entrée/sortie
          </Button>
        }
      />

      <ListStatsGrid>
        <ListStatCard
          label="Mouvements"
          value={`${movements.length}`}
          detail="traçabilité complète"
        />
        <ListStatCard
          label="Entrées actives"
          value={`${entryCount}`}
          detail="réceptions qui impactent le stock"
          valueClassName="text-emerald-600"
        />
        <ListStatCard
          label="Sorties actives"
          value={`${outputCount}`}
          detail="débits qui impactent le stock"
          valueClassName="text-amber-600"
        />
      </ListStatsGrid>

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article, une note, un acteur ou une correction"
          />
          <FilterMenu
            activeCount={(typeFilter !== "all" ? 1 : 0) + (articleFilter !== "all" ? 1 : 0)}
            onClear={() => {
              setTypeFilter("all");
              setArticleFilter("all");
            }}
          >
            <LabeledField label="Type de mouvement">
              <Select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as MovementFilter)}
              >
                <option value="all">Entrées et sorties</option>
                <option value="entry">Entrées</option>
                <option value="output">Sorties</option>
              </Select>
            </LabeledField>
            <LabeledField label="Article">
              <Select
                value={articleFilter}
                onChange={(event) => setArticleFilter(event.target.value)}
              >
                <option value="all">Tous les articles</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.name}
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
            <ListTableHeadCell>Type</ListTableHeadCell>
            <ListTableHeadCell>Article</ListTableHeadCell>
            <ListTableHeadCell>Acteur</ListTableHeadCell>
            <ListTableHeadCell>Quantité</ListTableHeadCell>
            <ListTableHeadCell>Suivi</ListTableHeadCell>
            <ListTableHeadCell>Date</ListTableHeadCell>
            <ListTableHeadCell className="w-[84px]">Actions</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredMovements.map((movement) => {
            const article = articles.find((item) => item.id === movement.articleId);
            const replacement = movement.replacedByMovementId
              ? movementById.get(movement.replacedByMovementId)
              : null;
            const originalMovement = movement.replacesMovementId
              ? movementById.get(movement.replacesMovementId)
              : null;
            const isArchived = Boolean(movement.replacedByMovementId);
            const stockSnapshot = getMovementStockSnapshot(movement.id, movements);

            return (
              <tr
                key={movement.id}
                className={cn("transition hover:bg-black/[0.015]", isArchived && "bg-black/[0.02]")}
              >
                <ListTableCell>
                  <div className="space-y-2">
                    <MovementTypeBadge type={movement.type} />
                    {movement.type === "entry" && movement.condition ? (
                      <ConditionBadge condition={movement.condition} />
                    ) : null}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className={cn("text-lg font-semibold text-foreground", isArchived && "opacity-70")}>
                    {article?.name ?? "Article inconnu"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{article?.reference}</p>
                  <p className="mt-2 max-w-[360px] truncate text-sm text-muted-foreground">
                    {movement.note}
                  </p>
                </ListTableCell>
                <ListTableCell>{movement.actor}</ListTableCell>
                <ListTableCell>
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-foreground">
                      {movement.type === "output"
                        ? `-${movement.quantity}`
                        : formatQuantity(movement.quantity)}{" "}
                      {article?.unit}
                    </span>
                    {movement.type === "output" && stockSnapshot ? (
                      <p className="text-xs text-muted-foreground">
                        Reste après sortie: {stockSnapshot.stockAfter} {article?.unit}
                      </p>
                    ) : null}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <div className="space-y-2 text-sm">
                    {isArchived ? (
                      <Badge variant="neutral">Archivé</Badge>
                    ) : movement.replacesMovementId ? (
                      <Badge variant="default">Version active</Badge>
                    ) : (
                      <Badge variant="neutral">Version initiale</Badge>
                    )}
                    {movement.correctionReason ? (
                      <p className="max-w-[260px] text-primary">{movement.correctionReason}</p>
                    ) : null}
                    {replacement ? (
                      <p className="text-muted-foreground">
                        Remplacé le {formatDateTime(replacement.date)}
                      </p>
                    ) : null}
                    {originalMovement ? (
                      <p className="text-muted-foreground">
                        Corrige le mouvement du {formatDateTime(originalMovement.date)}
                      </p>
                    ) : null}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">{formatDateTime(movement.date)}</p>
                </ListTableCell>
                <ListTableCell>
                  <ActionMenu label={`Ouvrir les actions du mouvement ${movement.id}`}>
                    <ActionMenuLink icon={Eye} href={`/stock/movements/${movement.id}`}>
                      Voir le détail
                    </ActionMenuLink>
                    <ActionMenuLink icon={Eye} href={`/stock/articles/${movement.articleId}`}>
                      Voir l’article
                    </ActionMenuLink>
                    <ActionMenuSeparator />
                    <ActionMenuItem
                      icon={FilePenLine}
                      disabled={isArchived}
                      onSelect={() => openEditDialog(movement)}
                    >
                      Modifier
                    </ActionMenuItem>
                    <ActionMenuItem
                      icon={Trash2}
                      disabled={isArchived}
                      destructive
                      onSelect={() => handleDelete(movement)}
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
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
            return;
          }

          setDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <div>
              <DialogTitle>
                {dialogMode === "edit"
                  ? movementType === "entry"
                    ? "Modifier une entrée"
                    : "Modifier une sortie"
                  : "Ajouter une entrée ou une sortie"}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === "edit"
                  ? "La version précédente reste visible dans l’historique pour garder une traçabilité claire."
                  : "Choisissez le type de mouvement, puis complétez les informations utiles au suivi."}
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={closeDialog} />
          </DialogHeader>
          <DialogBody>
            <div className="mb-5 grid gap-4 rounded-[24px] bg-black p-5 text-white sm:grid-cols-3">
              <ImpactTile
                label={dialogMode === "edit" ? "Stock actuel" : "Disponible"}
                value={`${selectedArticle?.availableQty ?? 0}`}
              />
              <ImpactTile
                label={movementType === "entry" ? "Entrée saisie" : "Sortie saisie"}
                value={`${quantityNumber}`}
              />
              <ImpactTile
                label={movementType === "entry" ? "Après mouvement" : "Reste après sortie"}
                value={`${projectedQty}`}
              />
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Type de mouvement">
                  <Select
                    value={movementType}
                    disabled={dialogMode === "edit"}
                    onChange={(event) => setMovementType(event.target.value as MovementType)}
                  >
                    <option value="entry">Entrée</option>
                    <option value="output">Sortie</option>
                  </Select>
                </LabeledField>
                <LabeledField label="Article">
                  <Select
                    value={articleId}
                    disabled={dialogMode === "edit"}
                    onChange={(event) => setArticleId(event.target.value)}
                  >
                    {articles.map((article) => (
                      <option key={article.id} value={article.id}>
                        {article.name}
                      </option>
                    ))}
                  </Select>
                </LabeledField>
              </div>

              <div
                className={cn(
                  "grid gap-4",
                  movementType === "entry" ? "sm:grid-cols-2" : "sm:grid-cols-1"
                )}
              >
                <LabeledField label="Quantité">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </LabeledField>
                {movementType === "entry" ? (
                  <LabeledField label="État du lot">
                    <Select
                      value={condition}
                      onChange={(event) => setCondition(event.target.value as StockCondition)}
                    >
                      {(["new", "good", "maintenance", "used"] as StockCondition[]).map((value) => (
                        <option key={value} value={value}>
                          {getConditionLabel(value)}
                        </option>
                      ))}
                    </Select>
                  </LabeledField>
                ) : null}
              </div>

              {movementType === "entry" ? (
                <LabeledField label="Provenance">
                  <Input value={source} onChange={(event) => setSource(event.target.value)} />
                </LabeledField>
              ) : null}

              <LabeledField label={movementType === "entry" ? "Observation" : "Raison de sortie"}>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={
                    movementType === "entry"
                      ? "Ex : Lot validé après contrôle visuel."
                      : "Ex : Vente client, SAV, casse, démonstration..."
                  }
                />
              </LabeledField>

              {dialogMode === "edit" ? (
                <LabeledField label="Motif de modification">
                  <Textarea
                    value={correctionReason}
                    onChange={(event) => setCorrectionReason(event.target.value)}
                    placeholder="Explique ce qui a été corrigé pour garder un historique utile."
                  />
                </LabeledField>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Annuler
                </Button>
                <Button type="submit" disabled={articles.length === 0}>
                  {dialogMode === "edit"
                    ? "Enregistrer la modification"
                    : movementType === "entry"
                      ? "Ajouter l’entrée"
                      : "Enregistrer la sortie"}
                </Button>
              </div>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getProjectedQty({
  articleQty,
  movementType,
  quantity,
  originalQuantity,
}: {
  articleQty: number;
  movementType: MovementType;
  quantity: number;
  originalQuantity?: number;
}) {
  if (!originalQuantity) {
    return movementType === "entry"
      ? articleQty + quantity
      : Math.max(0, articleQty - quantity);
  }

  if (movementType === "entry") {
    return articleQty - originalQuantity + quantity;
  }

  return Math.max(0, articleQty + originalQuantity - quantity);
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
