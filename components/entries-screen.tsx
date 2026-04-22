"use client";

import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { PackagePlus, Plus } from "lucide-react";

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
import { ConditionBadge } from "@/components/status-badge";
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
import { useToast } from "@/components/ui/toast";
import { formatDateTime, getConditionLabel } from "@/lib/format";
import type { StockCondition } from "@/lib/types";

export function EntriesScreen() {
  const { user } = useAuth();
  const { articles, entries, addEntry } = useInventory();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [articleId, setArticleId] = useState(articles[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [source, setSource] = useState("Fournisseur principal");
  const [condition, setCondition] = useState<StockCondition>("new");
  const [note, setNote] = useState("Reception controlee");
  const [search, setSearch] = useState("");
  const [articleFilter, setArticleFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState<"all" | StockCondition>("all");
  const deferredSearch = useDeferredValue(search);
  const actor = user?.email ?? "Utilisateur connecté";

  const selectedArticle = articles.find((article) => article.id === articleId);
  const quantityNumber = Number(quantity) || 0;
  const projectedQty = (selectedArticle?.availableQty ?? 0) + quantityNumber;
  const activeFilterCount =
    (articleFilter !== "all" ? 1 : 0) + (conditionFilter !== "all" ? 1 : 0);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      ),
    [entries]
  );

  const filteredEntries = sortedEntries.filter((entry) => {
    const article = articles.find((item) => item.id === entry.articleId);
    const query = deferredSearch.toLowerCase();
    const matchesArticle = articleFilter === "all" || entry.articleId === articleFilter;
    const matchesCondition = conditionFilter === "all" || entry.condition === conditionFilter;
    const matchesSearch =
      !query ||
      article?.name.toLowerCase().includes(query) ||
      entry.recordedBy.toLowerCase().includes(query) ||
      entry.source.toLowerCase().includes(query) ||
      entry.note.toLowerCase().includes(query);

    return matchesArticle && matchesCondition && matchesSearch;
  });

  function resetForm() {
    setArticleId(articles[0]?.id ?? "");
    setQuantity("1");
    setSource("Fournisseur principal");
    setCondition("new");
    setNote("Reception controlee");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = addEntry({
      articleId,
      quantity: quantityNumber,
      source: source.trim(),
      condition,
      recordedBy: actor,
      note: note.trim(),
    });

    toast({
      title: result.ok ? "Entrée enregistrée" : "Enregistrement impossible",
      description: result.message,
      variant: result.ok ? "success" : "error",
    });

    if (result.ok) {
      setDialogOpen(false);
      resetForm();
    }
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        icon={PackagePlus}
        title="Gestion des entrées"
        description="Trace les réceptions de stock avec leur provenance et l’état réel du lot reçu."
        action={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter une entrée
          </Button>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Entrées" value={`${entries.length}`} detail="opérations enregistrées" />
        <ListStatCard
          label="Quantités reçues"
          value={`${entries.reduce((sum, entry) => sum + entry.quantity, 0)}`}
          detail="unités ajoutées au stock"
          valueClassName="text-emerald-600"
        />
        <ListStatCard
          label="Lots sensibles"
          value={`${entries.filter((entry) => entry.condition === "maintenance").length}`}
          detail="réceptions en maintenance"
          valueClassName="text-amber-600"
        />
      </ListStatsGrid>

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un article, une provenance ou une note"
          />
          <FilterMenu
            activeCount={activeFilterCount}
            onClear={() => {
              setArticleFilter("all");
              setConditionFilter("all");
            }}
          >
            <LabeledField label="Article">
              <Select value={articleFilter} onChange={(event) => setArticleFilter(event.target.value)}>
                <option value="all">Tous les articles</option>
                {articles.map((article) => (
                  <option key={article.id} value={article.id}>
                    {article.name}
                  </option>
                ))}
              </Select>
            </LabeledField>
              <LabeledField label="État reçu">
              <Select
                value={conditionFilter}
                onChange={(event) => setConditionFilter(event.target.value as "all" | StockCondition)}
              >
                <option value="all">Tous les états</option>
                {(["new", "good", "maintenance", "used"] as StockCondition[]).map((value) => (
                  <option key={value} value={value}>
                    {getConditionLabel(value)}
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
            <ListTableHeadCell>Article</ListTableHeadCell>
            <ListTableHeadCell>Quantité</ListTableHeadCell>
            <ListTableHeadCell>Provenance</ListTableHeadCell>
            <ListTableHeadCell>État</ListTableHeadCell>
            <ListTableHeadCell>Enregistré par</ListTableHeadCell>
            <ListTableHeadCell>Date</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.map((entry) => {
            const article = articles.find((item) => item.id === entry.articleId);

            return (
              <tr key={entry.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <p className="text-lg font-semibold text-foreground">{article?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.note}</p>
                </ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                    +{entry.quantity} {article?.unit}
                  </span>
                </ListTableCell>
                <ListTableCell>{entry.source}</ListTableCell>
                <ListTableCell>
                  <ConditionBadge condition={entry.condition} />
                </ListTableCell>
                <ListTableCell>{entry.recordedBy}</ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">{formatDateTime(entry.date)}</p>
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
              <DialogTitle>Ajouter une entrée</DialogTitle>
              <DialogDescription>
                La réception est automatiquement attribuée à la session connectée.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setDialogOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <div className="mb-5 grid gap-4 rounded-[24px] bg-black p-5 text-white sm:grid-cols-3">
              <ImpactTile label="Stock actuel" value={`${selectedArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Entrée saisie" value={`${quantityNumber}`} />
              <ImpactTile label="Après entrée" value={`${projectedQty}`} />
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <LabeledField label="Article">
                <Select value={articleId} onChange={(event) => setArticleId(event.target.value)}>
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.name}
                    </option>
                  ))}
                </Select>
              </LabeledField>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField label="Quantité reçue">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </LabeledField>
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
              </div>
              <LabeledField label="Provenance">
                <Input value={source} onChange={(event) => setSource(event.target.value)} />
              </LabeledField>
              <LabeledField label="Observation">
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-[120px] w-full rounded-[24px] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={articles.length === 0}>
                  Ajouter au stock
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
