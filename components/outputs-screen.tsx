"use client";

import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { ArrowUpFromLine } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
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
import { formatDateTime } from "@/lib/format";

type Feedback = {
  kind: "success" | "error";
  text: string;
};

export function OutputsScreen() {
  const { user } = useAuth();
  const { articles, movements, addOutput } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [articleId, setArticleId] = useState(articles[0]?.id ?? "");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [articleFilter, setArticleFilter] = useState("all");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const deferredSearch = useDeferredValue(search);
  const actor = user?.email ?? "Utilisateur connecte";

  const selectedArticle = articles.find((article) => article.id === articleId);
  const quantityNumber = Number(quantity) || 0;
  const projectedQty = Math.max(0, (selectedArticle?.availableQty ?? 0) - quantityNumber);

  const outputs = useMemo(
    () =>
      movements
        .filter((movement) => movement.type === "output")
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
    [movements]
  );

  const filteredOutputs = outputs.filter((movement) => {
    const article = articles.find((item) => item.id === movement.articleId);
    const query = deferredSearch.toLowerCase();
    const matchesArticle = articleFilter === "all" || movement.articleId === articleFilter;
    const matchesSearch =
      !query ||
      movement.actor.toLowerCase().includes(query) ||
      movement.note.toLowerCase().includes(query) ||
      article?.name.toLowerCase().includes(query);

    return matchesArticle && matchesSearch;
  });

  function resetForm() {
    setArticleId(articles[0]?.id ?? "");
    setQuantity("1");
    setReason("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = addOutput({
      articleId,
      quantity: quantityNumber,
      actor,
      note: reason.trim(),
    });

    setFeedback({
      kind: result.ok ? "success" : "error",
      text: result.message,
    });

    if (result.ok) {
      setDialogOpen(false);
      resetForm();
    }
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Gestion des sorties"
        description="Enregistre chaque sortie avec sa raison pour garder une trace claire de ce qui quitte le stock."
        action={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <ArrowUpFromLine className="h-4 w-4" />
            Ajouter une sortie
          </Button>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Sorties" value={`${outputs.length}`} detail="operations enregistrees" />
        <ListStatCard
          label="Unites sorties"
          value={`${outputs.reduce((sum, movement) => sum + movement.quantity, 0)}`}
          detail="debits cumules"
          valueClassName="text-amber-600"
        />
        <ListStatCard
          label="Articles touches"
          value={`${new Set(outputs.map((movement) => movement.articleId)).size}`}
          detail="references concernees"
        />
      </ListStatsGrid>
      {feedback ? <ListFeedbackBanner kind={feedback.kind} text={feedback.text} /> : null}

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un article, un acteur ou une raison"
          />
          <FilterMenu activeCount={articleFilter !== "all" ? 1 : 0} onClear={() => setArticleFilter("all")}>
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
          </FilterMenu>
        </ListToolbarRow>
      </ListToolbar>

      <ListTable>
        <thead>
          <tr className="bg-black/[0.03] text-left">
            <ListTableHeadCell>Article</ListTableHeadCell>
            <ListTableHeadCell>Quantite</ListTableHeadCell>
            <ListTableHeadCell>Raison</ListTableHeadCell>
            <ListTableHeadCell>Enregistre par</ListTableHeadCell>
            <ListTableHeadCell>Date</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredOutputs.map((movement) => {
            const article = articles.find((item) => item.id === movement.articleId);

            return (
              <tr key={movement.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <p className="text-lg font-semibold text-foreground">{article?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{article?.reference}</p>
                </ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
                    -{movement.quantity} {article?.unit}
                  </span>
                </ListTableCell>
                <ListTableCell>
                  <p className="max-w-[360px] text-sm text-foreground">{movement.note}</p>
                </ListTableCell>
                <ListTableCell>{movement.actor}</ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">{formatDateTime(movement.date)}</p>
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
              <DialogTitle>Ajouter une sortie</DialogTitle>
              <DialogDescription>
                La raison de sortie est obligatoire pour garder un historique exploitable.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setDialogOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <div className="mb-5 grid gap-4 rounded-[24px] bg-black p-5 text-white sm:grid-cols-3">
              <ImpactTile label="Disponible" value={`${selectedArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Sortie saisie" value={`${quantityNumber}`} />
              <ImpactTile label="Reste apres sortie" value={`${projectedQty}`} />
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
                <LabeledField label="Quantite">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </LabeledField>
                <LabeledField label="Session connectee">
                  <Input value={actor} disabled />
                </LabeledField>
              </div>
              <LabeledField label="Raison de sortie">
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ex: Vente client, SAV, demonstration, casse, usage interne..."
                  className="min-h-[120px] w-full rounded-[24px] border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </LabeledField>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={articles.length === 0}>
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
