import type { Brand, Category } from "@/lib/types";

export function getBrandName(brands: Brand[], brandId: string) {
  return brands.find((brand) => brand.id === brandId)?.name ?? "Marque inconnue";
}

export function getCategoryName(categories: Category[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Categorie inconnue";
}
