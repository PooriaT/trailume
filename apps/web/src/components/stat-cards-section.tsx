import { KeyMetric } from "@/types/recap";

export function StatCardsSection({ metrics }: { metrics: KeyMetric[] }) {
  if (!metrics.length) {
    return <section className="panel-subtle">No key stats yet for this range.</section>;
  }

  return (
    <section className="stat-grid">
      {metrics.map((metric) => (
        <article className="stat-card" key={metric.label}>
          <p className="stat-label">{metric.label}</p>
          <p className="stat-value">{metric.value}</p>
        </article>
      ))}
    </section>
  );
}
