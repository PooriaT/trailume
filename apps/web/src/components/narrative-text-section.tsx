import { RecapNarrative } from "@/types/recap";

export function NarrativeTextSection({ narrative }: { narrative: RecapNarrative }) {
  return (
    <section className="panel recap-section narrative-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Story</p>
          <h2>What this period says</h2>
        </div>
      </div>
      <div className="narrative-block">
        {narrative.highlights.length ? (
          <ul>
            {narrative.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        <p>{narrative.reflection}</p>
        <p className="muted">Narrative source: {narrative.source}</p>
      </div>
    </section>
  );
}
