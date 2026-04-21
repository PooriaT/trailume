import { HighlightCard } from "@/types/recap";

export function HighlightCards({ cards }: { cards: HighlightCard[] }) {
  if (!cards.length) {
    return <section className="card"><p>No highlights available yet.</p></section>;
  }

  return (
    <section className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      {cards.map((card) => (
        <article className="card" key={card.id}>
          <h4>{card.title}</h4>
          <p style={{ fontWeight: 700 }}>{card.value}</p>
          <p>{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
