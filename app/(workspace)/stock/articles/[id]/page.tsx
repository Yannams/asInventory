import { ArticleDetailScreen } from "@/components/article-detail-screen";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ArticleDetailScreen articleId={id} />;
}
