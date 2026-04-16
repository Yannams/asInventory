"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { useInventory } from "@/components/inventory-provider";
import { PageHeader } from "@/components/page-header";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function EntriesScreen() {
  const { articles, entries, addEntry } = useInventory();
  const [articleId, setArticleId] = useState(articles[0]?.id ?? "");
  const [quantity, setQuantity] = useState("8");
  const [source, setSource] = useState("Fournisseur principal");
  const [recordedBy, setRecordedBy] = useState("Loic K.");
  const [note, setNote] = useState("Reception controlee et rangee");

  const selectedArticle = articles.find((article) => article.id === articleId);
  const quantityNumber = Number(quantity) || 0;
  const projectedQty = (selectedArticle?.availableQty ?? 0) + quantityNumber;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!articleId || quantityNumber <= 0 || !source.trim() || !recordedBy.trim()) {
      return;
    }

    addEntry({
      articleId,
      quantity: quantityNumber,
      source: source.trim(),
      recordedBy: recordedBy.trim(),
      note: note.trim(),
    });

    setQuantity("1");
    setNote("Entree confirmee depuis le module de reception");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entrees de stock"
        title="Enregistrer un approvisionnement sans alourdir la saisie."
        description="Le magasin gagne en fiabilite quand chaque reception est enregistree vite, proprement et avec un impact visible sur le stock."
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <Badge variant="neutral" className="mb-3 w-fit">
              Saisie guidee
            </Badge>
            <CardTitle className="text-2xl">Nouvelle entree</CardTitle>
            <CardDescription>
              Peu de champs, juste ce qu il faut pour tracer la reception et
              mettre a jour le stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Article">
                <Select value={articleId} onChange={(event) => setArticleId(event.target.value)}>
                  {articles.map((article) => (
                    <option key={article.id} value={article.id}>
                      {article.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Quantite recue">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </Field>
                <Field label="Personne qui enregistre">
                  <Input
                    value={recordedBy}
                    onChange={(event) => setRecordedBy(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Fournisseur ou provenance">
                <Input value={source} onChange={(event) => setSource(event.target.value)} />
              </Field>
              <Field label="Observation">
                <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
              </Field>
              <button type="submit" className={cn(buttonVariants(), "w-full")}>
                Ajouter au stock
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-black text-white">
            <CardHeader>
              <Badge variant="warning" className="mb-3 w-fit">
                Impact immediat
              </Badge>
              <CardTitle className="text-2xl text-white">Projection avant validation</CardTitle>
              <CardDescription className="text-white/65">
                La reception doit montrer tout de suite comment le stock se
                repositionne.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <ImpactTile label="Stock actuel" value={`${selectedArticle?.availableQty ?? 0}`} />
              <ImpactTile label="Entree saisie" value={`${quantityNumber}`} />
              <ImpactTile label="Apres entree" value={`${projectedQty}`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="neutral" className="mb-3 w-fit">
                Recents
              </Badge>
              <CardTitle className="text-2xl">Dernieres entrees</CardTitle>
              <CardDescription>
                Les receptions recentes restent visibles pour verifier le flux
                d approvisionnement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {entries.slice(0, 6).map((entry) => {
                const article = articles.find((item) => item.id === entry.articleId);

                return (
                  <div
                    key={entry.id}
                    className="rounded-[24px] border border-border bg-muted/35 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{article?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          +{entry.quantity} {article?.unit} · {entry.source}
                        </p>
                        <p className="text-sm text-muted-foreground">{entry.note}</p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                        <p>{entry.recordedBy}</p>
                        <p>{formatDateTime(entry.date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ImpactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-white/60">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
