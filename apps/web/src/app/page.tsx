"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getStravaAuthStatus, getStravaLoginUrl } from "@/lib/api";

export default function HomePage() {
  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });

  return (
    <main className="container grid">
      <section className="card">
        <h1>Trailume</h1>
        <p>
          Generate a compelling activity recap from Strava with deterministic insights and a local narrative model.
        </p>
        <button
          onClick={() => {
            window.location.href = getStravaLoginUrl();
          }}
        >
          Connect with Strava
        </button>

        {statusQuery.data?.connected ? (
          <p>✅ Connected to Strava as {statusQuery.data.athleteName ?? "your account"}.</p>
        ) : (
          <p>Not connected yet.</p>
        )}
        {statusQuery.isError ? <p>Unable to load auth status. Check backend config.</p> : null}
      </section>

      <section className="card">
        <h2>MVP flow</h2>
        <ol>
          <li>Connect Strava</li>
          <li>Pick date range and activity type</li>
          <li>Fetch activities and generate recap story</li>
        </ol>
        <Link href="/dashboard">Go to dashboard</Link>
      </section>
    </main>
  );
}
