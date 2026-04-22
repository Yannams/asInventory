"use client";

import { useDeferredValue, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Plus } from "lucide-react";

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
import { RequestStatusBadge, StockHealthBadge } from "@/components/status-badge";
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

export function RequestsScreen() {
  const { articles, requests, createRequest } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [articleId, setArticleId] = useState(articles[0]?.id ?? "");
  const [quantity, setQuantity] = useState("2");
  const [requester, setRequester] = useState("Brice Houngbe");
  const [reason, setReason] = useState("Preparation d une reparation client");
  const [jobReference, setJobReference] = useState("SAV-COT-120");
  const [note, setNote] = useState("Besoin confirme avant 15h");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [articleFilter, setArticleFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (articleFilter !== "all" ? 1 : 0);

  const selectedArticle = articles.find((article) => article.id === articleId);
  const quantityNumber = Number(quantity) || 0;
  const projected = Math.max(0, (selectedArticle?.availableQty ?? 0) - quantityNumber);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime()
      ),
    [requests]
  );

  const filteredRequests = sortedRequests.filter((request) => {
    const article = articles.find((item) => item.id === request.articleId);
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesArticle = articleFilter === "all" || request.articleId === articleFilter;
    const matchesSearch =
      !deferredSearch ||
      request.requester.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      request.reason.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      request.jobReference.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      article?.name.toLowerCase().includes(deferredSearch.toLowerCase());

    return matchesStatus && matchesArticle && matchesSearch;
  });

  const pendingRequests = requests.filter((request) => request.status === "pending").length;
  const approvedRequests = requests.filter((request) => request.status === "approved").length;

  function resetForm() {
    setArticleId(articles[0]?.id ?? "");
    setQuantity("1");
    setRequester("Brice Houngbe");
    setReason("Preparation d une reparation client");
    setJobReference("SAV-COT-120");
    setNote("Besoin confirme avant 15h");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!articleId || quantityNumber <= 0 || !requester.trim() || !reason.trim()) {
      return;
    }

    createRequest({
      articleId,
      quantity: quantityNumber,
      requester: requester.trim(),
      reason: reason.trim(),
      jobReference: jobReference.trim(),
      note: note.trim(),
    });

    setDialogOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Gestion des demandes"
        description="Centralisez les sorties de stock dans une liste claire, filtrable et prete pour la validation."
        action={
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Ajouter une demande
          </Button>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Demandes totales" value={`${requests.length}`} detail="historique inclus" />
        <ListStatCard
          label="En attente"
          value={`${pendingRequests}`}
          detail="demandes a traiter"
          valueClassName="text-amber-600"
        />
        <ListStatCard
          label="Validees"
          value={`${approvedRequests}`}
          detail="sorties deja approuvees"
          valueClassName="text-emerald-600"
        />
      </ListStatsGrid>

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par demandeur, article ou ticket"
          />
          <FilterMenu
            activeCount={activeFilterCount}
            onClear={() => {
              setStatusFilter("all");
              setArticleFilter("all");
            }}
          >
            <LabeledField label="Statut">
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Validees</option>
                <option value="rejected">Refusees</option>
              </Select>
            </LabeledField>
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
            <ListTableHeadCell>Demandeur</ListTableHeadCell>
            <ListTableHeadCell>Article</ListTableHeadCell>
            <ListTableHeadCell>Quantite</ListTableHeadCell>
            <ListTableHeadCell>Statut</ListTableHeadCell>
            <ListTableHeadCell>Date</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((request) => {
            const article = articles.find((item) => item.id === request.articleId);

            return (
              <tr key={request.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <p className="text-lg font-semibold text-foreground">{request.requester}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{request.jobReference}</p>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">{article?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{request.reason}</p>
                </ListTableCell>
                <ListTableCell>
                  <div className="space-y-2">
                    <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                      {request.quantity} {article?.unit}
                    </span>
                    {article ? <StockHealthBadge article={article} /> : null}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <div className="space-y-2">
                    <RequestStatusBadge status={request.status} />
                    {request.reviewComment ? (
                      <p className="max-w-[240px] text-sm text-muted-foreground">
                        {request.reviewComment}
                      </p>
                    ) : null}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(request.requestedAt)}
                  </p>
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
              <DialogTitle>Ajouter une demande</DialogTitle>
              <DialogDescription>
                Creez une sortie de stock avec projection immediate sur le disponible.
              </DialogDescription>
            </div>
            <DialogCloseButton onClick={() => setDialogOpen(false)} />
          </DialogHeader>
          <DialogBody>
            <div className="mb-5 grid gap-4 rounded-[24px] bg-black p-5 text-white sm:grid-cols-3">
              <ImpactTile label="Disponible" value={`${selectedArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Demande" value={`${quantityNumber}`} />
              <ImpactTile label="Reste si validee" value={`${projected}`} />
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <LabeledField label="Article demande">
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
                <LabeledField label="Demandeur">
                  <Input value={requester} onChange={(event) => setRequester(event.target.value)} />
                </LabeledField>
              </div>
              <LabeledField label="Motif">
                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
              </LabeledField>
              <LabeledField label="Ticket SAV, showroom ou besoin interne">
                <Input
                  value={jobReference}
                  onChange={(event) => setJobReference(event.target.value)}
                />
              </LabeledField>
              <LabeledField label="Remarque">
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
                <Button type="submit">Soumettre la demande</Button>
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
