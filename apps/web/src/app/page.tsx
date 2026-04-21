"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { getStravaStartUrl } from "@/lib/api";

export default function HomePage() {
  const authMutation = useMutation({ mutationFn: getStravaStartUrl });

  return (
    <main className="container grid">
      <section className="card">
        <h1>Trailume</h1>
        <p>
          Generate a compelling activity recap from Strava with deterministic insights and a local narrative model.
        </p>
        <button
          onClick={async () => {
            const data = await authMutation.mutateAsync();
            window.location.href = data.authorizationUrl;
          }}
          disabled={authMutation.isPending}
        >
          {authMutation.isPending ? "Connecting..." : "Connect with Strava"}
        </button>
        {authMutation.isError ? <p>Unable to start auth flow. Check backend config.</p> : null}
      </section>

      <section className="card">
        <h2>MVP flow</h2>
        <ol>
          <li>Connect Strava</li>
          <li>Pick date range and activity type</li>
          <li>Generate recap story and insights</li>
        </ol>
        <Link href="/dashboard">Go to dashboard</Link>
      </section>
    </main>
  );
}
