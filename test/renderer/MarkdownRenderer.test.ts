import { describe, expect, it } from 'vitest';

import { MarkdownRenderer } from '../../src/renderer/MarkdownRenderer';
import type { TestRunData } from '../../src/types';
import {
  expectHeading,
  expectTable,
  expectTableCell,
  expectTableRow,
  expectText,
  generateData,
  parseMarkdown,
} from './helpers';

describe(MarkdownRenderer.name, () => {
  it('renders correctly', () => {
    // Given
    const data = {
      meta: {
        duration: 37182,
        startTime: 1769454233389,
        endTime: 1769454270571,
        state: 'passed',
      },
      projectLabel: 'Project',
      projects: [],
      summary: {
        testModules: {
          passed: 12,
          failed: 1,
          skipped: 3,
          total: 16,
        },
        tests: {
          passed: 184,
          failed: 2,
          skipped: 10,
          total: 196,
        },
      },
      title: 'Vitest Test Report',
    } satisfies TestRunData;

    // When
    const result = new MarkdownRenderer().render(data);

    // Then
    expect(result).toMatchSnapshot();
  });

  it('renders title', () => {
    // Given
    const data = {
      ...generateData(),
      title: 'Custom Report Title',
    };

    // When
    const result = new MarkdownRenderer().render(data);

    // Then
    const markdownTree = parseMarkdown(result);
    const heading = expectHeading(markdownTree.children[0]);
    expect(heading.depth).toBe(1);
    const text = expectText(heading.children[0]);
    expect(text.value).toBe('Custom Report Title');
  });

  it('renders test run summary header', () => {
    // Given
    const data = generateData();

    // When
    const result = new MarkdownRenderer().render(data);

    // Then
    const markdownTree = parseMarkdown(result);
    const heading = expectHeading(markdownTree.children[1]);
    expect(heading.depth).toBe(2);
    const text = expectText(heading.children[0]);
    expect(text.value).toBe('Test Run Summary');
  });

  it('renders test run metadata table ', () => {
    // Given
    const data = {
      ...generateData(),
      meta: {
        duration: 37182,
        startTime: 1769454233389,
        endTime: 1769454270571,
        state: 'passed',
      },
    } satisfies TestRunData;

    // When
    const result = new MarkdownRenderer().render(data);

    // Then
    const markdownTree = parseMarkdown(result);

    const table = expectTable(markdownTree.children[2]);
    const tableHeader = expectTableRow(table.children[0]);
    const tableHeaderCells = tableHeader.children
      .map(expectTableCell)
      .map((cell) => expectText(cell.children[0]).value);
    expect(tableHeaderCells).toEqual([
      'ℹ️ Status',
      '🕒 Start Time',
      '🕓 End Time',
      '⌛ Duration',
    ]);

    const tableRow = expectTableRow(table.children[1]);
    const tableRowCells = tableRow.children
      .map(expectTableCell)
      .map((cell) => expectText(cell.children[0]).value);
    expect(tableRowCells).toEqual([
      '✅ passed',
      '26/01/2026 at 20:03:53',
      '26/01/2026 at 20:04:30',
      '37.18s',
    ]);
  });

  it('renders test run summary table', () => {
    // Given
    const data = {
      ...generateData(),
      summary: {
        testModules: {
          passed: 3,
          failed: 1,
          skipped: 2,
          total: 6,
        },
        tests: {
          passed: 12,
          failed: 2,
          skipped: 1,
          total: 15,
        },
      },
    };

    // When
    const result = new MarkdownRenderer().render(data);

    // Then
    const markdownTree = parseMarkdown(result);

    const table = expectTable(markdownTree.children[3]);
    const tableHeader = expectTableRow(table.children[0]);
    const tableHeaderCells = tableHeader.children
      .map(expectTableCell)
      .map((cell) =>
        cell.children.length > 0 ? expectText(cell.children[0]).value : '',
      );
    expect(tableHeaderCells).toEqual([
      '',
      '✅ Passed',
      '❌ Failed',
      '⏭️ Skipped',
      '#️⃣ Total',
    ]);

    const testFilesTableRow = expectTableRow(table.children[1]);
    const testFilesTableRowCells = testFilesTableRow.children
      .map(expectTableCell)
      .map((cell) => expectText(cell.children[0]).value);
    expect(testFilesTableRowCells).toEqual(['Test Files', '3', '1', '2', '6']);
    const testsTableRow = expectTableRow(table.children[2]);
    const testsTableRowCells = testsTableRow.children
      .map(expectTableCell)
      .map((cell) => expectText(cell.children[0]).value);
    expect(testsTableRowCells).toEqual(['Tests', '12', '2', '1', '15']);
  });
});
