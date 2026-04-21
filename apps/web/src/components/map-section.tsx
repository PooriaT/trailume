import { RecapResponse } from "@/types/recap";

export function MapSection({ recap }: { recap: RecapResponse }) {
  const routeHint = recap.insightFlags.hasRepeatedRouteTendency
    ? `You repeatedly returned to ${recap.insightFlags.repeatedRouteName ?? "a familiar route"}.`
    : null;

  return (
    <section className="panel">
      <div className="section-heading-row">
        <h2>Route map</h2>
      </div>
      <div className="map-shell">
        {routeHint ? (
          <>
            <p>{routeHint}</p>
            <p className="muted">
              Route geometry is not available in this MVP payload yet. This section is ready to use OpenStreetMap tiles
              when polyline data is connected.
            </p>
          </>
        ) : (
          <p className="muted">No route/map data available for this recap.</p>
        )}
      </div>
    </section>
  );
}
