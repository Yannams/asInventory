import { redirect } from "next/navigation";

export default function EntriesPage() {
  redirect("/stock/movements?kind=entry");
}
