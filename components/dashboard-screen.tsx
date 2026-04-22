"use client";

import Link from "next/link";
import { ArrowUpFromLine, ArrowUpRight, Boxes, PackagePlus, Repeat2, TriangleAlert } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { MovementTypeBadge, StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DashboardScreen() {
  const { user } = useAuth();
  const { articles, brands, categories, entries, movements, syncError, syncMode } = useInventory();

  const lowStockArticles = articles.filter(
    (article) => article.availableQty <= article.alertThreshold
  );
  const outputs = movements.filter((movement) => movement.type === "output");
  const totalUnits = articles.reduce((sum, article) => sum + article.availableQty, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cockpit stock"
        title="Voir le niveau du stock en un coup d oeil."
        description="Le MVP est centre sur l essentiel: l etat du stock, les entrees recues et les sorties avec leur raison."
        actions={
          <>
            <Link href="/stock/articles" className={buttonVariants()}>
              Voir les articles
            </Link>
            <Link href="/stock/outputs" className={buttonVariants({ variant: "outline" })}>
              Voir les sorties
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Boxes}
          label="Articles suivis"
          value={`${articles.length}`}
          detail="references actives dans le stock"
        />
        <MetricCard
          icon={PackagePlus}
          label="Entrees"
          value={`${entries.length}`}
          detail="receptions deja tracees"
        />
        <MetricCard
          icon={ArrowUpFromLine}
          label="Sorties"
          value={`${outputs.length}`}
          detail="sorties deja enregistrees"
        />
        <MetricCard
          icon={TriangleAlert}
          label="Sous seuil"
          value={`${lowStockArticles.length}`}
          detail="references a surveiller"
          warning
        />
      </section>

      {syncError ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Synchronisation {syncMode === "supabase" ? "Supabase" : "demo"}: {syncError}
        </div>
      ) : (
        <div className="rounded-[24px] border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-foreground">
          Mode actif: <span className="font-medium">{syncMode}</span>. Session:
          {" "}
          <span className="font-medium">{user?.email ?? "demo local"}</span>.
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="neutral" className="mb-3 w-fit">
                Etat du stock
              </Badge>
              <CardTitle className="text-2xl">References les plus sensibles</CardTitle>
              <CardDescription>
                Les articles sous seuil restent visibles avant de devenir une rupture.
              </CardDescription>
            </div>
            <div className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              {totalUnits} unites en stock
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockArticles.length ? (
              lowStockArticles.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-border bg-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{article.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getBrandName(brands, article.brandId)} - {getCategoryName(categories, article.categoryId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StockHealthBadge article={article} />
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground">
                      {article.availableQty} {article.unit}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border p-6 text-sm text-muted-foreground">
                Aucun article n est actuellement sous le seuil d alerte.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Historique recent
            </Badge>
            <CardTitle className="text-2xl text-white">Derniers mouvements</CardTitle>
            <CardDescription className="text-white/65">
              La trace utile pour comprendre ce qui est entre et ce qui est sorti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.slice(0, 6).map((movement) => {
              const article = articles.find((item) => item.id === movement.articleId);

              return (
                <div
                  key={movement.id}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <MovementTypeBadge type={movement.type} />
                      <p className="font-medium text-white">{article?.name ?? "Article inconnu"}</p>
                      <p className="text-sm leading-6 text-white/70">{movement.note}</p>
                    </div>
                    <div className="space-y-1 text-sm text-white/70 sm:text-right">
                      <p>{movement.actor}</p>
                      <p>{formatDateTime(movement.date)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <Link
              href="/stock/movements"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
              )}
            >
              Historique complet
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  warning = false,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("mt-2 text-3xl font-semibold", warning && "text-amber-600")}>{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary",
            warning && "bg-amber-100 text-amber-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
