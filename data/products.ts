import { galleryImages } from "@/lib/store/images";
import type { Product } from "@/lib/store/types";

/**
 * Yeni ürün eklemek için:
 * 1. Görselleri public/media/store/<id>-1.jpg, <id>-2.jpg ... şeklinde ekle.
 * 2. Aşağıya yeni bir obje ekle, images: galleryImages("<id>", <görsel sayısı>).
 * id, kategori/fiyat/beden dışında hiçbir yerde tekrar yazılmaz.
 */

const SIZES_TOP = ["S", "M", "L", "XL", "XXL"];
const SIZES_BOTTOM = ["S", "M", "L", "XL"];
const SIZE_ONE = ["STANDART"];

export const products: Product[] = [
  {
    id: "husran-sweatshirt",
    name: "Hüsran Sweatshirt",
    category: "Sweatshirt",
    price: 1250,
    currency: "TRY",
    sizes: SIZES_TOP,
    description:
      "\"Hüsran\"ın karanlık atmosferini sırtına taşıyan oversize sweatshirt. Yıkanmış siyah kumaş üzerine noir illüstrasyon baskı, kolda çizik detay.",
    images: galleryImages("husran-sweatshirt", 2),
    inStock: true,
  },
  {
    id: "husran-esofman",
    name: "Hüsran Eşofman Altı",
    category: "Eşofman",
    price: 1150,
    currency: "TRY",
    sizes: SIZES_BOTTOM,
    description:
      "Hüsran evreninden: kanlı doku, silah illüstrasyonu ve \"Trust is a liability\" vurgusuyla sweatshirt'ün tamamlayıcısı eşofman altı.",
    images: galleryImages("husran-esofman", 3),
    inStock: true,
  },
  {
    id: "deev-hoodie",
    name: "DEEV Hoodie",
    category: "Hoodie",
    price: 1450,
    currency: "TRY",
    sizes: SIZES_TOP,
    description:
      "DEEV (Deluxe Edition) esintili duman desenli oversize hoodie. İşlemeli imza logo, yıkanmış antrasit kumaş.",
    images: galleryImages("deev-hoodie", 4),
    inStock: true,
  },
  {
    id: "deev-esofman",
    name: "DEEV Eşofman Altı",
    category: "Eşofman",
    price: 1200,
    currency: "TRY",
    sizes: SIZES_BOTTOM,
    description:
      "DEEV kapsülünün eşofman altı — duman efekti ve işlemeli imza detayla hoodie'nin tamamlayıcısı.",
    images: galleryImages("deev-esofman", 2),
    inStock: true,
  },
  {
    id: "ikarus-sapka",
    name: "IKARUS Şapka",
    category: "Şapka",
    price: 600,
    currency: "TRY",
    sizes: SIZE_ONE,
    description:
      "IKARUS albümünün düşen kanat sembolüyle işlemeli, sade ve şık snapback. Kırmızı \"ŞEHİNŞAH\" nakışı.",
    images: galleryImages("ikarus-sapka", 4),
    inStock: true,
  },
  {
    id: "ikarus-sweatshirt",
    name: "IKARUS Sweatshirt",
    category: "Sweatshirt",
    price: 1350,
    currency: "TRY",
    sizes: SIZES_TOP,
    description:
      "IKARUS'un düşen tüy ve hale motifini tonal baskıyla taşıyan, minimal ve şık oversize sweatshirt.",
    images: galleryImages("ikarus-sweatshirt", 3),
    inStock: true,
  },
  {
    id: "karma-sapka",
    name: "Karma Şapka",
    category: "Şapka",
    price: 550,
    currency: "TRY",
    sizes: SIZE_ONE,
    description: "\"Karma\"nın enerjisini neon pembe nakışla yansıtan, glitch detaylı şapka.",
    images: galleryImages("karma-sapka", 3),
    inStock: true,
  },
  {
    id: "yak-yak-yak-sapka",
    name: "Yak Yak Yak Şapka",
    category: "Şapka",
    price: 580,
    currency: "TRY",
    sizes: SIZE_ONE,
    description:
      "\"Yak Yak Yak\"ın ateşli enerjisini alevler içindeki ev işlemesiyle taşıyan, çok renkli katmanlı nakışlı şapka.",
    images: galleryImages("yak-yak-yak-sapka", 3),
    inStock: true,
  },
  {
    id: "yak-yak-yak-sweatshirt",
    name: "Yak Yak Yak Sweatshirt",
    category: "Sweatshirt",
    price: 1300,
    currency: "TRY",
    sizes: SIZES_TOP,
    description:
      "\"Yak Yak Yak\" temalı, sırt baskılı oversize sweatshirt — canlı alev tonları ve mavi çizgi illüstrasyon.",
    images: galleryImages("yak-yak-yak-sweatshirt", 3),
    inStock: true,
  },
  {
    id: "yasamak-sweatshirt",
    name: "Yaşamak Sweatshirt",
    category: "Sweatshirt",
    price: 1100,
    currency: "TRY",
    sizes: SIZES_TOP,
    description:
      "\"Yaşamak\" ruh haliyle; \"memories fade, feeling stays\" iç sesini kolaj halinde taşıyan, karanlık ve dokulu oversize sweatshirt.",
    images: galleryImages("yasamak-sweatshirt", 4),
    inStock: true,
  },
  {
    id: "taktik-esofman",
    name: "Taktik Eşofman Altı",
    category: "Eşofman",
    price: 1050,
    currency: "TRY",
    sizes: SIZES_BOTTOM,
    description: "\"Taktik\" temalı, şifreli el yazısı doku ve dudak ikonuyla sokak stili eşofman altı.",
    images: galleryImages("taktik-esofman", 3),
    inStock: true,
  },
];
