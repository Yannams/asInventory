"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Eye } from "lucide-react";

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
import { RequestStatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

export function ValidationsScreen() {
  const { articles, requests } = useInventory();
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all");
  const [search, setSearch] = useState("");
  const activeFilterCount = statusFilter !== "all" ? 1 : 0;

  const allRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime()
      ),
    [requests]
  );

  const filteredRequests = allRequests.filter((request) => {
    const article = articles.find((item) => item.id === request.articleId);
    const query = search.toLowerCase();

    return (
      (statusFilter === "all" || request.status === statusFilter) &&
      (!query ||
        request.requester.toLowerCase().includes(query) ||
        request.jobReference.toLowerCase().includes(query) ||
        request.reason.toLowerCase().includes(query) ||
        article?.name.toLowerCase().includes(query))
    );
  });

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const urgentPending = pendingRequests.filter((request) => {
    const article = articles.find((item) => item.id === request.articleId);
    return article && article.availableQty <= article.alertThreshold;
  }).length;

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Validation des sorties"
        description="Traitez toutes les demandes dans une liste unique avec un filtre rapide sur les statuts et les urgences."
      />

      <ListStatsGrid>
        <ListStatCard label="En attente" value={`${pendingRequests.length}`} detail="demandes a trancher" />
        <ListStatCard
          label="Sensibles"
          value={`${urgentPending}`}
          detail="touchent un stock deja tendu"
          valueClassName="text-amber-600"
        />
        <ListStatCard
          label="Total validations"
          value={`${requests.length}`}
          detail="historique inclus"
        />
      </ListStatsGrid>

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par demandeur, article ou reference"
          />
          <FilterMenu activeCount={activeFilterCount} onClear={() => setStatusFilter("all")}>
            <LabeledField label="Statut">
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | RequestStatus)}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Validees</option>
                <option value="rejected">Refusees</option>
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
            <ListTableHeadCell>Validation</ListTableHeadCell>
            <ListTableHeadCell>Action</ListTableHeadCell>
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
                  <p className="font-medium text-foreground">
                    {article?.name ?? "Article inconnu"}
                  </p>
                  <p className="mt-1 max-w-[320px] text-sm text-muted-foreground">
                    {request.reason}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-foreground">
                    {request.quantity} {article?.unit}
                  </span>
                </ListTableCell>
                <ListTableCell>
                  <div className="space-y-2">
                    <RequestStatusBadge status={request.status} />
                    <p className="text-sm text-muted-foreground">
                      {article?.availableQty ?? 0} {article?.unit} dispo
                    </p>
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">
                    {request.status === "pending" ? "Non traitee" : "Responsable terrain"}
                  </p>
                  <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">
                    {request.status === "pending"
                      ? "En attente de decision"
                      : request.reviewComment || "Decision enregistree"}
                  </p>
                </ListTableCell>
                <ListTableCell>
                  <Link
                    href={`/validations/${request.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </Link>
                </ListTableCell>
              </tr>
            );
          })}
        </tbody>
      </ListTable>
    </div>
  );
}
