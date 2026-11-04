import { createFileRoute } from "@tanstack/react-router";

import founderImg from "@/assets/about/founder.webp";
import cofoundersImg from "@/assets/about/cofounders.webp";
import movementImg from "@/assets/about/movement.webp";
import tennisImg from "@/assets/about/tennis.webp";
import basketballImg from "@/assets/about/basketball.webp";
import labelsImg from "@/assets/about/labels.webp";
import { useReveal } from "@/hooks/use-reveal";
import { getMessages, useT } from "@/i18n";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: ({ match }) => {
    const { locale } = match.context;
    const t = getMessages(locale);
    return seo({
      locale,
      title: t.seo.about.title,
      description: t.seo.about.description,
      path: "/about",
    });
  },
  component: AboutPage,
});

function AboutPage() {
  const { about } = useT();
  const revealRef = useReveal<HTMLElement>();
  const headingClass =
    "mx-auto max-w-2xl font-logo text-2xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl";
  const sectionClass = "space-y-7 sm:space-y-9";
  const bodyClass = "mx-auto max-w-2xl text-foreground/80";

  return (
    <article
      ref={revealRef}
      className="mx-auto max-w-3xl px-5 pt-12 pb-20 text-center text-base leading-[1.85] sm:px-8 sm:pt-20 sm:pb-28 lg:max-w-4xl"
    >
      <header className="rise-fade">
        <h1 className="font-logo text-[clamp(2.5rem,6vw,4.5rem)] leading-none font-semibold tracking-[-0.04em] text-balance">
          {about.title}
        </h1>
        <p className={`mt-7 sm:mt-9 ${bodyClass}`}>{about.intro}</p>
      </header>

      <div className="mt-12 space-y-20 sm:mt-16 sm:space-y-28">
        <div className="space-y-12 text-foreground/80 sm:space-y-16">
          <figure className="rise-fade">
            <img
              src={founderImg}
              alt={about.images.founder}
              width={768}
              height={1365}
              loading="lazy"
              className="mx-auto h-auto w-full max-w-64 sm:max-w-xs"
            />
            <blockquote className="mx-auto mt-8 max-w-2xl font-logo text-2xl leading-snug font-medium tracking-tight text-balance text-foreground sm:mt-10 sm:text-4xl">
              <p>“{about.founder.quote}”</p>
            </blockquote>
            <figcaption className="mt-5 text-xs tracking-wide">
              <span className="block font-semibold text-foreground">
                {about.founder.name}
              </span>
              <span className="mt-1 block text-muted-foreground">
                {about.founder.role}
              </span>
            </figcaption>
          </figure>
          <figure data-reveal>
            <img
              src={cofoundersImg}
              alt={about.images.cofounders}
              width={1400}
              height={933}
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {about.founder.cofounders}
            </figcaption>
          </figure>
        </div>

        <section
          data-reveal
          aria-labelledby="about-goat"
          className={sectionClass}
        >
          <span
            aria-hidden="true"
            className="mx-auto block h-px w-10 bg-foreground/40"
          />
          <h2 id="about-goat" className={headingClass}>
            {about.goat.title}
          </h2>
          <p className={bodyClass}>{about.goat.paragraph}</p>
        </section>

        <section
          data-reveal
          aria-labelledby="about-rise"
          className={sectionClass}
        >
          <h2 id="about-rise" className={headingClass}>
            {about.rise.title}
          </h2>
          <p className="text-sm text-muted-foreground">{about.rise.lead}</p>
          <p className="mx-auto max-w-xl font-logo text-3xl leading-none font-semibold tracking-tight text-balance sm:text-5xl">
            {about.rise.tagline}
          </p>
          <div className="grid grid-cols-3 items-start gap-2 pt-2 sm:gap-4 sm:pt-4">
            {[
              { src: movementImg, alt: about.images.movement },
              { src: tennisImg, alt: about.images.tennis },
              { src: basketballImg, alt: about.images.basketball },
            ].map(({ src, alt }, index) => (
              <img
                key={src}
                src={src}
                alt={alt}
                width={720}
                height={900}
                loading="lazy"
                className={`h-auto w-full ${index === 1 ? "mt-6 sm:mt-10" : ""}`}
              />
            ))}
          </div>
          <p className={bodyClass}>{about.rise.paragraph}</p>
        </section>

        <section
          data-reveal
          aria-labelledby="about-mission"
          className={sectionClass}
        >
          <h2 id="about-mission" className={headingClass}>
            {about.mission.title}
          </h2>
          <p className={bodyClass}>{about.mission.intro}</p>
          <dl className="grid grid-cols-1 border-y border-border py-8 text-foreground/80 sm:grid-cols-2 sm:py-10">
            <div className="px-5 pb-7 sm:px-8 sm:pb-0">
              <dt className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
                {about.mission.visionLabel}
              </dt>
              <dd className="mx-auto mt-4 max-w-xs">{about.mission.vision}</dd>
            </div>
            <div className="border-t border-border px-5 pt-7 sm:border-t-0 sm:border-l sm:px-8 sm:pt-0">
              <dt className="text-xs font-semibold tracking-[0.12em] text-foreground uppercase">
                {about.mission.missionLabel}
              </dt>
              <dd className="mx-auto mt-4 max-w-xs">{about.mission.mission}</dd>
            </div>
          </dl>
          <p className={bodyClass}>{about.mission.closing}</p>
        </section>

        <section
          data-reveal
          aria-labelledby="about-promise"
          className="isolate"
        >
          <img
            src={labelsImg}
            alt={about.images.labels}
            width={1400}
            height={788}
            loading="lazy"
            className="h-auto w-full"
          />
          <div className="relative mx-4 -mt-6 border border-border bg-background px-5 py-9 sm:mx-12 sm:-mt-10 sm:px-10 sm:py-12">
            <h2 id="about-promise" className={headingClass}>
              {about.promise.title}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-[1.85] text-foreground/80">
              {about.promise.paragraph}
            </p>
          </div>
        </section>
      </div>
    </article>
  );
}
