"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { ApiError, disconnectStrava, fetchActivities, getStravaAuthStatus, getStravaLoginUrl } from "@/lib/api";
import { getAuthState } from "@/lib/auth-state";
import { getDefaultRecapFilters, validateRecapDateRange } from "@/lib/date-filters";
import { ActivityType, RecapFormValues } from "@/types/recap";

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "all", label: "All activities" },
  { value: "cycling", label: "Cycling" },
  { value: "running", label: "Running" },
  { value: "swimming", label: "Swimming" },
];
const FLOW_STEPS = ["Connect Strava", "Select filters", "Generate recap", "View story"];
const MONTH_OPTIONS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function getDateParts(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function buildLocalDateValue(year: string, month: string, day: string): string {
  if (!year || !month || !day) {
    return "";
  }

  const maxDay = new Date(Number(year), Number(month), 0).getDate();
  return `${year}-${month}-${padDatePart(Math.min(Number(day), maxDay))}`;
}

function getYearOptions(referenceDate: Date): string[] {
  const currentYear = referenceDate.getFullYear();

  return Array.from({ length: 16 }, (_, index) => String(currentYear - index));
}

function formatDisplayDate(value: string): string {
  const { year, month, day } = getDateParts(value);
  if (!year || !month || !day) {
    return "Select date";
  }

  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCalendarDays(year: string, month: string) {
  const firstDay = new Date(Number(year), Number(month) - 1, 1).getDay();
  const dayCount = new Date(Number(year), Number(month), 0).getDate();

  return [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => padDatePart(index + 1)),
  ];
}

function DatePickerField({
  label,
  value,
  onChange,
  onBlur,
  errorMessage,
  yearOptions,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  errorMessage?: string;
  yearOptions: string[];
}) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { year, month, day } = getDateParts(value);
  const [visibleYear, setVisibleYear] = useState(year || yearOptions[0] || String(new Date().getFullYear()));
  const [visibleMonth, setVisibleMonth] = useState(month || padDatePart(new Date().getMonth() + 1));
  const invalid = Boolean(errorMessage);
  const calendarDays = getCalendarDays(visibleYear, visibleMonth);
  const visibleMonthLabel = MONTH_OPTIONS.find((option) => option.value === visibleMonth)?.label ?? visibleMonth;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  function moveMonth(offset: number) {
    const nextDate = new Date(Number(visibleYear), Number(visibleMonth) - 1 + offset, 1);
    const nextYear = String(nextDate.getFullYear());

    if (!yearOptions.includes(nextYear)) {
      return;
    }

    setVisibleYear(nextYear);
    setVisibleMonth(padDatePart(nextDate.getMonth() + 1));
  }

  return (
    <div className="date-picker-field" ref={pickerRef}>
      <label>
        {label}
        <button
          className="date-menu-button"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-invalid={invalid ? "true" : "false"}
          aria-label={`${label}: ${formatDisplayDate(value)}`}
          onBlur={onBlur}
          onClick={() => {
            setVisibleYear(year || visibleYear);
            setVisibleMonth(month || visibleMonth);
            setIsOpen((current) => !current);
          }}
        >
          <span>{formatDisplayDate(value)}</span>
          <span aria-hidden="true">v</span>
        </button>
      </label>

      {isOpen ? (
        <div className="date-popover" role="dialog" aria-label={`${label} picker`}>
          <div className="date-popover-header">
            <button className="icon-button" type="button" aria-label={`${label} previous month`} onClick={() => moveMonth(-1)}>
              &lt;
            </button>
            <strong>
              {visibleMonthLabel} {visibleYear}
            </strong>
            <button className="icon-button" type="button" aria-label={`${label} next month`} onClick={() => moveMonth(1)}>
              &gt;
            </button>
          </div>

          <div className="date-picker-selects">
            <label>
              <span className="sr-only">{label} </span>Month
              <select
                aria-label={`${label} month`}
                value={visibleMonth}
                onChange={(event) => setVisibleMonth(event.target.value)}
              >
                {MONTH_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">{label} </span>Year
              <select
                aria-label={`${label} year`}
                value={visibleYear}
                onChange={(event) => setVisibleYear(event.target.value)}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="date-calendar-grid" role="grid" aria-label={`${label} calendar`}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => (
              <span className="weekday-label" key={weekday}>
                {weekday}
              </span>
            ))}
            {calendarDays.map((calendarDay, index) =>
              calendarDay ? (
                <button
                  className={calendarDay === day && visibleMonth === month && visibleYear === year ? "is-selected" : undefined}
                  key={`${visibleYear}-${visibleMonth}-${calendarDay}`}
                  type="button"
                  aria-label={`${label} ${visibleMonthLabel} ${Number(calendarDay)}, ${visibleYear}`}
                  onClick={() => {
                    onChange(buildLocalDateValue(visibleYear, visibleMonth, calendarDay));
                    setIsOpen(false);
                  }}
                >
                  {Number(calendarDay)}
                </button>
              ) : (
                <span aria-hidden="true" key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
      <button className="btn btn-strava" type="button" onClick={onConnect} disabled={isConnecting} aria-busy={isConnecting}>
        {isConnecting ? "Connecting to Strava..." : "Connect with Strava"}
      </button>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const defaultFilters = useMemo(() => getDefaultRecapFilters(), []);
  const yearOptions = useMemo(() => getYearOptions(new Date()), []);
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<RecapFormValues>({
    defaultValues: defaultFilters,
    mode: "onChange",
  });
  const selectedStartDate = watch("startDate");
  const selectedEndDate = watch("endDate");
  const dateRangeValidation = validateRecapDateRange({
    startDate: selectedStartDate,
    endDate: selectedEndDate,
  });

  const statusQuery = useQuery({ queryKey: ["strava-status"], queryFn: getStravaAuthStatus });
  const activitiesMutation = useMutation({ mutationFn: fetchActivities });
  const disconnectMutation = useMutation({
    mutationFn: disconnectStrava,
    onSuccess: (payload) => {
      reset(getDefaultRecapFilters());
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
  const canUseBuilder = authState === "connected" && !disconnectMutation.isPending;
  const canSubmitFilters = canUseBuilder && dateRangeValidation.isValid && !activitiesMutation.isPending;

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
                if (!validateRecapDateRange(values).isValid) {
                  return;
                }

                try {
                  await activitiesMutation.mutateAsync(values);
                } catch {
                  // Mutation error state is rendered below; avoid unhandled rejection in submit handler.
                }
              })}
            >
              <div className="field-row">
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label="Start date"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      errorMessage={!dateRangeValidation.isValid ? dateRangeValidation.message ?? undefined : undefined}
                      yearOptions={yearOptions}
                    />
                  )}
                />

                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <DatePickerField
                      label="End date"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      errorMessage={!dateRangeValidation.isValid ? dateRangeValidation.message ?? undefined : undefined}
                      yearOptions={yearOptions}
                    />
                  )}
                />
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

              <p className={!dateRangeValidation.isValid ? "error-text" : "helper-text"}>
                {dateRangeValidation.message ??
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
                  onClick={handleSubmit((values) => {
                    if (!validateRecapDateRange(values).isValid) {
                      return;
                    }

                    navigateToRecap(values);
                  })}
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
