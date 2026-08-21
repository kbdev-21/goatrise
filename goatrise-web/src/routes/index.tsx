import { createFileRoute } from "@tanstack/react-router";

import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { BestSellers } from "@/components/home/best-sellers";
import { BrandIntro } from "@/components/home/brand-intro";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  return (
    <>
      <Hero />
      <BestSellers />
      <FeaturedCollections />
      <BrandIntro />
    </>
  );
}
