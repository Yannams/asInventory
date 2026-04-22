"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpFromLine, History, PackagePlus } from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { ConditionBadge, MovementTypeBadge, StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";

export function ArticleDetailScreen({ articleId }: { articleId: string }) {
  const { articles, brands, categories, entries, movements } = useInventory();
  const article = articles.find((item) => item.id === articleId);

  if (!article) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6">
          <p className="text-lg font-medium">Article introuvable</p>
          <p className="text-sm text-muted-foreground">
            Cette fiche n existe pas dans le referentiel actuel.
          </p>
          <Link href="/stock/articles" className={buttonVariants({ variant: "outline" })}>
            Retour aux articles
          </Link>
        </CardContent>
      </Card>
    );
  }

  const articleEntries = [...entries]
    .filter((entry) => entry.articleId === article.id)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const articleMovements = [...movements]
    .filter((movement) => movement.articleId === article.id)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const latestEntry = articleEntries[0];
  const totalOutputs = articleMovements
    .filter((movement) => movement.type === "output")
    .reduce((sum, movement) => sum + movement.quantity, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fiche article"
        title={article.name}
        description="Cette fiche concentre le niveau du stock, les dernieres receptions et les sorties enregistrees avec leur raison."
        actions={
          <>
            <Link href="/stock/articles" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="h-4 w-4" />
              Retour liste
            </Link>
            <Link href="/stock/outputs" className={buttonVariants()}>
              <ArrowUpFromLine className="h-4 w-4" />
              Enregistrer une sortie
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <InfoCard label="Stock actuel" value={`${article.availableQty} ${article.unit}`} />
        <InfoCard label="Seuil d alerte" value={`${article.alertThreshold} ${article.unit}`} />
        <InfoCard label="Entrees tracees" value={`${articleEntries.length}`} />
        <InfoCard label="Sorties cumulees" value={`${totalOutputs} ${article.unit}`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Synthese
            </Badge>
            <CardTitle className="text-2xl">Etat de la reference</CardTitle>
            <CardDescription>
              Les infos utiles pour piloter le stock avec un referentiel simple.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailTile label="Marque" value={getBrandName(brands, article.brandId)} />
            <DetailTile label="Categorie" value={getCategoryName(categories, article.categoryId)} />
            <DetailTile label="Reference" value={article.reference} />
            <DetailTile label="Unite" value={article.unit} />
            <div className="rounded-[24px] border border-border p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Sante stock</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StockHealthBadge article={article} />
              </div>
            </div>
            <DetailTile label="Stock disponible" value={`${article.availableQty} ${article.unit}`} />
            <div className="rounded-[24px] border border-border p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Derniere entree</p>
              {latestEntry ? (
                <div className="mt-3 space-y-2 text-sm leading-6 text-foreground">
                  <p>
                    {latestEntry.quantity} {article.unit} recue(s) le {formatDateTime(latestEntry.date)}
                  </p>
                  <p>Provenance: {latestEntry.source}</p>
                  <div className="flex flex-wrap gap-2">
                    <ConditionBadge condition={latestEntry.condition} />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Aucune entree n a encore ete enregistree pour cette reference.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Lecture rapide
            </Badge>
            <CardTitle className="text-2xl text-white">Ce que raconte la fiche</CardTitle>
            <CardDescription className="text-white/65">
              Une synthese courte pour decider vite sur le reassort ou la prochaine sortie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsightRow
              icon={PackagePlus}
              title="Receptions"
              detail={`${articleEntries.length} entree(s) sont deja tracees sur cette reference.`}
            />
            <InsightRow
              icon={ArrowUpFromLine}
              title="Sorties"
              detail={`${totalOutputs} ${article.unit} sont deja sorties du stock.`}
            />
            <InsightRow
              icon={History}
              title="Historique"
              detail={`${articleMovements.length} mouvement(s) au total sur la periode visible.`}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Entrees
            </Badge>
            <CardTitle className="text-2xl">Dernieres receptions</CardTitle>
            <CardDescription>
              Les lots recus avec leur provenance et leur etat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {articleEntries.length ? (
              articleEntries.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-[24px] border border-border bg-muted/35 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="font-medium">
                        +{entry.quantity} {article.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">{entry.source}</p>
                      <ConditionBadge condition={entry.condition} />
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                      <p>{entry.recordedBy}</p>
                      <p>{formatDateTime(entry.date)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucune entree n est encore disponible sur cette fiche.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Mouvements
            </Badge>
            <CardTitle className="text-2xl">Historique recent</CardTitle>
            <CardDescription>
              Entrees et sorties enregistrees sur cette reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {articleMovements.length ? (
              articleMovements.slice(0, 6).map((movement) => (
                <div key={movement.id} className="rounded-[24px] border border-border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <MovementTypeBadge type={movement.type} />
                      <p className="text-sm text-muted-foreground">{movement.note}</p>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                      <p>{movement.actor}</p>
                      <p>{formatDateTime(movement.date)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucun mouvement n est encore enregistre pour cette reference.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-border p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-medium">{value}</p>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof History;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-white">{title}</p>
          <p className="text-sm leading-6 text-white/68">{detail}</p>
        </div>
      </div>
    </div>
  );
}
