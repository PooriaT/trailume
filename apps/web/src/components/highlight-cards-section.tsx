import { HighlightCard } from "@/types/recap";

export function HighlightCardsSection({ cards }: { cards: HighlightCard[] }) {
  if (!cards.length) {
    return (
      <section className="panel-subtle">
        <h2>Highlights</h2>
        <p>No highlights were generated this time.</p>
      </section>
    );
  }

  return (
    <section className="panel recap-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">What stood out</p>
          <h2>Highlights</h2>
        </div>
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
