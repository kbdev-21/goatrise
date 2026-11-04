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
    "font-logo text-xl leading-relaxed font-semibold tracking-tight sm:text-2xl";
  const sectionClass = "space-y-6";

  return (
    <article
      ref={revealRef}
      className="mx-auto max-w-3xl px-5 pt-12 pb-20 text-center text-base leading-[1.85] sm:px-8 sm:pt-20 sm:pb-28 lg:max-w-4xl"
    >
      <header className="rise-fade">
        <h1 className="font-logo text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
          {about.title}
        </h1>
        <p className="mt-7 text-foreground/80">{about.intro}</p>
      </header>

      <div className="mt-12 space-y-14 sm:mt-16 sm:space-y-20">
        <div className="space-y-6 text-foreground/80">
          <figure className="rise-fade">
            <img
              src={founderImg}
              alt={about.images.founder}
              width={768}
              height={1365}
              loading="lazy"
              className="mx-auto mb-7 h-auto w-full max-w-sm"
            />
            <blockquote className="italic">
              <p>
                {about.founder.role}: “{about.founder.quote}”
              </p>
            </blockquote>
            <figcaption className="mt-2 text-sm">
              — {about.founder.name}
            </figcaption>
          </figure>
          <figure data-reveal className="pt-4">
            <img
              src={cofoundersImg}
              alt={about.images.cofounders}
              width={1400}
              height={933}
              loading="lazy"
              className="h-auto w-full"
            />
            <figcaption className="mt-5 italic">
              {about.founder.cofounders}
            </figcaption>
          </figure>
        </div>

        <section
          data-reveal
          aria-labelledby="about-goat"
          className={sectionClass}
        >
          <h2 id="about-goat" className={headingClass}>
            {about.goat.title}
          </h2>
          <p className="text-foreground/80">{about.goat.paragraph}</p>
        </section>

        <section
          data-reveal
          aria-labelledby="about-rise"
          className={sectionClass}
        >
          <h2 id="about-rise" className={headingClass}>
            {about.rise.title}
          </h2>
          <p className="italic">{about.rise.lead}</p>
          <p className="font-semibold">{about.rise.tagline}</p>
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {[
              { src: movementImg, alt: about.images.movement },
              { src: tennisImg, alt: about.images.tennis },
              { src: basketballImg, alt: about.images.basketball },
            ].map(({ src, alt }) => (
              <img
                key={src}
                src={src}
                alt={alt}
                width={720}
                height={900}
                loading="lazy"
                className="h-auto w-full"
              />
            ))}
          </div>
          <p className="text-foreground/80">{about.rise.paragraph}</p>
        </section>

        <section
          data-reveal
          aria-labelledby="about-mission"
          className={sectionClass}
        >
          <h2 id="about-mission" className={headingClass}>
            {about.mission.title}
          </h2>
          <p className="text-foreground/80">{about.mission.intro}</p>
          <dl className="space-y-3 text-foreground/80">
            <div>
              <dt className="inline font-semibold text-foreground">
                {about.mission.visionLabel}:
              </dt>{" "}
              <dd className="inline">{about.mission.vision}</dd>
            </div>
            <div>
              <dt className="inline font-semibold text-foreground">
                {about.mission.missionLabel}:
              </dt>{" "}
              <dd className="inline">{about.mission.mission}</dd>
            </div>
          </dl>
          <p className="text-foreground/80">{about.mission.closing}</p>
        </section>

        <section
          data-reveal
          aria-labelledby="about-promise"
          className={sectionClass}
        >
          <img
            src={labelsImg}
            alt={about.images.labels}
            width={1400}
            height={788}
            loading="lazy"
            className="mb-10 h-auto w-full sm:mb-12"
          />
          <h2 id="about-promise" className={headingClass}>
            {about.promise.title}
          </h2>
          <p className="text-lg leading-relaxed text-foreground/80 italic sm:text-xl">
            {about.promise.paragraph}
          </p>
        </section>
      </div>
    </article>
  );
}
