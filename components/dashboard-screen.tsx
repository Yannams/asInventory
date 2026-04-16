"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  PackageOpen,
  ScanLine,
  ShieldCheck,
} from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { RequestStatusBadge, StockHealthBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const focusDay = "2026-04-15";

export function DashboardScreen() {
  const { articles, requests, movements } = useInventory();

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const lowStockArticles = articles.filter(
    (article) => article.availableQty <= article.alertThreshold
  );

  const entriesToday = movements.filter(
    (movement) => movement.type === "entry" && movement.date.startsWith(focusDay)
  ).length;
  const outputsToday = movements.filter(
    (movement) => movement.type === "output" && movement.date.startsWith(focusDay)
  ).length;

  const usageMap: Record<string, number> = {};

  for (const movement of movements) {
    if (movement.type === "output") {
      usageMap[movement.articleId] = (usageMap[movement.articleId] || 0) + movement.quantity;
    }
  }

  const mostUsedArticles = Object.entries(usageMap)
    .map(([articleId, quantity]) => ({
      article: articles.find((article) => article.id === articleId),
      quantity,
    }))
    .filter((item) => item.article)
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cockpit gestionnaire"
        title="Voir ce qui manque, ce qui attend et ce qui bouge."
        description="Le tableau de bord donne a Mr Loic une lecture immediate du stock AS WORLD TECH, entre produits ASUKA SPIRIT et flux SAV Docteur Asuka."
        actions={
          <>
            <Link href="/validations" className={buttonVariants()}>
              Voir les validations
            </Link>
            <Link
              href="/stock/movements"
              className={buttonVariants({ variant: "outline" })}
            >
              Voir les mouvements
            </Link>
            <Link
              href="/stock/articles"
              className={buttonVariants({ variant: "outline" })}
            >
              Ouvrir les articles
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,122,0,0.28),_transparent_30%),linear-gradient(135deg,_#0b0b0b_0%,_#121212_100%)] text-white xl:col-span-2">
          <CardHeader>
            <Badge variant="warning" className="w-fit">
              Priorites du jour
            </Badge>
            <CardTitle className="text-3xl text-white">
              Le stock doit rester valide, pas seulement visible.
            </CardTitle>
            <CardDescription className="max-w-xl text-white/68">
              Les alertes critiques, les demandes en attente et les mouvements
              recents sont concentres ici pour accelerer la decision.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Boxes}
              label="Stock faible"
              value={`${lowStockArticles.length}`}
              detail="references sous seuil"
              inverse
            />
            <MetricCard
              icon={ClipboardCheck}
              label="Demandes en attente"
              value={`${pendingRequests.length}`}
              detail="a valider a distance"
              inverse
            />
            <MetricCard
              icon={ShieldCheck}
              label="Mouvements suivis"
              value={`${movements.length}`}
              detail="trace unifiee du stock"
              inverse
            />
          </CardContent>
        </Card>
        <MetricCard
          icon={ScanLine}
          label="Entrees du jour"
          value={`${entriesToday}`}
          detail="receptions ou transferts enregistres"
        />
        <MetricCard
          icon={PackageOpen}
          label="Sorties du jour"
          value={`${outputsToday}`}
          detail="materiels remis au terrain"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="neutral" className="mb-3 w-fit">
                  Alertes
                </Badge>
                <CardTitle className="text-2xl">Stock faible a traiter</CardTitle>
                <CardDescription>
                  Les references critiques restent visibles avant qu elles ne
                  bloquent une vente ou une reparation.
                </CardDescription>
              </div>
              <Link
                href="/stock/articles"
                className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
              >
                Voir les articles
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockArticles.slice(0, 4).map((article) => (
                <div
                  key={article.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{article.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {article.reference} · {article.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StockHealthBadge article={article} />
                    <div className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                      {article.availableQty} {article.unit}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge variant="neutral" className="mb-3 w-fit">
                  Trace unifiee
                </Badge>
                <CardTitle className="text-2xl">Mouvements recents</CardTitle>
                <CardDescription>
                  Une lecture chronologique pour comprendre ce qui a ete recu,
                  sorti, valide ou refuse.
                </CardDescription>
              </div>
              <Link
                href="/stock/movements"
                className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
              >
                Historique complet
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {movements.slice(0, 5).map((movement) => {
                const article = articles.find((item) => item.id === movement.articleId);

                return (
                  <div
                    key={movement.id}
                    className="rounded-[24px] border border-border bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{article?.name ?? "Article inconnu"}</p>
                        <p className="text-sm text-muted-foreground">{movement.note}</p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                        <p>{movement.actor}</p>
                        <p>{formatDateTime(movement.date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Badge variant="neutral" className="mb-3 w-fit">
                Validation distante
              </Badge>
              <CardTitle className="text-2xl">Demandes en attente</CardTitle>
              <CardDescription>
                La page la plus strategique du MVP reste visible depuis le
                cockpit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.slice(0, 4).map((request) => {
                const article = articles.find((item) => item.id === request.articleId);
                const projected = Math.max(0, (article?.availableQty ?? 0) - request.quantity);

                return (
                  <div
                    key={request.id}
                    className="rounded-[24px] border border-border bg-muted/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="font-medium">{request.requester}</p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {article?.name} · {request.quantity} {article?.unit} ·{" "}
                          {request.jobReference}
                        </p>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                      <RequestStatusBadge status={request.status} />
                    </div>
                    <p className="mt-3 text-sm text-foreground">
                      Reste si validee : {projected} {article?.unit}
                    </p>
                  </div>
                );
              })}
              <Link href="/validations" className={cn(buttonVariants(), "w-full")}>
                Traiter les validations
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-black text-white">
            <CardHeader>
              <Badge variant="warning" className="mb-3 w-fit">
                Materiel le plus utilise
              </Badge>
              <CardTitle className="text-2xl text-white">
                Ce qui sort le plus du stock
              </CardTitle>
              <CardDescription className="text-white/65">
                Une vue rapide pour reperer les tensions et preparer le reassort.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mostUsedArticles.map((item) => (
                <div
                  key={item.article?.id}
                  className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <p className="font-medium text-white">{item.article?.name}</p>
                    <p className="text-sm text-white/60">{item.article?.reference}</p>
                  </div>
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white">
                    {item.quantity} sorties
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="neutral" className="mb-3 w-fit">
                Signaux forts
              </Badge>
              <CardTitle className="text-2xl">Alertes a ne pas manquer</CardTitle>
              <CardDescription>
                Un condense des situations qui peuvent bloquer la semaine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <AlertRow
                icon={AlertTriangle}
                title="Ecrans SAV sous seuil"
                detail="Les ecrans iPhone 13 et Galaxy A54 approchent deja la rupture atelier."
              />
              <AlertRow
                icon={ClipboardCheck}
                title="2 validations prioritaires"
                detail="Des demandes showroom et SAV attendent encore une decision de sortie."
              />
              <AlertRow
                icon={ShieldCheck}
                title="Historique complet"
                detail="Chaque action importante alimente deja la trace des rapports."
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  inverse = false,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  detail: string;
  inverse?: boolean;
}) {
  return (
    <Card className={cn(inverse && "border-white/10 bg-white/5 text-white shadow-none")}>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className={cn("text-sm text-muted-foreground", inverse && "text-white/60")}>
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
          <p className={cn("mt-2 text-sm text-muted-foreground", inverse && "text-white/68")}>
            {detail}
          </p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary",
            inverse && "bg-white/10 text-primary"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function AlertRow({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}
