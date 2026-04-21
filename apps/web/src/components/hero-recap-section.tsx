import { RecapNarrative, RecapMetadata } from "@/types/recap";

interface HeroRecapSectionProps {
  narrative: RecapNarrative;
  metadata: RecapMetadata;
}

export function HeroRecapSection({ narrative, metadata }: HeroRecapSectionProps) {
  return (
    <section className="recap-hero">
      <p className="eyebrow">Your recap story</p>
      <h1>{narrative.title}</h1>
      <p className="hero-summary">{narrative.summary}</p>
      <div className="hero-meta-row">
        <span>
          {metadata.startDate} → {metadata.endDate}
        </span>
        <span>{metadata.selectedActivityType}</span>
        <span>{metadata.rangeDays} day window</span>
      </div>
    </section>
  );
}
