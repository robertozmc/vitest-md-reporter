import { describe, expect, it } from 'vitest';

import { formatDateTime, formatDuration } from '../../src/renderer/utils';

describe(formatDateTime.name, () => {
  it('formats unix timestamp to pretty date and time', () => {
    // Given
    const timestamp = 1769454233389;

    // When
    const result = formatDateTime(timestamp);

    // Then
    expect(result).toEqual('26/01/2026 at 20:03:53');
  });
});

describe(formatDuration.name, () => {
  it('formats duration in milliseconds to duration in milliseconds', () => {
    // Given
    const durationInMs = 582;

    // When
    const result = formatDuration(durationInMs);

    // Then
    expect(result).toEqual('582ms');
  });

  it('formats duration in milliseconds to duration in seconds', () => {
    // Given
    const durationInMs = 12210;

    // When
    const result = formatDuration(durationInMs);

    // Then
    expect(result).toEqual('12.21s');
  });

  it('formats duration in milliseconds to duration in minutes', () => {
    // Given
    const durationInMs = 72071;

    // When
    const result = formatDuration(durationInMs);

    // Then
    expect(result).toEqual('1m 12s');
  });
});
