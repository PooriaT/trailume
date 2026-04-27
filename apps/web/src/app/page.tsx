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
        <h1>Your Strava activities, shaped into a clear training story.</h1>
        <p className="hero-summary">
          Connect Strava, choose the activities that matter, and generate a focused recap with stats, highlights, and
          narrative context.
        </p>

        <div className="cta-row">
          {authState === "connected" ? (
            <Link className="btn btn-primary" href="/dashboard">
              Build your recap
            </Link>
          ) : (
            <button
              className="btn btn-strava"
              aria-busy={isConnecting || authState === "connecting"}
              disabled={isConnecting || authState === "connecting"}
              onClick={() => {
                setIsConnecting(true);
                window.location.href = getStravaLoginUrl(window.location.origin);
              }}
            >
              {isConnecting ? "Connecting to Strava..." : "Connect with Strava"}
            </button>
          )}
        </div>

        {statusMessage ? <p className="success-text">{statusMessage}</p> : null}
        <p className="status-line">
          {authState === "connected"
            ? `Connected as ${statusQuery.data?.athleteName ?? "your account"}.`
            : null}
          {authState === "connecting" ? "Checking Strava connection..." : null}
          {authState === "not-connected" ? "Start by connecting Strava. Filters and recaps appear after connection." : null}
          {authState === "error" ? "Unable to load auth status right now." : null}
        </p>
      </section>

      <section className="panel flow-panel">
        <article>
          <span>1</span>
          <h3>Connect Strava</h3>
          <p>Authorize Trailume to read the activities needed for your recap.</p>
        </article>
        <article>
          <span>2</span>
          <h3>Select filters</h3>
          <p>Pick a date range and activity type so the story has a clear focus.</p>
        </article>
        <article>
          <span>3</span>
          <h3>Generate recap</h3>
          <p>Trailume groups stats, highlights, charts, and narrative into one page.</p>
        </article>
        <article>
          <span>4</span>
          <h3>View story</h3>
          <p>Read the period back as a polished recap rather than a raw dashboard.</p>
        </article>
      </section>
    </main>
  );
}
