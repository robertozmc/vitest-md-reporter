import { format, intervalToDuration } from 'date-fns';

export const formatDateTime = (timestamp: number) => {
  return format(new Date(timestamp), "dd/MM/yyyy 'at' HH:mm:ss");
};

export const formatDuration = (milliseconds: number) => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

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
