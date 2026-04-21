"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { generateRecap } from "@/lib/api";
import { DistanceChart } from "@/components/distance-chart";
import { MetricCards } from "@/components/metric-cards";
import { RouteMapPlaceholder } from "@/components/route-map-placeholder";
import { StandoutCards } from "@/components/standout-cards";
import { HighlightCards } from "@/components/highlight-cards";
import { InsightFlagsPanel } from "@/components/insight-flags";
import { RecapFormValues } from "@/types/recap";

export default function RecapPage() {
  const searchParams = useSearchParams();
  const payload = useMemo<RecapFormValues>(
    () => ({
      startDate: searchParams.get("startDate") ?? new Date().toISOString().slice(0, 10),
      endDate: searchParams.get("endDate") ?? new Date().toISOString().slice(0, 10),
      activityType: (searchParams.get("activityType") as RecapFormValues["activityType"]) ?? "all",
    }),
    [searchParams],
  );

  const recapQuery = useQuery({
    queryKey: ["recap", payload],
    queryFn: () => generateRecap(payload),
  });

  if (recapQuery.isLoading) {
    return <main className="container"><p>Generating your recap...</p></main>;
  }

  if (recapQuery.isError || !recapQuery.data) {
    return <main className="container"><p>Unable to generate recap right now.</p></main>;
  }

  const recap = recapQuery.data;

  return (
    <main className="container grid">
      <section className="card">
        <h1>{recap.title}</h1>
        <p>{recap.narrativeSummary}</p>
        <p><strong>Narrative source:</strong> {recap.narrativeSource}</p>
        <p>
          <strong>Filters:</strong> {recap.metadata.startDate} to {recap.metadata.endDate} · {recap.metadata.selectedActivityType}
        </p>
      </section>

      <MetricCards metrics={recap.keyMetrics} />
      <HighlightCards cards={recap.highlightCards} />
      <DistanceChart points={recap.chartPoints} />
      <StandoutCards activities={recap.standoutActivities} />
      <InsightFlagsPanel flags={recap.insightFlags} />
      <RouteMapPlaceholder />
    </main>
  );
}
