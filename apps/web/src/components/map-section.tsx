import { RecapResponse } from "@/types/recap";

export function MapSection({ recap }: { recap: RecapResponse }) {
  const routeHint = recap.insightFlags.hasRepeatedRouteTendency
    ? `You repeatedly returned to ${recap.insightFlags.repeatedRouteName ?? "a familiar route"}.`
    : null;

  if (!routeHint) {
    return null;
  }

  return (
    <section className="panel recap-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Route signal</p>
          <h2>Map context</h2>
        </div>
      </div>
      <div className="map-shell">
        <p>{routeHint}</p>
        <p className="muted">Route geometry is not available in this MVP payload yet.</p>
      </div>
    </section>
  );
}
