"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { fetchActivities, getStravaAuthStatus } from "@/lib/api";
import { RecapFormValues } from "@/types/recap";

const today = new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const router = useRouter();
  const { register, handleSubmit, watch } = useForm<RecapFormValues>({
    defaultValues: {
      startDate: today,
      endDate: today,
      activityType: "all",
    },
  });

  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });
  const activitiesMutation = useMutation({ mutationFn: fetchActivities });
  const selectedType = watch("activityType");

  return (
    <main className="container grid">
      <section className="card">
        <h1>Recap Filters</h1>
        <p>Auth status: {statusQuery.data?.connected ? "Connected" : "Not connected"}</p>
        <form
          className="grid"
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
              <option value="all">All</option>
              <option value="cycling">Cycling</option>
              <option value="running">Running</option>
              <option value="swimming">Swimming</option>
            </select>
          </label>

          <button type="submit" disabled={activitiesMutation.isPending}>
            {activitiesMutation.isPending ? "Loading activities..." : "Fetch activities"}
          </button>

          <button
            type="button"
            onClick={handleSubmit((values) => {
              const params = new URLSearchParams(values as Record<string, string>);
              router.push(`/recap?${params.toString()}`);
            })}
          >
            Generate recap
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Activities preview</h2>
        {activitiesMutation.isError ? <p>Unable to fetch activities for the selected filters.</p> : null}
        {activitiesMutation.data?.empty ? (
          <p>{activitiesMutation.data.message ?? "No activities match this date range or type."}</p>
        ) : null}
        {activitiesMutation.data?.activities?.length ? (
          <ul>
            {activitiesMutation.data.activities.map((activity) => (
              <li key={activity.id}>
                {activity.name} · {activity.activityType} · {(activity.distanceM / 1000).toFixed(1)} km
              </li>
            ))}
          </ul>
        ) : null}
        {!activitiesMutation.data && selectedType ? <p>Submit filters to load activities.</p> : null}
      </section>
    </main>
  );
}
