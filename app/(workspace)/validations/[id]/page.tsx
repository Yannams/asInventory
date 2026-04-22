import { redirect } from "next/navigation";

export default async function ValidationDetailPage({
}: {
  params: Promise<{ id: string }>;
}) {
  redirect("/stock/movements");
}
