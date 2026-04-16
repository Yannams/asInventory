"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye } from "lucide-react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

export function ValidationsScreen() {
  const { articles, requests } = useInventory();
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all");

  const allRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) =>
          new Date(right.requestedAt).getTime() - new Date(left.requestedAt).getTime()
      ),
    [requests]
  );

  const filteredRequests = allRequests.filter(
    (request) => statusFilter === "all" || request.status === statusFilter
  );

  const pendingRequests = requests.filter((request) => request.status === "pending");
  const urgentPending = pendingRequests.filter((request) => {
    const article = articles.find((item) => item.id === request.articleId);
    return article && article.availableQty <= article.alertThreshold;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Validation des sorties"
        title="Toutes les demandes dans une seule vue de validation."
        description="La liste melange les demandes en attente, validees et refusees. Le filtre de statut aide a isoler tres vite ce qui doit etre traite."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <SummaryCard label="En attente" value={`${pendingRequests.length}`} detail="demandes a trancher" />
        <SummaryCard label="Sensibles" value={`${urgentPending}`} detail="touchent un stock deja tendu" />
        <SummaryCard
          label="Total validations"
          value={`${requests.length}`}
          detail="historique inclus"
        />
      </section>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="neutral" className="mb-3 w-fit">
              Liste complete
            </Badge>
            <CardTitle className="text-xl">Tableau des validations</CardTitle>
            <CardDescription>
              Une lecture compacte, melangee et filtrable comme sur un poste de gestion.
            </CardDescription>
          </div>
          <div className="w-full max-w-xs">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Filtrer par statut
            </label>
            <Select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | RequestStatus)
              }
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Validees</option>
              <option value="rejected">Refusees</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-black/[0.03] text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    ID
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    Demandeur
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    Article
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    Etat
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    Validation
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const article = articles.find((item) => item.id === request.articleId);

                  return (
                    <tr key={request.id} className="transition hover:bg-black/[0.02]">
                      <td className="border-t border-border px-5 py-4 align-top">
                        <p className="text-base font-semibold uppercase tracking-[0.04em] text-foreground">
                          {request.id}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.requestedAt.slice(0, 10)}
                        </p>
                      </td>
                      <td className="border-t border-border px-5 py-4 align-top">
                        <p className="text-base font-semibold text-foreground">
                          {request.requester}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {request.jobReference}
                        </p>
                      </td>
                      <td className="border-t border-border px-5 py-4 align-top">
                        <p className="text-base font-medium text-foreground">
                          {article?.name ?? "Article inconnu"}
                        </p>
                        <p className="mt-1 max-w-[320px] text-sm text-muted-foreground">
                          {request.reason}
                        </p>
                      </td>
                      <td className="border-t border-border px-5 py-4 align-top">
                        <p className={cn("text-sm font-semibold", getStatusTextClass(request.status))}>
                          {getStatusText(request.status)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {article?.availableQty ?? 0} {article?.unit} dispo
                        </p>
                      </td>
                      <td className="border-t border-border px-5 py-4 align-top">
                        <p className="text-sm font-medium text-foreground">
                          {request.status === "pending"
                            ? "Non traitee"
                            : "Responsable terrain"}
                        </p>
                        <p className="mt-1 max-w-[250px] text-sm text-muted-foreground">
                          {request.status === "pending"
                            ? "En attente de decision"
                            : request.reviewComment || "Decision enregistree"}
                        </p>
                      </td>
                      <td className="border-t border-border px-5 py-4 align-top">
                        <Link
                          href={`/validations/${request.id}`}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary transition hover:bg-primary hover:text-white"
                          aria-label="Voir le detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusText(status: RequestStatus) {
  if (status === "pending") {
    return "En attente";
  }

  if (status === "approved") {
    return "Validee";
  }

  return "Refusee";
}

function getStatusTextClass(status: RequestStatus) {
  if (status === "pending") {
    return "text-primary";
  }

  if (status === "approved") {
    return "text-blue-600";
  }

  return "text-zinc-500";
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
