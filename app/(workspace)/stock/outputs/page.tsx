import { redirect } from "next/navigation";

export default function OutputsPage() {
  redirect("/stock/movements?kind=output");
}
