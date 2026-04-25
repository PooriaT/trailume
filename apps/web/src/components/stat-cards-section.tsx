import { KeyMetric } from "@/types/recap";

export function StatCardsSection({ metrics }: { metrics: KeyMetric[] }) {
  if (!metrics.length) {
    return (
      <section className="panel-subtle">
        <h2>Key stats</h2>
        <p>No key stats were available for this range.</p>
      </section>
    );
  }

  return (
    <section className="panel recap-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">At a glance</p>
          <h2>Key stats</h2>
        </div>
      </div>
      <div className="stat-grid">
        {metrics.map((metric) => (
          <article className="stat-card" key={metric.label}>
            <p className="stat-label">{metric.label}</p>
            <p className="stat-value">{metric.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
