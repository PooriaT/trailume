import { StandoutActivity } from "@/types/recap";

export function StandoutCards({ activities }: { activities: StandoutActivity[] }) {
  if (!activities.length) {
    return <p>No standout activities found in this range.</p>;
  }

  return (
    <section className="grid">
      {activities.map((item) => (
        <article className="card" key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.reason}</p>
          <p>{item.distanceKm.toFixed(1)} km · {item.elevationM} m gain</p>
        </article>
      ))}
    </section>
  );
}
