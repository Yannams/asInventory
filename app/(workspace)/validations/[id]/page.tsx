import { ValidationDetailScreen } from "@/components/validation-detail-screen";

export default async function ValidationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ValidationDetailScreen requestId={id} />;
}
