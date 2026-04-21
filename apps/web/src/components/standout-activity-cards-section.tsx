import { StandoutActivity } from "@/types/recap";

export function StandoutActivityCardsSection({ activities }: { activities: StandoutActivity[] }) {
  if (!activities.length) {
    return <section className="panel-subtle">No standout activities found in this period.</section>;
  }

  return (
    <section className="panel">
      <div className="section-heading-row">
        <h2>Standout activities</h2>
      </div>
      <div className="standout-grid">
        {activities.map((item) => (
          <article className="standout-card" key={item.id}>
            <p className="standout-name">{item.name}</p>
            <p className="standout-reason">{item.reason}</p>
            <p className="standout-meta">
              {item.distanceKm.toFixed(1)} km • {item.elevationM} m gain
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
