"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

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
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MovementsScreen() {
  const { articles, movements } = useInventory();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [articleFilter, setArticleFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);
  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) + (articleFilter !== "all" ? 1 : 0);

  const filteredMovements = useMemo(
    () =>
      [...movements]
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .filter((movement) => {
          const article = articles.find((item) => item.id === movement.articleId);
          const normalizedQuery = deferredQuery.toLowerCase();
          const matchesType = typeFilter === "all" || movement.type === typeFilter;
          const matchesArticle = articleFilter === "all" || movement.articleId === articleFilter;
          const matchesQuery =
            !normalizedQuery ||
            movement.actor.toLowerCase().includes(normalizedQuery) ||
            movement.note.toLowerCase().includes(normalizedQuery) ||
            movement.source?.toLowerCase().includes(normalizedQuery) ||
            article?.name.toLowerCase().includes(normalizedQuery);

          return matchesType && matchesArticle && matchesQuery;
        }),
    [articles, articleFilter, deferredQuery, movements, typeFilter]
  );

  return (
    <div className="space-y-6">
      <ListPageHeader
        title="Historique des mouvements"
        description="Conserve une source unique de verite pour les entrees et les sorties du stock."
        action={
          <>
            <Link href="/stock/entries" className={buttonVariants({ variant: "outline" })}>
              Ajouter une entree
            </Link>
            <Link href="/stock/outputs" className={buttonVariants()}>
              Ajouter une sortie
            </Link>
          </>
        }
      />

      <ListStatsGrid>
        <ListStatCard label="Mouvements" value={`${movements.length}`} detail="trace complete" />
        <ListStatCard
          label="Entrees"
          value={`${movements.filter((movement) => movement.type === "entry").length}`}
          detail="receptions enregistrees"
          valueClassName="text-emerald-600"
        />
        <ListStatCard
          label="Sorties"
          value={`${movements.filter((movement) => movement.type === "output").length}`}
          detail="debits de stock"
          valueClassName="text-amber-600"
        />
      </ListStatsGrid>

      <ListToolbar>
        <ListToolbarRow>
          <ListSearchBar
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un article, une note, un acteur ou une provenance"
          />
          <FilterMenu
            activeCount={activeFilterCount}
            onClear={() => {
              setTypeFilter("all");
              setArticleFilter("all");
            }}
          >
            <LabeledField label="Type">
              <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">Tous les types</option>
                <option value="entry">Entrees</option>
                <option value="output">Sorties</option>
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
            <ListTableHeadCell>Type</ListTableHeadCell>
            <ListTableHeadCell>Article</ListTableHeadCell>
            <ListTableHeadCell>Contexte</ListTableHeadCell>
            <ListTableHeadCell>Acteur</ListTableHeadCell>
            <ListTableHeadCell>Quantite</ListTableHeadCell>
            <ListTableHeadCell>Date</ListTableHeadCell>
            <ListTableHeadCell>Actions</ListTableHeadCell>
          </tr>
        </thead>
        <tbody>
          {filteredMovements.map((movement) => {
            const article = articles.find((item) => item.id === movement.articleId);

            return (
              <tr key={movement.id} className="transition hover:bg-black/[0.015]">
                <ListTableCell>
                  <div className="space-y-2">
                    <MovementTypeBadge type={movement.type} />
                    {movement.condition ? <ConditionBadge condition={movement.condition} /> : null}
                  </div>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-lg font-semibold text-foreground">{article?.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{movement.note}</p>
                </ListTableCell>
                <ListTableCell>
                  <p className="font-medium text-foreground">
                    {movement.source ?? (movement.type === "output" ? "Raison de sortie" : "-")}
                  </p>
                </ListTableCell>
                <ListTableCell>{movement.actor}</ListTableCell>
                <ListTableCell>
                  <span className="rounded-full bg-black/[0.04] px-4 py-2 text-sm font-semibold text-foreground">
                    {movement.type === "output"
                      ? `-${movement.quantity}`
                      : formatQuantity(movement.quantity)}
                    {" "}
                    {article?.unit}
                  </span>
                </ListTableCell>
                <ListTableCell>
                  <p className="text-sm text-muted-foreground">{formatDateTime(movement.date)}</p>
                </ListTableCell>
                <ListTableCell>
                  <Link
                    href={`/stock/articles/${movement.articleId}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                  >
                    Fiche article
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
