import { MovementsScreen } from "@/components/movements-screen";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const kind = params.kind === "entry" || params.kind === "output" ? params.kind : null;

  return <MovementsScreen initialKind={kind} />;
}
