import { KeyMetric } from "@/types/recap";

export function MetricCards({ metrics }: { metrics: KeyMetric[] }) {
  return (
    <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
      {metrics.map((metric) => (
        <article className="card" key={metric.label}>
          <h4>{metric.label}</h4>
          <p style={{ fontWeight: 700 }}>{metric.value}</p>
        </article>
      ))}
    </section>
  );
}
