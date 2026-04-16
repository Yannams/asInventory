"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { MovementTypeBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MovementsScreen() {
  const { articles, movements } = useInventory();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [articleFilter, setArticleFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const filteredMovements = movements.filter((movement) => {
    const article = articles.find((item) => item.id === movement.articleId);
    const matchesType = typeFilter === "all" || movement.type === typeFilter;
    const matchesArticle = articleFilter === "all" || movement.articleId === articleFilter;
    const matchesQuery =
      !deferredQuery ||
      movement.actor.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      movement.note.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      article?.name.toLowerCase().includes(deferredQuery.toLowerCase());

    return matchesType && matchesArticle && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Historique des mouvements"
        title="Une source unique de verite pour le stock."
        description="Toutes les operations importantes se retrouvent ici pour enqueter sur un ecart, verifier une trace ou preparer un rapport."
        actions={
          <Link href="/reports" className={buttonVariants({ variant: "outline" })}>
            Ouvrir les rapports
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <Badge variant="neutral" className="mb-3 w-fit">
            Filtres
          </Badge>
          <CardTitle className="text-2xl">Trouver un mouvement precis</CardTitle>
          <CardDescription>
            Filtrage par type, article ou acteur pour remonter rapidement a la
            bonne trace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_1fr]">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher par article, acteur ou note"
          />
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">Tous les types</option>
            <option value="entry">Entrees</option>
            <option value="output">Sorties</option>
            <option value="approval">Validations</option>
            <option value="rejection">Refus</option>
            <option value="adjustment">Ajustements</option>
            <option value="return">Retours</option>
          </Select>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="neutral" className="mb-3 w-fit">
              Chronologie
            </Badge>
            <CardTitle className="text-2xl">Mouvements visibles</CardTitle>
            <CardDescription>
              Chaque ligne doit permettre de remonter vers l article ou la
              demande liee.
            </CardDescription>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredMovements.length} mouvement(s)
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredMovements.map((movement) => {
            const article = articles.find((item) => item.id === movement.articleId);

            return (
              <div
                key={movement.id}
                className="grid gap-4 rounded-[26px] border border-border bg-muted/35 p-4 lg:grid-cols-[0.8fr_1.1fr_0.9fr_auto]"
              >
                <div className="space-y-2">
                  <MovementTypeBadge type={movement.type} />
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(movement.date)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{article?.name}</p>
                  <p className="text-sm text-muted-foreground">{movement.note}</p>
                  {movement.relatedRequestId ? (
                    <p className="text-sm text-muted-foreground">
                      Demande liee : {movement.relatedRequestId}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{movement.actor}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantite : {formatQuantity(movement.quantity)}
                  </p>
                </div>
                <div className="flex items-start justify-end">
                  <Link
                    href={`/stock/articles/${movement.articleId}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
                  >
                    Fiche article
                  </Link>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
