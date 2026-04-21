"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { RecapFormValues } from "@/types/recap";

const today = new Date().toISOString().slice(0, 10);

export default function DashboardPage() {
  const router = useRouter();
  const { register, handleSubmit } = useForm<RecapFormValues>({
    defaultValues: {
      startDate: today,
      endDate: today,
      activityType: "all",
    },
  });

  return (
    <main className="container grid">
      <section className="card">
        <h1>Recap Filters</h1>
        <form
          className="grid"
          onSubmit={handleSubmit((values) => {
            const params = new URLSearchParams(values as Record<string, string>);
            router.push(`/recap?${params.toString()}`);
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

          <button type="submit">Generate recap</button>
        </form>
      </section>
    </main>
  );
}
