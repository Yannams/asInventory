import { MovementDetailScreen } from "@/components/movement-detail-screen";

export default async function MovementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <MovementDetailScreen movementId={id} />;
}
