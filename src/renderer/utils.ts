import { format, intervalToDuration } from 'date-fns';

/**
 * Formats timestamp to pretty format.
 *
 * @param timestamp - The timestamp value since 1 January 1970.
 * @example
 * // returns "10/01/2026 at 15:47:28"
 * formatDateTime(1768052848);
 * @returns           The formatted date time value.
 */
export const formatDateTime = (timestamp: number): string => {
  return format(new Date(timestamp), "dd/MM/yyyy 'at' HH:mm:ss");
};

/**
 * Formats duration in milliseconds to minutes/seconds/milliseconds.
 *
 * @param milliseconds - The number of milliseconds to format.
 * @example
 * // returns "12.21s"
 * formatDuration(12210);
 * @returns              The formatted duration.
 */
export const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1000) return `${milliseconds}ms`;

  const duration = intervalToDuration({
    start: 0,
    end: milliseconds,
  });

  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  if (minutes === 0) {
    const fractionalSeconds = seconds + (milliseconds % 1000) / 1000;
    return `${fractionalSeconds.toFixed(2)}s`;
  }

  return `${minutes}m ${seconds}s`;
};
