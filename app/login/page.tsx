import { LoginScreen } from "@/components/login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return <LoginScreen nextPath={resolvedSearchParams.next || "/dashboard"} />;
}
