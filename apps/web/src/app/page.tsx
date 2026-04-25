"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStravaAuthStatus, getStravaLoginUrl } from "@/lib/api";
import { getAuthState } from "@/lib/auth-state";

export default function HomePage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });
  const authState = getAuthState({
    connected: statusQuery.data?.connected,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    isTransitioning: isConnecting,
  });

  useEffect(() => {
    const message = window.sessionStorage.getItem("trailume:auth-message");
    if (!message) {
      return;
    }
    setStatusMessage(message);
    window.sessionStorage.removeItem("trailume:auth-message");
  }, []);

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
            disabled={isConnecting}
            onClick={() => {
              setIsConnecting(true);
              window.location.href = getStravaLoginUrl();
            }}
          >
            {isConnecting ? "Connecting..." : "Connect with Strava"}
          </button>
          <Link className="btn btn-ghost" href="/dashboard">
            Open recap builder
          </Link>
        </div>

        {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
        <p className="muted">
          {authState === "connected"
            ? `Connected as ${statusQuery.data?.athleteName ?? "your account"}.`
            : null}
          {authState === "connecting" ? "Checking Strava connection..." : null}
          {authState === "not-connected" ? "Not connected yet." : null}
          {authState === "error" ? "Unable to load auth status right now." : null}
        </p>
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
