import { describe, expect, it } from 'vitest';

import {
  MarkdownRenderer,
  STATE_ICON,
} from '../../src/renderer/MarkdownRenderer';
import type { State, TestRunData } from '../../src/types';
import {
  expectEmphasis,
  expectHeading,
  expectList,
  expectListItem,
  expectParagraph,
  expectTable,
  expectTableRow,
  expectText,
  generateData,
  generateMeta,
  generateProject,
  generateSuite,
  generateTestData,
  generateTestModule,
  generateTestModuleMeta,
  parseMarkdown,
  tableRowText,
} from './helpers';
import { formatDateTime, formatDuration } from '../../src/renderer/utils';

const ReportStaticNodePosition = {
  TITLE_HEADER: 0,
  TEST_RUN_SUMMARY_HEADER: 1,
  TEST_RUN_METADATA_TABLE: 2,
  TEST_RUN_SUMMARY_TABLE: 3,
  TEST_RESULTS_HEADER: 4,
} as const;

describe(MarkdownRenderer.name, () => {
  it('renders correctly', () => {
    // Given
    const data = {
      meta: {
        duration: 300,
        startTime: 1769454233389,
        endTime: 1769454233689,
        state: 'passed',
      },
      projectLabel: 'Project',
      projects: [
        {
          meta: {
            duration: 300,
          },
          name: 'Renderer',
          summary: {
            tests: {
              passed: 1,
              failed: 1,
              skipped: 0,
              total: 2,
            },
          },
          testModules: [
            {
              meta: {
                duration: 300,
                state: 'passed',
              },
              name: 'test/renderer/MarkdownRenderer.test.ts',
              projectName: 'Renderer',
              summary: {
                tests: {
                  passed: 1,
                  failed: 1,
                  skipped: 0,
                  total: 2,
                },
              },
              suites: [
                {
                  name: 'rendering test run summary',
                  suites: [],
                  tests: [
                    {
                      meta: {
                        duration: 200,
                        state: 'failed',
                      },
                      name: 'renders test run summary heading',
                    },
                  ],
                },
              ],
              tests: [
                {
                  meta: {
                    duration: 100,
                    state: 'passed',
                  },
                  name: 'renders title heading',
                },
              ],
            },
          ],
        },
      ],
      summary: {
        testModules: {
          passed: 0,
          failed: 1,
          skipped: 0,
          total: 1,
        },
        tests: {
          passed: 1,
          failed: 1,
          skipped: 0,
          total: 2,
        },
      },
      title: 'Vitest Test Report',
    } satisfies TestRunData;

    // When
    const result = new MarkdownRenderer().render(data);

    // Then
    expect(result).toMatchSnapshot();
  });

  it('renders title heading', () => {
    // Given
    const data = {
      ...generateData(),
      title: 'Custom Report Title',
    };

    // When
    const result = new MarkdownRenderer().render(data);
    const markdownTree = parseMarkdown(result);

    // Then
    const heading = expectHeading(
      markdownTree.children[ReportStaticNodePosition.TITLE_HEADER],
    );
    expect(heading.depth).toBe(1);
    const text = expectText(heading.children[0]);
    expect(text.value).toBe('Custom Report Title');
  });

  describe('rendering test run summary', () => {
    it('renders test run summary heading', () => {
      // Given
      const data = generateData();

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const heading = expectHeading(
        markdownTree.children[ReportStaticNodePosition.TEST_RUN_SUMMARY_HEADER],
      );
      expect(heading.depth).toBe(2);
      const text = expectText(heading.children[0]);
      expect(text.value).toBe('Test Run Summary');
    });

    it('renders test run metadata table with status, times and duration', () => {
      // Given
      const data = {
        ...generateData(),
        ...generateMeta({
          state: 'passed',
        }),
      } satisfies TestRunData;

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const testRunMetaDataTable = expectTable(
        markdownTree.children[ReportStaticNodePosition.TEST_RUN_METADATA_TABLE],
      );
      const tableHeader = expectTableRow(testRunMetaDataTable.children[0]);
      expect(tableRowText(tableHeader)).toEqual([
        'ℹ️ Status',
        '🕒 Start Time',
        '🕓 End Time',
        '⌛ Duration',
      ]);

      const tableRow = expectTableRow(testRunMetaDataTable.children[1]);
      expect(tableRowText(tableRow)).toEqual([
        '✅ passed',
        formatDateTime(data.meta.startTime),
        formatDateTime(data.meta.endTime),
        formatDuration(data.meta.duration),
      ]);
    });

    it('renders test run summary table with number of test modules and tests', () => {
      // Given
      const data = generateData();

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const testRunSummaryTable = expectTable(
        markdownTree.children[ReportStaticNodePosition.TEST_RUN_SUMMARY_TABLE],
      );
      // header + "Test Files" + "Tests"
      expect(testRunSummaryTable.children).toHaveLength(3);

      const tableHeader = expectTableRow(testRunSummaryTable.children[0]);
      expect(tableRowText(tableHeader)).toEqual([
        '',
        '✅ Passed',
        '❌ Failed',
        '⏭️ Skipped',
        '#️⃣ Total',
      ]);

      const testFilesRow = expectTableRow(testRunSummaryTable.children[1]);
      expect(tableRowText(testFilesRow)).toEqual([
        'Test Files',
        `${data.summary.testModules.passed}`,
        `${data.summary.testModules.failed}`,
        `${data.summary.testModules.skipped}`,
        `${data.summary.testModules.total}`,
      ]);

      const testsRow = expectTableRow(testRunSummaryTable.children[2]);
      expect(tableRowText(testsRow)).toEqual([
        'Tests',
        `${data.summary.tests.passed}`,
        `${data.summary.tests.failed}`,
        `${data.summary.tests.skipped}`,
        `${data.summary.tests.total}`,
      ]);
    });

    it('renders test results heading', () => {
      // Given
      const data = generateData();

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const testResultsHeading = expectHeading(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER],
      );
      expect(testResultsHeading.depth).toBe(2);
      const text = expectText(testResultsHeading.children[0]);
      expect(text.value).toBe('Test Results');
    });
  });

  describe('rendering project', () => {
    it('renders project heading with custom label', () => {
      // Given
      const data = {
        ...generateData(),
        projectLabel: 'Test Level',
        projects: [
          generateProject({
            name: 'Unit',
          }),
        ],
      };

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const projectHeading = expectHeading(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER + 1],
      );
      expect(projectHeading.depth).toBe(3);
      const text = expectText(projectHeading.children[0]);
      expect(text.value).toBe('Test Level: Unit');
    });

    it('renders project summary table with number of tests and duration', () => {
      // Given
      const project = generateProject();
      const data = {
        ...generateData(),
        projects: [project],
      };

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const projectSummaryTable = expectTable(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER + 2],
      );
      // header + data
      expect(projectSummaryTable.children).toHaveLength(2);

      const tableHeader = expectTableRow(projectSummaryTable.children[0]);
      expect(tableRowText(tableHeader)).toEqual([
        '✅ Passed',
        '❌ Failed',
        '⏭️ Skipped',
        '#️⃣ Total',
        '⌛ Duration',
      ]);

      const dataRow = expectTableRow(projectSummaryTable.children[1]);
      expect(tableRowText(dataRow)).toEqual([
        `${project.summary.tests.passed}`,
        `${project.summary.tests.failed}`,
        `${project.summary.tests.skipped}`,
        `${project.summary.tests.total}`,
        formatDuration(project.meta.duration),
      ]);
    });
  });

  describe('rendering test module', () => {
    it.each(['passed', 'failed', 'skipped'] as State[])(
      'renders test module heading with state when %s',
      (state) => {
        // Given
        const testModule = generateTestModule({
          ...generateTestModuleMeta({
            state,
          }),
        });
        const data = {
          ...generateData(),
          projects: [
            generateProject({
              testModules: [testModule],
            }),
          ],
        };

        // When
        const result = new MarkdownRenderer().render(data);
        const markdownTree = parseMarkdown(result);

        // Then
        const testModuleHeading = expectHeading(
          markdownTree.children[
            ReportStaticNodePosition.TEST_RESULTS_HEADER + 3
          ],
        );
        expect(testModuleHeading.depth).toBe(4);
        const testModuleText = expectText(testModuleHeading.children[0]);
        expect(testModuleText.value).toBe(
          `${STATE_ICON[state as State]} ${testModule.name}`,
        );
      },
    );

    it('renders test module summary with number of tests and duration', () => {
      // Given
      const testModule = generateTestModule();
      const data = {
        ...generateData(),
        projects: [
          generateProject({
            testModules: [testModule],
          }),
        ],
      };

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const summaryParagraph = expectParagraph(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER + 4],
      );
      const summaryText = expectText(summaryParagraph.children[0]);
      expect(summaryText.value).toBe(
        [
          `${testModule.summary.tests.passed} passed`,
          `${testModule.summary.tests.failed} failed`,
          `${testModule.summary.tests.skipped} skipped`,
          `${testModule.summary.tests.total} total`,
          `done in ${formatDuration(testModule.meta.duration)}`,
        ].join(', '),
      );
    });

    it('renders test module tests with status and duration', () => {
      // Given
      const tests = [generateTestData(), generateTestData()];
      const data = {
        ...generateData(),
        projects: [
          generateProject({
            testModules: [
              generateTestModule({
                suites: [],
                tests: tests,
              }),
            ],
          }),
        ],
      };

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const testModuleList = expectList(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER + 5],
      );

      testModuleList.children.forEach((testListItem, index) => {
        const testParagraph = expectParagraph(testListItem.children[0]);
        const testText = expectText(testParagraph.children[0]);
        expect(testText.value).toBe(
          `${STATE_ICON[tests[index].meta.state]} ${tests[index].name}  `,
        );
        const testDurationEmphasis = expectEmphasis(testParagraph.children[1]);
        const testDurationText = expectText(testDurationEmphasis.children[0]);
        expect(testDurationText.value).toBe(
          formatDuration(tests[index].meta.duration),
        );
      });
    });

    it('renders test module suites', () => {
      // Given
      const suites = [
        generateSuite({ tests: [] }),
        generateSuite({ tests: [] }),
      ];
      const data = {
        ...generateData(),
        projects: [
          generateProject({
            testModules: [
              generateTestModule({
                suites: suites,
                tests: [],
              }),
            ],
          }),
        ],
      };

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const testModuleList = expectList(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER + 5],
      );

      testModuleList.children.forEach((suiteListItem, index) => {
        const suiteParagraph = expectParagraph(suiteListItem.children[0]);
        const suiteText = expectText(suiteParagraph.children[0]);
        expect(suiteText.value).toBe(`🗂️ ${suites[index].name}`);
      });
    });

    it('renders test module nested tests', () => {
      // Given
      const test = generateTestData();
      const suite = generateSuite({
        tests: [test],
      });
      const data = {
        ...generateData(),
        projects: [
          generateProject({
            testModules: [
              generateTestModule({
                suites: [suite],
                tests: [],
              }),
            ],
          }),
        ],
      };

      // When
      const result = new MarkdownRenderer().render(data);
      const markdownTree = parseMarkdown(result);

      // Then
      const testModuleList = expectList(
        markdownTree.children[ReportStaticNodePosition.TEST_RESULTS_HEADER + 5],
      );
      const suiteListItem = expectListItem(testModuleList.children[0]);
      const suiteParagraph = expectParagraph(suiteListItem.children[0]);
      const suiteText = expectText(suiteParagraph.children[0]);
      expect(suiteText.value).toBe(`🗂️ ${suite.name}`);

      const testListItem = expectListItem(testModuleList.children[1]);
      const testParagraph = expectParagraph(testListItem.children[0]);
      const testText = expectText(testParagraph.children[0]);
      expect(testText.value).toBe(
        `${STATE_ICON[test.meta.state]} ${test.name}  `,
      );
      const testDurationEmphasis = expectEmphasis(testParagraph.children[1]);
      const testDurationText = expectText(testDurationEmphasis.children[0]);
      expect(testDurationText.value).toBe(formatDuration(test.meta.duration));
    });
  });
});
