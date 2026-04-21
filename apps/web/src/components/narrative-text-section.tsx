import { RecapNarrative } from "@/types/recap";

export function NarrativeTextSection({ narrative }: { narrative: RecapNarrative }) {
  return (
    <section className="panel">
      <div className="section-heading-row">
        <h2>What this period says</h2>
      </div>
      <div className="narrative-block">
        <ul>
          {narrative.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{narrative.reflection}</p>
        <p className="muted">Narrative provider: {narrative.source}</p>
      </div>
    </section>
  );
}
