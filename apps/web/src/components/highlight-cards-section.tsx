import { HighlightCard } from "@/types/recap";

export function HighlightCardsSection({ cards }: { cards: HighlightCard[] }) {
  if (!cards.length) {
    return <section className="panel-subtle">No highlights were generated this time.</section>;
  }

  return (
    <section className="panel">
      <div className="section-heading-row">
        <h2>Highlights</h2>
      </div>
      <div className="highlight-grid">
        {cards.map((card) => (
          <article className="highlight-card" key={card.id}>
            <p className="highlight-title">{card.title}</p>
            <p className="highlight-value">{card.value}</p>
            <p className="highlight-detail">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
