/**
 * Represents the full data structure of a Vitest test run, prepared for rendering
 * by the MarkdownReporter.
 *
 * This type aggregates all information about the test run, including:
 * - Global metadata about the run (`meta`)
 * - The label used for projects in the report (`projectLabel`)
 * - All projects and their corresponding test modules (`projects`)
 * - High-level summary statistics of test files and individual tests (`summary`)
 * - The report title (`title`)
 */
export type TestRunData = {
  /** Metadata about the test run, such as start time, end time, duration, and state. */
  meta: TestRunMetaData;
  /** Label used to represent projects in the report. */
  projectLabel: string;
  /** Array of projects included in this test run, with all nested test modules and summaries. */
  projects: Project[];
  /** Summary of the test run, including counts of passed, failed, skipped, and total tests and test files. */
  summary: TestRunSummary;
  /** Title of the report, typically shown at the top of the markdown output. */
  title: string;
};

/**
 * Represents a project within a Vitest test run.
 *
 * A `Project` aggregates all test modules belonging to a single project,
 * along with summary statistics and metadata about the project as a whole.
 */
export type Project = {
  /** Aggregated metadata about the project, such as total duration of all test modules. */
  meta: BasicMetaData;
  /** Name of the project. */
  name: string;
  /** Summary of tests for the project, including counts of passed, failed, skipped, and total tests. */
  summary: BasicTestsSummary;
  /** Array of all test modules associated with this project. */
  testModules: TestModuleData[];
};

/**
 * Represents a minimal project structure containing only the project name
 * and its test modules.
 *
 * This type is used internally before computing aggregated metadata (`meta`)
 * and summary statistics (`summary`). It allows grouping test modules by project
 * without carrying computed data.
 */
export type BasicProject = Omit<Project, 'meta' | 'summary'>;

/**
 * Represents basic metadata for a test module or project.
 *
 * Currently, it includes only the total duration of the module or project
 * in milliseconds. This type is used as a building block for aggregated
 * metadata in `Project` or `TestModuleData`.
 */
export type BasicMetaData = {
  /** Total duration in milliseconds. */
  duration: number;
};

/**
 * Metadata for a test or test module, including execution duration and state.
 *
 * Extends `BasicMetaData` by adding the `state` of the test/module,
 * allowing reporters and renderers to track both how long it took and
 * the result of execution (`passed`, `failed`, or `skipped`).
 */
export type TestMetaData = BasicMetaData & {
  /** The execution state of the test or module. */
  state: State;
};

/**
 * Metadata for an entire test run, including duration, state, and timestamps.
 *
 * Extends `TestMetaData` to include the start and end times of the run,
 * allowing the reporter to calculate total duration and record when the
 * run started and finished.
 */
export type TestRunMetaData = TestMetaData & {
  /** Unix timestamp (milliseconds) when the test run started. */
  endTime: number;
  /** Unix timestamp (milliseconds) when the test run ended. */
  startTime: number;
};

/**
 * Summary of test results for a module or project.
 *
 * Contains counts of tests grouped by their execution state, including
 * passed, failed, skipped, and total tests. This type is used in both
 * `Project` and `TestModuleData` to provide a quick overview of test outcomes.
 */
export type BasicTestsSummary = {
  /** Counts of tests per execution state. */
  tests: TestStateCounts;
};

/**
 * Aggregated summary of a full test run.
 *
 * Extends `BasicTestsSummary` by also including counts of test modules
 * grouped by their execution state. This allows the reporter to display
 * both a high-level overview of all test modules and detailed test results.
 */
export type TestRunSummary = BasicTestsSummary & {
  /** Counts of test modules per execution state (passed, failed, skipped, total). */
  testModules: TestStateCounts;
};

/**
 * Represents a single test module within a project.
 *
 * Contains metadata, summary statistics, and all nested tests and suites
 * belonging to this module. This type is used by the reporter to aggregate
 * and render test results for each module in the Markdown report.
 */
export type TestModuleData = {
  /** Metadata about the module, including duration and state. */
  meta: TestMetaData;
  /** Name or identifier of the test module. */
  name: string;
  /** Name of the project this module belongs to. */
  projectName: string;
  /** Summary of test results within this module. */
  summary: BasicTestsSummary;
  /** Nested test suites inside this module. */
  suites: SuiteData[];
  /** Individual tests directly inside this module (not in nested suites). */
  tests: TestData[];
};

/**
 * Represents a test suite, potentially containing nested suites and tests.
 *
 * Suites can be nested recursively, allowing hierarchical organization
 * of tests within a module. Each suite contains a name, child suites,
 * and direct tests.
 */
export type SuiteData = {
  /** Name of the test suite. */
  name: string;
  /** Nested child suites within this suite. */
  suites: SuiteData[];
  /** Individual tests directly inside this suite. */
  tests: TestData[];
};

/**
 * Represents a single test case within a test module or suite.
 *
 * Contains the test's metadata, including duration and state, along with
 * its name. This type is used by the reporter to render individual test
 * results in the Markdown report.
 */
export type TestData = {
  /** Metadata about the test, including duration and execution state. */
  meta: TestMetaData;
  /** Name or description of the test case. */
  name: string;
};

/**
 * Represents the counts of tests or test modules by their execution state.
 *
 * Used throughout the reporter to summarize test results at various levels,
 * including individual test modules, projects, and the overall test run.
 */
export type TestStateCounts = {
  /** Number of tests or modules that passed. */
  passed: number;
  /** Number of tests or modules that failed. */
  failed: number;
  /** Number of tests or modules that were skipped. */
  skipped: number;
  /** Total number of tests or modules (passed + failed + skipped). */
  total: number;
};

/**
 * Represents the execution state of a test, test module, or test run.
 *
 * Can be one of the following:
 * - `'passed'` — The test completed successfully.
 * - `'failed'` — The test did not pass.
 * - `'skipped'` — The test was skipped and not executed.
 *
 * This type is used throughout the reporter to categorize test results
 * and generate summaries.
 */
export type State = 'passed' | 'failed' | 'skipped';
