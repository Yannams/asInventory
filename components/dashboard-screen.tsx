"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpFromLine,
  BarChart3,
  Boxes,
  FileText,
  PackagePlus,
  TriangleAlert,
} from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import {
  ListTableCard,
  ListTableCell,
  ListTableHeadCell,
} from "@/components/list-page";
import { PageHeader } from "@/components/page-header";
import { StockHealthBadge, MovementTypeBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getBrandName, getCategoryName } from "@/lib/catalog";
import { formatDateTime } from "@/lib/format";
import { getActiveMovements } from "@/lib/stock";
import { cn } from "@/lib/utils";

type ReportPeriod = "7d" | "30d" | "90d" | "month" | "all";

type ArticlePeriodStats = {
  entryCount: number;
  outputCount: number;
  entryQty: number;
  outputQty: number;
};

const PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "90d", label: "90 derniers jours" },
  { value: "month", label: "Ce mois-ci" },
  { value: "all", label: "Toute la période" },
];

export function DashboardScreen() {
  const { articles, brands, categories, movements, syncError, syncMode } = useInventory();
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>("30d");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const activeMovements = useMemo(() => getActiveMovements(movements), [movements]);
  const filteredMovements = useMemo(
    () => filterMovementsByPeriod(activeMovements, reportPeriod),
    [activeMovements, reportPeriod]
  );
  const lowStockArticles = useMemo(
    () => articles.filter((article) => article.availableQty <= article.alertThreshold),
    [articles]
  );
  const filteredEntries = useMemo(
    () => filteredMovements.filter((movement) => movement.type === "entry"),
    [filteredMovements]
  );
  const filteredOutputs = useMemo(
    () => filteredMovements.filter((movement) => movement.type === "output"),
    [filteredMovements]
  );
  const totalUnits = useMemo(
    () => articles.reduce((sum, article) => sum + article.availableQty, 0),
    [articles]
  );
  const periodLabel = PERIOD_OPTIONS.find((option) => option.value === reportPeriod)?.label ?? "";

  const articleStats = useMemo(() => {
    const stats = new Map<string, ArticlePeriodStats>();

    for (const movement of filteredMovements) {
      if (movement.type !== "entry" && movement.type !== "output") {
        continue;
      }

      const current = stats.get(movement.articleId) ?? emptyArticleStats();

      if (movement.type === "entry") {
        current.entryCount += 1;
        current.entryQty += movement.quantity;
      } else {
        current.outputCount += 1;
        current.outputQty += movement.quantity;
      }

      stats.set(movement.articleId, current);
    }

    return stats;
  }, [filteredMovements]);

  async function handleGeneratePdfReport() {
    try {
      setIsGeneratingPdf(true);

      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const autoTable = autoTableModule.default;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageMargin = 40;

      doc.setFillColor(18, 18, 18);
      doc.roundedRect(pageMargin, pageMargin, pageWidth - pageMargin * 2, 150, 24, 24, "F");

      doc.setFillColor(255, 122, 0);
      doc.roundedRect(pageMargin + 24, pageMargin + 24, 104, 28, 14, 14, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("COCKPIT STOCK", pageMargin + 76, pageMargin + 42, { align: "center" });

      doc.setFontSize(26);
      doc.text("Rapport PDF du stock", pageMargin + 24, pageMargin + 86);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(226, 232, 240);
      doc.text(`Période : ${periodLabel}`, pageMargin + 24, pageMargin + 112);
      doc.text(
        `Généré le : ${new Intl.DateTimeFormat("fr-FR", {
          dateStyle: "full",
          timeStyle: "short",
        }).format(new Date())}`,
        pageMargin + 24,
        pageMargin + 132
      );

      const summaryCards = [
        { label: "Articles suivis", value: `${articles.length}` },
        { label: "Entrées", value: `${filteredEntries.length}` },
        { label: "Sorties", value: `${filteredOutputs.length}` },
        { label: "Unités en stock", value: `${totalUnits}` },
      ];

      const cardWidth = (pageWidth - pageMargin * 2 - 18) / 2;
      const cardHeight = 74;
      const cardsStartY = pageMargin + 170;

      summaryCards.forEach((card, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = pageMargin + column * (cardWidth + 18);
        const y = cardsStartY + row * (cardHeight + 14);

        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(index === 3 ? 15 : 250, index === 3 ? 15 : 250, index === 3 ? 15 : 250);
        doc.roundedRect(x, y, cardWidth, cardHeight, 18, 18, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(index === 3 ? 255 : 100, index === 3 ? 255 : 100, index === 3 ? 255 : 100);
        doc.text(card.label.toUpperCase(), x + 18, y + 22);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(index === 3 ? 255 : 17, index === 3 ? 255 : 17, index === 3 ? 255 : 17);
        doc.text(card.value, x + 18, y + 52);
      });

      let cursorY = cardsStartY + cardHeight * 2 + 34 + 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 17, 17);
      doc.text("Flux des mouvements", pageMargin, cursorY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Lecture des mouvements inclus dans la période sélectionnée pour expliquer les variations du stock.",
        pageMargin,
        cursorY + 18
      );

      autoTable(doc, {
        startY: cursorY + 30,
        margin: { left: pageMargin, right: pageMargin },
        head: [["Type", "Article", "Acteur", "Quantité", "Note", "Date"]],
        body: filteredMovements.map((movement) => {
          const article = articles.find((item) => item.id === movement.articleId);

          return [
            getMovementLabel(movement.type),
            article?.name ?? "Article inconnu",
            movement.actor,
            `${movement.quantity}`,
            movement.note || "Aucune note",
            formatDateTime(movement.date),
          ];
        }),
        styles: {
          fontSize: 9,
          cellPadding: 8,
          textColor: [17, 17, 17],
          lineColor: [229, 231, 235],
        },
        headStyles: {
          fillColor: [255, 122, 0],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });

      doc.addPage();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(17, 17, 17);
      doc.text("État final du stock", pageMargin, pageMargin + 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Vue finale par article avec les entrées, les sorties et le niveau de stock après mouvements.",
        pageMargin,
        pageMargin + 40
      );

      autoTable(doc, {
        startY: pageMargin + 56,
        margin: { left: pageMargin, right: pageMargin },
        head: [[
          "Article",
          "Marque",
          "Catégorie",
          "Référence",
          "Entrées",
          "Sorties",
          "Stock final",
          "Seuil",
          "État",
        ]],
        body: articles.map((article) => {
          const stats = articleStats.get(article.id) ?? emptyArticleStats();
          const stockState =
            article.availableQty <= 0
              ? "Rupture"
              : article.availableQty <= article.alertThreshold
                ? "Sous seuil"
                : "Disponible";

          return [
            article.name,
            getBrandName(brands, article.brandId),
            getCategoryName(categories, article.categoryId),
            article.reference,
            `${stats.entryQty} ${article.unit} (${stats.entryCount})`,
            `${stats.outputQty} ${article.unit} (${stats.outputCount})`,
            `${article.availableQty} ${article.unit}`,
            `${article.alertThreshold} ${article.unit}`,
            stockState,
          ];
        }),
        styles: {
          fontSize: 8,
          cellPadding: 7,
          textColor: [17, 17, 17],
          lineColor: [229, 231, 235],
        },
        headStyles: {
          fillColor: [17, 17, 17],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });

      const pageCount = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Asuka Inventory • Page ${pageNumber}/${pageCount}`,
          pageWidth - pageMargin,
          pageHeight - 18,
          { align: "right" }
        );
      }

      doc.save(`rapport-stock-${formatDateForFile(new Date())}.pdf`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Cockpit stock"
        title="Dashboard"
        description="La vue est centrée sur l’essentiel : l’état du stock, les entrées reçues et les sorties avec leur raison."
        actions={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-[220px]">
              <Select
                aria-label="Choisir une période de rapport"
                value={reportPeriod}
                onChange={(event) => setReportPeriod(event.target.value as ReportPeriod)}
                className="h-12 rounded-full bg-white"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              size="lg"
              className="h-12"
              disabled={isGeneratingPdf}
              onClick={() => {
                void handleGeneratePdfReport();
              }}
            >
              <FileText className="h-4 w-4" />
              {isGeneratingPdf ? "Génération du PDF..." : "Générer le rapport PDF"}
            </Button>
          </div>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          icon={Boxes}
          label="Articles suivis"
          value={`${articles.length}`}
          detail="références actives dans le stock"
        />
        <MetricCard
          icon={PackagePlus}
          label="Entrées"
          value={`${filteredEntries.length}`}
          detail={`mouvements sur ${periodLabel.toLowerCase()}`}
        />
        <MetricCard
          icon={ArrowUpFromLine}
          label="Sorties"
          value={`${filteredOutputs.length}`}
          detail={`mouvements sur ${periodLabel.toLowerCase()}`}
        />
        <MetricCard
          icon={TriangleAlert}
          label="Sous seuil"
          value={`${lowStockArticles.length}`}
          detail="références à surveiller"
          warning
        />
      </section>

      {syncError && syncMode === "demo" ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Synchronisation démo : {syncError}
        </div>
      ) : null}

      <section className="space-y-6">
        <ListTableCard>
          <CardHeader>
            <div className="space-y-3">
              <Badge variant="neutral" className="w-fit">
                État du stock
              </Badge>
              <CardTitle className="text-2xl">Tous les articles en stock</CardTitle>
              <CardDescription>
                Les entrées et sorties sont affichées pour chaque article sur la période sélectionnée.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {articles.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <ListTableHeadCell>Article</ListTableHeadCell>
                      <ListTableHeadCell>Marque</ListTableHeadCell>
                      <ListTableHeadCell>Catégorie</ListTableHeadCell>
                      <ListTableHeadCell>Référence</ListTableHeadCell>
                      <ListTableHeadCell>Entrées</ListTableHeadCell>
                      <ListTableHeadCell>Sorties</ListTableHeadCell>
                      <ListTableHeadCell>Stock</ListTableHeadCell>
                      <ListTableHeadCell>Seuil</ListTableHeadCell>
                      <ListTableHeadCell>État</ListTableHeadCell>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((article) => {
                      const stats = articleStats.get(article.id) ?? emptyArticleStats();

                      return (
                        <tr key={article.id}>
                          <ListTableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{article.name}</p>
                              <p className="text-sm text-muted-foreground">{article.unit}</p>
                            </div>
                          </ListTableCell>
                          <ListTableCell>{getBrandName(brands, article.brandId)}</ListTableCell>
                          <ListTableCell>
                            {getCategoryName(categories, article.categoryId)}
                          </ListTableCell>
                          <ListTableCell>{article.reference}</ListTableCell>
                          <ListTableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {stats.entryQty} {article.unit}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {stats.entryCount} mouvement{stats.entryCount > 1 ? "s" : ""}
                              </p>
                            </div>
                          </ListTableCell>
                          <ListTableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {stats.outputQty} {article.unit}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {stats.outputCount} mouvement{stats.outputCount > 1 ? "s" : ""}
                              </p>
                            </div>
                          </ListTableCell>
                          <ListTableCell>
                            <span className="font-medium">
                              {article.availableQty} {article.unit}
                            </span>
                          </ListTableCell>
                          <ListTableCell>
                            {article.alertThreshold} {article.unit}
                          </ListTableCell>
                          <ListTableCell>
                            <StockHealthBadge article={article} />
                          </ListTableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm text-muted-foreground">
                Aucun article n’est encore disponible dans le stock.
              </div>
            )}
          </CardContent>
        </ListTableCard>

        <ListTableCard className="bg-black text-white">
          <CardHeader>
            <Badge variant="warning" className="mb-3 w-fit">
              Historique récent
            </Badge>
            <CardTitle className="text-2xl text-white">Derniers mouvements</CardTitle>
            <CardDescription className="text-white/65">
              La trace utile pour comprendre ce qui est entré et ce qui est sorti sur {periodLabel.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMovements.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <ListTableHeadCell className="text-white/72">Type</ListTableHeadCell>
                      <ListTableHeadCell className="text-white/72">Article</ListTableHeadCell>
                      <ListTableHeadCell className="text-white/72">Acteur</ListTableHeadCell>
                      <ListTableHeadCell className="text-white/72">Quantité</ListTableHeadCell>
                      <ListTableHeadCell className="text-white/72">Note</ListTableHeadCell>
                      <ListTableHeadCell className="text-white/72">Date</ListTableHeadCell>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.slice(0, 10).map((movement) => {
                      const article = articles.find((item) => item.id === movement.articleId);

                      return (
                        <tr key={movement.id}>
                          <ListTableCell className="border-white/10 text-white">
                            <MovementTypeBadge type={movement.type} />
                          </ListTableCell>
                          <ListTableCell className="border-white/10 text-white">
                            {article?.name ?? "Article inconnu"}
                          </ListTableCell>
                          <ListTableCell className="border-white/10 text-white/72">
                            {movement.actor}
                          </ListTableCell>
                          <ListTableCell className="border-white/10 text-white">
                            {movement.quantity}
                          </ListTableCell>
                          <ListTableCell className="border-white/10 text-white/72">
                            {movement.note || "Aucune note"}
                          </ListTableCell>
                          <ListTableCell className="border-white/10 text-white/72">
                            {formatDateTime(movement.date)}
                          </ListTableCell>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm text-white/65">Aucun mouvement récent à afficher.</div>
            )}
          </CardContent>
        </ListTableCard>
      </section>
    </div>
  );
}

function filterMovementsByPeriod<T extends { date: string }>(items: T[], period: ReportPeriod) {
  if (period === "all") {
    return items;
  }

  const now = new Date();
  const startDate = new Date(now);

  if (period === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else if (period === "90d") {
    startDate.setDate(now.getDate() - 90);
  } else {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  return items.filter((item) => new Date(item.date) >= startDate);
}

function getMovementLabel(type: string) {
  if (type === "entry") {
    return "Entrée";
  }

  if (type === "output") {
    return "Sortie";
  }

  return type;
}

function emptyArticleStats(): ArticlePeriodStats {
  return {
    entryCount: 0,
    outputCount: 0,
    entryQty: 0,
    outputQty: 0,
  };
}

function formatDateForFile(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}-${hours}${minutes}`;
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
