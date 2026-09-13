export type ProductCategory = "Şapka" | "Sweatshirt" | "Hoodie" | "Eşofman" | "Aksesuar";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  currency: "TRY";
  sizes: string[];
  description: string;
  images: string[];
  inStock: boolean;
};
