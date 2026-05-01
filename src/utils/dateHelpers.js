/**
 * Date utilities for CAT26 Tracker.
 */

const EVAL_DATE = new Date("2026-05-14T23:59:59");

/**
 * Days remaining until evaluation deadline.
 */
export function daysToEval(from = new Date()) {
  const diff = EVAL_DATE.getTime() - from.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format a date string as "May 6" style.
 */
export function shortDate(dateStr) {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Format a Date object as "HH:MM".
 */
export function formatTime(date) {
  if (!date) return "\u2014";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Check if a target date is past due.
 */
export function isPastDue(dateStr, status) {
  if (!dateStr || status === "Completed") return false;
  const target = new Date(dateStr + "T23:59:59");
  return new Date() > target;
}
