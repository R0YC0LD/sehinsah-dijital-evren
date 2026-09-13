import type { Product } from "@/lib/store/types";

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
    images: ["/media/store/husran-sweatshirt-1.jpg", "/media/store/husran-sweatshirt-2.jpg"],
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
    images: [
      "/media/store/husran-esofman-1.jpg",
      "/media/store/husran-esofman-2.jpg",
      "/media/store/husran-esofman-3.jpg",
    ],
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
    images: [
      "/media/store/deev-hoodie-1.jpg",
      "/media/store/deev-hoodie-2.jpg",
      "/media/store/deev-hoodie-3.jpg",
      "/media/store/deev-hoodie-4.jpg",
    ],
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
    images: ["/media/store/deev-esofman-1.jpg", "/media/store/deev-esofman-2.jpg"],
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
    images: [
      "/media/store/ikarus-sapka-1.jpg",
      "/media/store/ikarus-sapka-2.jpg",
      "/media/store/ikarus-sapka-3.jpg",
      "/media/store/ikarus-sapka-4.jpg",
    ],
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
    images: [
      "/media/store/ikarus-sweatshirt-1.jpg",
      "/media/store/ikarus-sweatshirt-2.jpg",
      "/media/store/ikarus-sweatshirt-3.jpg",
    ],
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
    images: [
      "/media/store/karma-sapka-1.jpg",
      "/media/store/karma-sapka-2.jpg",
      "/media/store/karma-sapka-3.jpg",
    ],
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
    images: [
      "/media/store/yak-yak-yak-sapka-1.jpg",
      "/media/store/yak-yak-yak-sapka-2.jpg",
      "/media/store/yak-yak-yak-sapka-3.jpg",
    ],
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
    images: [
      "/media/store/yak-yak-yak-sweatshirt-1.jpg",
      "/media/store/yak-yak-yak-sweatshirt-2.jpg",
      "/media/store/yak-yak-yak-sweatshirt-3.jpg",
    ],
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
    images: [
      "/media/store/yasamak-sweatshirt-1.jpg",
      "/media/store/yasamak-sweatshirt-2.jpg",
      "/media/store/yasamak-sweatshirt-3.jpg",
      "/media/store/yasamak-sweatshirt-4.jpg",
    ],
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
    images: [
      "/media/store/taktik-esofman-1.jpg",
      "/media/store/taktik-esofman-2.jpg",
      "/media/store/taktik-esofman-3.jpg",
    ],
    inStock: true,
  },
];
