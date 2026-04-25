"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ApiError, disconnectStrava, fetchActivities, getStravaAuthStatus } from "@/lib/api";
import { getAuthState } from "@/lib/auth-state";
import { ActivityType, RecapFormValues } from "@/types/recap";

const today = new Date().toISOString().slice(0, 10);
const defaultFilters: RecapFormValues = {
  startDate: today,
  endDate: today,
  activityType: "all",
};
const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "all", label: "All activities" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
];

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<RecapFormValues>({
    defaultValues: defaultFilters,
  });

  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });
  const activitiesMutation = useMutation({ mutationFn: fetchActivities });
  const disconnectMutation = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: (payload) => {
      reset(defaultFilters);
      activitiesMutation.reset();
      queryClient.removeQueries({ queryKey: ["recap"] });
      queryClient.setQueryData(["strava-status"], {
        connected: false,
        provider: "strava",
        athleteName: null,
      });
      window.sessionStorage.setItem("trailume:auth-message", payload.message);
      router.push("/");
    },
  });
  const authState = getAuthState({
    connected: statusQuery.data?.connected,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
  });

  function handleDisconnect() {
    const confirmed = window.confirm(
      "Disconnect from Strava? Trailume will clear your connection, filters, activity preview, and generated recap.",
    );
    if (!confirmed) {
      return;
    }
    disconnectMutation.mutate();
  }

  return (
    <main className="page-shell dashboard-layout">
      <section className="panel">
        <div className="section-heading-row">
          <h1>Build your recap</h1>
          {authState === "connected" ? (
            <button
              className="btn btn-danger"
              type="button"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect from Strava"}
            </button>
          ) : null}
        </div>
        <p className="muted">
          {disconnectMutation.isPending ? "Disconnecting from Strava..." : null}
          {!disconnectMutation.isPending && authState === "connected"
            ? `Connected as ${statusQuery.data?.athleteName ?? "your account"}.`
            : null}
          {!disconnectMutation.isPending && authState === "connecting" ? "Checking Strava connection..." : null}
          {!disconnectMutation.isPending && authState === "not-connected"
            ? "Connect Strava on the home page before generating a recap."
            : null}
          {!disconnectMutation.isPending && authState === "error"
            ? "Unable to confirm your Strava connection right now."
            : null}
        </p>
        {disconnectMutation.isError ? (
          <p className="error-text">
            {disconnectMutation.error instanceof ApiError
              ? disconnectMutation.error.message
              : "Unable to disconnect from Strava. Your current screen has not been reset."}
          </p>
        ) : null}

        <form
          className="filters-grid"
          onSubmit={handleSubmit(async (values) => {
            try {
              await activitiesMutation.mutateAsync(values);
            } catch {
              // Mutation error state is rendered below; avoid unhandled rejection in submit handler.
            }
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
                const params = new URLSearchParams({
                  startDate: values.startDate,
                  endDate: values.endDate,
                  activityType: values.activityType,
                });
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
