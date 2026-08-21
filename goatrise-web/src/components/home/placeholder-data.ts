import heroImg from "@/assets/hero.jpg";
import d1GoatImg from "@/assets/d1-goat.jpg";
import menImg from "@/assets/men.jpg";
import womenImg from "@/assets/women.jpg";

// Dữ liệu tạm cho trang home redesign — chưa gọi API.
// Toàn bộ ảnh dùng tạm hero.jpg trong /src/assets làm placeholder.

export type Hero = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  image: string;
};

export const hero: Hero = {
  eyebrow: "1st Collection",
  title: "1st Collection\nD'1 GOAT",
  description:
    "Bộ sưu tập đầu tiên của GOAT RISE - hoạt phục và thời trang cổ điển được thiết kế để đồng hành cùng bạn mỗi ngày.",
  ctaLabel: "Khám phá",
  image: heroImg,
};

export type ReleaseAudience = "women" | "men";

export type FeaturedRelease = {
  id: string;
  name: string;
  price: string;
  badge?: string;
  audience: ReleaseAudience;
  colors: string[];
  image: string;
};

export const featuredReleases: FeaturedRelease[] = [
  {
    id: "rel-1",
    name: "Clara Dress",
    price: "7.499.000 VND",
    badge: "New Arrival",
    audience: "women",
    colors: ["#6b7c74", "#5c1f2b"],
    image: heroImg,
  },
  {
    id: "rel-2",
    name: "Hortensia Visor",
    price: "6.999.000 VND",
    badge: "New Arrival",
    audience: "women",
    colors: ["#e7dcc3"],
    image: heroImg,
  },
  {
    id: "rel-3",
    name: "Blanca Tee",
    price: "1.999.000 VND",
    badge: "New Arrival",
    audience: "women",
    colors: ["#cfe0cf", "#f0d4c4"],
    image: heroImg,
  },
  {
    id: "rel-4",
    name: "Icon Hoodie",
    price: "4.499.000 VND",
    badge: "New Arrival",
    audience: "men",
    colors: ["#1c1c1c", "#3a4a5a"],
    image: heroImg,
  },
  {
    id: "rel-5",
    name: "Performance Jacket",
    price: "8.999.000 VND",
    badge: "New Arrival",
    audience: "men",
    colors: ["#d94f1e", "#1c1c1c"],
    image: heroImg,
  },
  {
    id: "rel-6",
    name: "Carlota Polo",
    price: "3.999.000 VND",
    audience: "men",
    colors: ["#f4f0e8", "#e7b7a1"],
    image: heroImg,
  },
];

export type FeaturedCollection = {
  id: string;
  title: string;
  ctaLabel: string;
  image: string;
};

export const featuredCollections: FeaturedCollection[] = [
  {
    id: "col-icons",
    title: "D'1 GOAT",
    ctaLabel: "Shop now",
    image: d1GoatImg,
  },
  {
    id: "col-performance",
    title: "Men",
    ctaLabel: "Shop now",
    image: menImg,
  },
  {
    id: "col-footwear",
    title: "Women",
    ctaLabel: "Shop now",
    image: womenImg,
  },
];
