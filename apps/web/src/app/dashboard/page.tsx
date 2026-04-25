"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ApiError, disconnectStrava, fetchActivities, getStravaAuthStatus, getStravaLoginUrl } from "@/lib/api";
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
const FLOW_STEPS = ["Connect Strava", "Select filters", "Generate recap", "View story"];

function FlowSteps({ activeStep }: { activeStep: number }) {
  return (
    <ol className="flow-steps" aria-label="Recap creation steps">
      {FLOW_STEPS.map((step, index) => (
        <li className={index <= activeStep ? "is-active" : undefined} key={step}>
          <span>{index + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function BuilderSkeleton() {
  return (
    <section className="panel loading-panel">
      <p className="eyebrow">Step 1</p>
      <h1>Checking your Strava connection</h1>
      <p className="muted">We’ll show the recap builder as soon as your connection is confirmed.</p>
      <div className="skeleton-grid compact">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </section>
  );
}

function ConnectRequiredPanel({
  isConnecting,
  onConnect,
  hasStatusError,
}: {
  isConnecting: boolean;
  onConnect: () => void;
  hasStatusError: boolean;
}) {
  return (
    <section className="panel connection-panel">
      <p className="eyebrow">Step 1</p>
      <h1>Connect Strava to build a recap</h1>
      <p className="hero-summary">
        Trailume needs your Strava activities before it can filter a date range, find highlights, and write the story.
      </p>
      {hasStatusError ? (
        <p className="error-text">Unable to confirm your Strava connection. You can retry by connecting again.</p>
      ) : null}
      <button className="btn btn-primary" type="button" onClick={onConnect} disabled={isConnecting}>
        {isConnecting ? "Connecting to Strava..." : "Connect with Strava"}
      </button>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<RecapFormValues>({
    defaultValues: defaultFilters,
    mode: "onChange",
  });
  const selectedStartDate = watch("startDate");
  const selectedEndDate = watch("endDate");

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
    isTransitioning: isConnecting,
  });
  const hasDateRangeError = Boolean(selectedStartDate && selectedEndDate && selectedEndDate < selectedStartDate);
  const hasValidDateRange = Boolean(selectedStartDate && selectedEndDate && selectedEndDate >= selectedStartDate);
  const canUseBuilder = authState === "connected" && !disconnectMutation.isPending;
  const canSubmitFilters = canUseBuilder && hasValidDateRange && !activitiesMutation.isPending;

  function handleDisconnect() {
    const confirmed = window.confirm(
      "Disconnect from Strava? Trailume will clear your connection, filters, activity preview, and generated recap.",
    );
    if (!confirmed) {
      return;
    }
    disconnectMutation.mutate();
  }

  function handleConnect() {
    setIsConnecting(true);
    window.location.href = getStravaLoginUrl(window.location.origin);
  }

  function navigateToRecap(values: RecapFormValues) {
    const params = new URLSearchParams({
      startDate: values.startDate,
      endDate: values.endDate,
      activityType: values.activityType,
    });
    router.push(`/recap?${params.toString()}`);
  }

  return (
    <main className="page-shell dashboard-layout">
      <FlowSteps activeStep={canUseBuilder ? 1 : 0} />

      {authState === "connecting" && !statusQuery.data?.connected ? <BuilderSkeleton /> : null}

      {authState === "not-connected" || authState === "error" ? (
        <ConnectRequiredPanel
          isConnecting={isConnecting}
          onConnect={handleConnect}
          hasStatusError={authState === "error"}
        />
      ) : null}

      {canUseBuilder ? (
        <>
          <section className="panel builder-panel">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Step 2</p>
                <h1>Select your recap filters</h1>
              </div>
              <button
                className="btn btn-danger"
                type="button"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect from Strava"}
              </button>
            </div>
            <p className="muted">Connected as {statusQuery.data?.athleteName ?? "your account"}.</p>
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
              <div className="field-row">
                <label>
                  Start date
                  <input
                    type="date"
                    aria-invalid={errors.startDate ? "true" : "false"}
                    {...register("startDate", { required: "Choose a start date." })}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    min={selectedStartDate || undefined}
                    aria-invalid={errors.endDate ? "true" : "false"}
                    {...register("endDate", {
                      required: "Choose an end date.",
                      validate: (value) =>
                        !selectedStartDate || !value || value >= selectedStartDate || "End date must be after start date.",
                    })}
                  />
                </label>
              </div>

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

              <p className={errors.startDate || errors.endDate || hasDateRangeError ? "error-text" : "helper-text"}>
                {errors.startDate?.message ??
                  errors.endDate?.message ??
                  (hasDateRangeError ? "End date must be after start date." : null) ??
                  `Recap window: ${selectedStartDate || "start date"} to ${selectedEndDate || "end date"}.`}
              </p>

              <div className="cta-row action-row">
                <button className="btn btn-ghost" type="submit" disabled={!canSubmitFilters}>
                  {activitiesMutation.isPending ? "Fetching activities..." : "Preview activities"}
                </button>

                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={!canSubmitFilters}
                  onClick={handleSubmit(navigateToRecap)}
                >
                  Generate recap
                </button>
              </div>
            </form>
          </section>

          <section className="panel preview-panel">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Activity preview</h2>
              </div>
            </div>
            {activitiesMutation.isPending ? (
              <div className="activity-skeleton-list" aria-label="Fetching activities">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            ) : null}
            {activitiesMutation.isError ? (
              <div className="state-message error-state">
                <h3>Activities could not be loaded</h3>
                <p>
                  {activitiesMutation.error instanceof ApiError
                    ? activitiesMutation.error.message
                    : "Unable to fetch activities for these filters."}
                </p>
              </div>
            ) : null}
            {!activitiesMutation.isPending && activitiesMutation.data?.empty ? (
              <div className="state-message">
                <h3>No activities found</h3>
                <p>{activitiesMutation.data.message ?? "No activities match this date range or type."}</p>
                <p className="muted">Try widening the date range or choosing all activity types.</p>
              </div>
            ) : null}
            {!activitiesMutation.isPending && activitiesMutation.data?.activities?.length ? (
              <ul className="activity-list">
                {activitiesMutation.data.activities.map((activity) => (
                  <li key={activity.id}>
                    <span>
                      <strong>{activity.name}</strong>
                      <small>{new Date(activity.startTime).toLocaleDateString()}</small>
                    </span>
                    <span>
                      {activity.activityType} • {(activity.distanceM / 1000).toFixed(1)} km
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {!activitiesMutation.data && !activitiesMutation.isError && !activitiesMutation.isPending ? (
              <div className="state-message">
                <h3>Ready when you are</h3>
                <p>Preview activities to check the range, or generate the recap directly when the filters look right.</p>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </main>
  );
}
