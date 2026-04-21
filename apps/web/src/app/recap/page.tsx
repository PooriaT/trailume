"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { generateRecap } from "@/lib/api";
import { HeroRecapSection } from "@/components/hero-recap-section";
import { StatCardsSection } from "@/components/stat-cards-section";
import { HighlightCardsSection } from "@/components/highlight-cards-section";
import { StandoutActivityCardsSection } from "@/components/standout-activity-cards-section";
import { TrendChartSection } from "@/components/trend-chart-section";
import { NarrativeTextSection } from "@/components/narrative-text-section";
import { MapSection } from "@/components/map-section";
import { RecapFormValues } from "@/types/recap";

function RecapLoadingState() {
  return (
    <main className="page-shell recap-layout">
      <section className="panel loading-panel">
        <h1>Building your recap</h1>
        <p>Pulling your activities, shaping insights, and drafting your story.</p>
      </section>
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </main>
  );
}

function RecapErrorState() {
  return (
    <main className="page-shell">
      <section className="panel error-panel">
        <h1>Couldn’t generate this recap</h1>
        <p>Try refreshing, adjusting the date range, or checking Strava connection status.</p>
        <Link className="btn btn-primary" href="/dashboard">
          Back to filters
        </Link>
      </section>
    </main>
  );
}

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
    return <RecapLoadingState />;
  }

  if (recapQuery.isError || !recapQuery.data) {
    return <RecapErrorState />;
  }

  const recap = recapQuery.data;

  return (
    <main className="page-shell recap-layout">
      <HeroRecapSection narrative={recap.narrative} metadata={recap.metadata} />
      <StatCardsSection metrics={recap.keyMetrics} />
      <HighlightCardsSection cards={recap.highlightCards} />
      <TrendChartSection points={recap.chartPoints} />
      <StandoutActivityCardsSection activities={recap.standoutActivities} />
      <NarrativeTextSection narrative={recap.narrative} />
      <MapSection recap={recap} />
    </main>
  );
}
