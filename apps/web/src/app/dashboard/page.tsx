"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ApiError, fetchActivities, getStravaAuthStatus } from "@/lib/api";
import { ActivityType, RecapFormValues } from "@/types/recap";

const today = new Date().toISOString().slice(0, 10);
const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "all", label: "All activities" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<RecapFormValues>({
    defaultValues: {
      startDate: today,
      endDate: today,
      activityType: "all",
    },
  });

  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });
  const activitiesMutation = useMutation({ mutationFn: fetchActivities });

  return (
    <main className="page-shell dashboard-layout">
      <section className="panel">
        <div className="section-heading-row">
          <h1>Build your recap</h1>
        </div>
        <p className="muted">
          {statusQuery.data?.connected
            ? `Connected as ${statusQuery.data.athleteName ?? "your account"}.`
            : "Connect Strava on the home page before generating a recap."}
        </p>

        <form
          className="filters-grid"
          onSubmit={handleSubmit(async (values) => {
            await activitiesMutation.mutateAsync(values);
          })}
        >
          <label>
            Start date
            <input type="date" {...register("startDate", { required: true })} />
          </label>

          <label>
            End date
            <input type="date" {...register("endDate", { required: true })} />
          </label>

          <label>
            Activity type
            <select {...register("activityType")}>
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="cta-row">
            <button className="btn btn-ghost" type="submit" disabled={activitiesMutation.isPending}>
              {activitiesMutation.isPending ? "Loading preview..." : "Preview activities"}
            </button>

            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSubmit((values) => {
                const params = new URLSearchParams(values as Record<string, string>);
                router.push(`/recap?${params.toString()}`);
              })}
            >
              Generate recap
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading-row">
          <h2>Activity preview</h2>
        </div>
        {activitiesMutation.isError ? (
          <p className="error-text">
            {activitiesMutation.error instanceof ApiError
              ? activitiesMutation.error.message
              : "Unable to fetch activities for these filters."}
          </p>
        ) : null}
        {activitiesMutation.data?.empty ? (
          <p className="muted">{activitiesMutation.data.message ?? "No activities match this date range or type."}</p>
        ) : null}
        {activitiesMutation.data?.activities?.length ? (
          <ul className="activity-list">
            {activitiesMutation.data.activities.map((activity) => (
              <li key={activity.id}>
                <span>{activity.name}</span>
                <span>
                  {activity.activityType} • {(activity.distanceM / 1000).toFixed(1)} km
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {!activitiesMutation.data && !activitiesMutation.isError ? (
          <p className="muted">Set filters and preview activities before generating your recap.</p>
        ) : null}
      </section>
    </main>
  );
}
