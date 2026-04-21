"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getStravaAuthStatus, getStravaLoginUrl } from "@/lib/api";

export default function HomePage() {
  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });

  return (
    <main className="page-shell landing-layout">
      <section className="landing-hero panel">
        <p className="eyebrow">Trailume MVP</p>
        <h1>Turn your training into a story worth sharing.</h1>
        <p className="hero-summary">
          Connect Strava, choose a date range, and generate a polished recap with insights and narrative context.
        </p>

        <div className="cta-row">
          <button
            className="btn btn-primary"
            onClick={() => {
              window.location.href = getStravaLoginUrl();
            }}
          >
            Connect with Strava
          </button>
          <Link className="btn btn-ghost" href="/dashboard">
            Open recap builder
          </Link>
        </div>

        <p className="muted">
          {statusQuery.data?.connected
            ? `Connected as ${statusQuery.data.athleteName ?? "your account"}.`
            : "Not connected yet."}
        </p>
        {statusQuery.isError ? <p className="error-text">Unable to load auth status right now.</p> : null}
      </section>

      <section className="panel feature-grid">
        <article>
          <h3>1. Connect</h3>
          <p>Secure Strava OAuth for activity data.</p>
        </article>
        <article>
          <h3>2. Filter</h3>
          <p>Focus on timeframe and sport type.</p>
        </article>
        <article>
          <h3>3. Share</h3>
          <p>Get a premium recap page built for screenshots.</p>
        </article>
      </section>
    </main>
  );
}
