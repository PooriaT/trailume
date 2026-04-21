import { InsightFlags } from "@/types/recap";

export function InsightFlagsPanel({ flags }: { flags: InsightFlags }) {
  return (
    <section className="card">
      <h3>Insight signals</h3>
      <ul>
        <li>Frequency trend: <strong>{flags.frequencyTrend}</strong></li>
        <li>Strong finish detected: <strong>{flags.hasStrongFinish ? "Yes" : "No"}</strong></li>
        <li>Slow start detected: <strong>{flags.hasSlowStart ? "Yes" : "No"}</strong></li>
        <li>Fastest effort available: <strong>{flags.hasFastestEffort ? "Yes" : "No"}</strong></li>
        <li>
          Repeated route tendency: <strong>{flags.hasRepeatedRouteTendency ? `Yes (${flags.repeatedRouteName})` : "No"}</strong>
        </li>
      </ul>
    </section>
  );
}
