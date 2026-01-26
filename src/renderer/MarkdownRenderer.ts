import { MarkdownDocument, md } from 'build-md';
import type { FormattedText } from 'build-md';

import type {
  TestRunMetaData,
  Project,
  TestRunData,
  State,
  SuiteData,
  TestRunSummary,
  TestData,
  TestModuleData,
} from '../types';
import { formatDateTime, formatDuration } from './utils';

const STATE_ICON: Record<State, '✅' | '❌' | '⏭️'> = {
  passed: '✅',
  failed: '❌',
  skipped: '⏭️',
};

/**
 * Responsible for rendering Vitest test run results into a Markdown document.
 *
 * `MarkdownRenderer` acts as the main orchestration layer of the reporter.
 * It converts structured Vitest reporter data into a human-readable Markdown
 * format by composing smaller rendering methods (e.g. title, summary,
 * and detailed test results).
 *
 * The output produced by this renderer is intended to be:
 * - Deterministic (same input produces the same output)
 * - Readable in both GitHub and local Markdown viewers
 * - Suitable for persistence (e.g. saving to a `.md` file)
 *
 * This class does not perform any I/O operations. It strictly focuses on
 * transforming data into Markdown.
 */
export class MarkdownRenderer {
  /**
   * Renders the complete Vitest test run report as a Markdown document.
   *
   * This is the main entry point of the renderer. It takes the aggregated
   * results of a Vitest run and converts them into a structured, human-readable
   * Markdown report, including:
   *
   * - The report title
   * - A high-level test run summary
   * - Detailed test results
   *
   * The returned string is ready to be written to a file or further processed.
   *
   * @public
   * @param data - Aggregated data representing the Vitest test run results.
   * @returns      A Markdown-formatted report representing the full test run.
   */
  render(data: TestRunData): string {
    return new MarkdownDocument()
      .$concat(
        this.renderReportTitle(data.title),
        this.renderTestRunSummarySection(data),
        this.renderTestResultsSection(data),
      )
      .toString();
  }

  /**
   * Renders the top-level report title as a Markdown heading.
   *
   * Creates a new Markdown document containing a single level-1 heading
   * representing the title of the test report.
   *
   * This method is used as the first step in composing the full Markdown report.
   *
   * @internal
   * @param title - The title of the test report.
   * @returns       A Markdown document containing the rendered report title.
   */
  private renderReportTitle(title: string): MarkdownDocument {
    return new MarkdownDocument().heading(1, title);
  }

  /**
   * Renders the high-level summary section of the test run.
   *
   * Generates a dedicated "Test Run Summary" section that provides
   * a concise overview of the executed Vitest run. The section includes:
   *
   * - General metadata about the test run (e.g. status, timing)
   * - An aggregated summary of test results (e.g. passed, failed, skipped)
   *
   * This method is used as part of the full report composition and does not
   * perform any data transformation beyond formatting.
   *
   * @internal
   * @param data - Aggregated data representing the Vitest test run results.
   * @returns      A Markdown document containing the rendered test run summary section.
   */
  private renderTestRunSummarySection(data: TestRunData): MarkdownDocument {
    return new MarkdownDocument()
      .heading(2, 'Test Run Summary')
      .$concat(
        this.renderTestRunMetadataTable(data.meta),
        this.renderTestRunSummaryTable(data.summary),
      );
  }

  /**
   * Renders a metadata table describing the test run execution.
   *
   * Produces a compact Markdown table containing key contextual information
   * about the Vitest run, such as execution state, timing, and total duration.
   * The table is intended to give readers a quick, at-a-glance understanding
   * of when and how the test run was executed.
   *
   * Visual indicators (icons) are used to improve readability where applicable.
   *
   * @internal
   * @param meta - Metadata describing the test run execution.
   * @returns      A Markdown document containing the rendered test run metadata table.
   */
  private renderTestRunMetadataTable(meta: TestRunMetaData): MarkdownDocument {
    return new MarkdownDocument().table(
      [
        { heading: 'ℹ️ Status' },
        { heading: '🕒 Start Time' },
        { heading: '🕓 End Time' },
        { heading: '⌛ Duration', alignment: 'right' },
      ],
      [
        [
          `${STATE_ICON[meta.state]} ${meta.state}`,
          `${formatDateTime(meta.startTime)}`,
          `${formatDateTime(meta.endTime)}`,
          `${formatDuration(meta.duration)}`,
        ],
      ],
    );
  }

  /**
   * Renders a summary table of test results for the test run.
   *
   * Produces a Markdown table showing aggregated counts of test files and
   * individual tests, broken down by status.
   *
   * The table provides a quick, at-a-glance overview of the test run outcome
   * and is included as part of the high-level summary section.
   *
   * @internal
   * @param summary - Aggregated test run summary data including counts of test files and individual tests.
   * @returns         A Markdown document containing the rendered test run results summary table.
   */
  private renderTestRunSummaryTable(summary: TestRunSummary): MarkdownDocument {
    return new MarkdownDocument().table(
      [
        '',
        { heading: '✅ Passed', alignment: 'right' },
        { heading: '❌ Failed', alignment: 'right' },
        { heading: '⏭️ Skipped', alignment: 'right' },
        { heading: '#️⃣ Total', alignment: 'right' },
      ],
      [
        [
          'Test Files',
          `${summary.testModules.passed}`,
          `${summary.testModules.failed}`,
          `${summary.testModules.skipped}`,
          `${summary.testModules.total}`,
        ],
        [
          'Tests',
          `${summary.tests.passed}`,
          `${summary.tests.failed}`,
          `${summary.tests.skipped}`,
          `${summary.tests.total}`,
        ],
      ],
    );
  }

