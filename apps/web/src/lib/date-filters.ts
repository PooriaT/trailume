import { ActivityType, RecapFormValues } from "@/types/recap";

export type DateRangeValidation = {
  isValid: boolean;
  message: string | null;
};

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function createClampedLocalDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex)));
}

export function formatLocalDate(date: Date): string {
  return [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join("-");
}

export function getOneYearBeforeLocalDate(referenceDate = new Date()): string {
  return formatLocalDate(
    createClampedLocalDate(referenceDate.getFullYear() - 1, referenceDate.getMonth(), referenceDate.getDate()),
  );
}

export function getTodayLocalDate(referenceDate = new Date()): string {
  return formatLocalDate(referenceDate);
}

export function getDefaultRecapFilters(referenceDate = new Date()): RecapFormValues {
  return {
    startDate: getOneYearBeforeLocalDate(referenceDate),
    endDate: getTodayLocalDate(referenceDate),
    activityType: "all" satisfies ActivityType,
  };
}

export function isValidLocalDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day
  );
}

export function validateRecapDateRange({
  startDate,
  endDate,
}: Pick<RecapFormValues, "startDate" | "endDate">): DateRangeValidation {
  if (!startDate) {
    return { isValid: false, message: "Choose a start date." };
  }

  if (!endDate) {
    return { isValid: false, message: "Choose an end date." };
  }

  if (!isValidLocalDateString(startDate)) {
    return { isValid: false, message: "Choose a valid start date." };
  }

  if (!isValidLocalDateString(endDate)) {
    return { isValid: false, message: "Choose a valid end date." };
  }

  if (startDate > endDate) {
    return { isValid: false, message: "Start date must be on or before end date." };
  }

  return { isValid: true, message: null };
}