  /**
   * Renders the detailed "Test Results" section of the report.
   *
   * Generates a Markdown section that lists all projects included in the
   * Vitest run and their corresponding test results. Each project is
   * rendered individually using `renderProject`, allowing for a clear
   * hierarchical structure in the report.
   *
   * The resulting section provides:
   * - A heading for "Test Results"
   * - Detailed results grouped by project
   *
   * @internal
   * @param data - Aggregated data representing the Vitest test run results.
   * @returns      A Markdown document containing the rendered detailed test results section.
   */
  private renderTestResultsSection(data: TestRunData): MarkdownDocument {
    return new MarkdownDocument()
      .heading(2, 'Test Results')
      .$foreach(data.projects, (markdownDocument, project) =>
        markdownDocument.$concat(
          this.renderProject(project, data.projectLabel),
        ),
      );
  }

  /**
   * Renders a single project's section within the "Test Results" report.
   *
   * Generates a Markdown subsection for a specific project, including:
   * - A heading with the project label and name
   * - A summary table of the project's test results
   * - Detailed results for each test module within the project
   *
   * This method is used internally by `renderTestResultsSection` to create
   * a structured, readable breakdown of all projects in the test run.
   *
   * @internal
   * @param project      - The project data containing test modules and summary information.
   * @param projectLabel - A label to display alongside the project name (e.g., "Project" or "Workspace").
   * @returns              A Markdown document containing the rendered project section.
   */
  private renderProject(
    project: Project,
    projectLabel: string,
  ): MarkdownDocument {
    return new MarkdownDocument()
      .heading(3, `${projectLabel}: ${project.name}`)
      .$concat(
        this.renderProjectSummaryTable(project),
        new MarkdownDocument().$foreach(
          project.testModules,
          (markdownDocument, testModule) =>
            markdownDocument.$concat(this.renderTestModule(testModule)),
        ),
      );
  }

  /**
   * Renders a summary table for a single project.
   *
   * Produces a compact Markdown table containing aggregated test result counts
   * and execution duration for the given project. The table includes:
   * - Number of passed, failed, skipped, and total tests
   * - Total execution duration of the project
   *
   * This summary is displayed at the beginning of each project section
   * to provide a quick overview before listing detailed test results.
   *
   * @internal
   * @param project - The project data containing aggregated summary and metadata.
   * @returns         A Markdown document containing the rendered project summary table.
   */
  private renderProjectSummaryTable(project: Project): MarkdownDocument {
    return new MarkdownDocument().table(
      [
        { heading: '✅ Passed', alignment: 'right' },
        { heading: '❌ Failed', alignment: 'right' },
        { heading: '⏭️ Skipped', alignment: 'right' },
        { heading: '#️⃣ Total', alignment: 'right' },
        { heading: '⌛ Duration', alignment: 'right' },
      ],
      [
        [
          `${project.summary.tests.passed}`,
          `${project.summary.tests.failed}`,
          `${project.summary.tests.skipped}`,
          `${project.summary.tests.total}`,
          `${formatDuration(project.meta.duration)}`,
        ],
      ],
    );
  }

  /**
   * Renders a single test module section within a project.
   *
   * Generates a Markdown subsection representing one test module, including:
   * - A heading indicating the module name and its overall execution state
   * - A short textual summary of test results (passed, failed, skipped, total)
   * - A list of contained test cases and test suites
   *
   * Test cases and suites are rendered using their respective renderer methods
   * to maintain a consistent and hierarchical report structure.
   *
   * @internal
   * @param testModule - Data describing the test module, including metadata, result summary, and contained tests and suites.
   * @returns            A Markdown document containing the rendered test module section.
   */
  private renderTestModule(testModule: TestModuleData): MarkdownDocument {
    return new MarkdownDocument()
      .heading(4, `${STATE_ICON[testModule.meta.state]} ${testModule.name}`)
      .paragraph(
        [
          `${testModule.summary.tests.passed} passed`,
          `${testModule.summary.tests.failed} failed`,
          `${testModule.summary.tests.skipped} skipped`,
          `${testModule.summary.tests.total} total`,
          `done in ${formatDuration(testModule.meta.duration)}`,
        ].join(', '),
      )
      .list([
        ...testModule.tests.map(this.renderTest),
        ...testModule.suites.map(this.renderTestSuite),
      ]);
  }

  /**
   * Renders a test suite and its nested contents as formatted Markdown text.
   *
   * Generates a formatted representation of a test suite, including:
   * - The suite name
   * - A nested list of contained test cases
   * - Recursively rendered child suites
   *
   * This method is recursive and is responsible for preserving the
   * hierarchical structure of test suites within the Markdown report.
   *
   * @internal
   * @param suite - The test suite containing tests and nested suites.
   * @returns       Formatted Markdown text representing the rendered test suite.
   */
  private renderTestSuite(suite: SuiteData): FormattedText {
    return md`🗂️ ${suite.name} ${md.list([
      ...suite.tests.map(this.renderTest),
      ...suite.suites.map(this.renderTestSuite),
    ])}`;
  }

  /**
   * Renders an individual test case as formatted Markdown text.
   *
   * Produces a concise, inline representation of a single test case, including:
   * - A visual indicator of the test result state
   * - The test name
   * - The test execution duration
   *
   * This method represents the lowest level in the test result hierarchy
   * and is used by suite and module renderers.
   *
   * @internal
   * @param test - The test case data including execution state, name, and duration.
   * @returns      Formatted Markdown text representing the rendered test case.
   */
  private renderTest(test: TestData): FormattedText {
    return md`${STATE_ICON[test.meta.state]} ${test.name}  ${md.italic(
      formatDuration(test.meta.duration),
    )}`;
  }
}
