import type {
  Reporter,
  SerializedError,
  TestCase,
  TestModule,
  TestModuleState,
  TestRunEndReason,
  TestSuite,
  Vitest,
} from 'vitest/node';

import { MarkdownRenderer } from '../renderer/MarkdownRenderer';
import type {
  BasicProject,
  Project,
  State,
  SuiteData,
  TestData,
  TestModuleData,
  TestRunData,
  TestStateCounts,
} from '../types';
import type {
  MarkdownReporterOptions,
  ProjectsOrder,
} from './MarkdownReporter.types';
import { roundDurationToMs, saveFileToDisk } from './utils';

/**
 * Vitest reporter that generates a Markdown test report.
 *
 * `MarkdownReporter` is responsible for:
 * - Integrating with the Vitest reporter lifecycle
 * - Collecting and normalizing test run data
 * - Aggregating results across projects, modules, suites, and tests
 * - Delegating Markdown generation to `MarkdownRenderer`
 * - Persisting the generated report to disk
 *
 * This class focuses strictly on **data preparation and orchestration**.
 * All formatting and Markdown layout concerns are handled by `MarkdownRenderer`.
 */
export class MarkdownReporter implements Reporter {
  private ctx!: Vitest;
  private outputFile = 'vitest-report.md';
  private projectLabel = 'Project';
  private projectsOrder?: ProjectsOrder;
  private renderer: MarkdownRenderer;
  private startTime = Date.now();
  private title = 'Vitest Test Report';

  /**
   * Creates a new Markdown reporter instance.
   *
   * @param options - Optional reporter configuration controlling output location, project labeling, report title, and project ordering.
   */
  constructor(options?: MarkdownReporterOptions) {
    this.renderer = new MarkdownRenderer();

    this.outputFile = options?.outputFile ?? this.outputFile;
    this.projectLabel = options?.projectLabel ?? this.projectLabel;
    this.title = options?.title ?? this.title;

    if (options?.projectsOrder) {
      this.projectsOrder = new Map(
        options.projectsOrder.map((projectName, index) => [projectName, index]),
      );
    }
  }

  /**
   * Called by Vitest when the test run is initialized.
   *
   * Stores the Vitest context and captures the test run start time,
   * which is later used to calculate the total execution duration.
   *
   * @param vitest - The active Vitest instance.
   */
  onInit(vitest: Vitest) {
    this.ctx = vitest;
    this.startTime = Date.now();
  }

  /**
   * Called by Vitest when the test run has finished.
   *
   * Aggregates test results, groups them by project, computes summary statistics,
   * and prepares the complete data structure required by the Markdown renderer.
   * Once rendering is complete, the generated report is written to disk.
   *
   * @param testModules     - All test modules executed during the test run.
   * @param unhandledErrors - Errors that were not associated with a specific test.
   * @param reason          - The final state of the test run.
   */
  async onTestRunEnd(
    testModules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    reason: TestRunEndReason,
  ): Promise<void> {
    const data = this.buildTestRunData(testModules, reason, Date.now());
    const markdownDocument = this.renderer.render(data);
    const outputPath = saveFileToDisk(markdownDocument, this.outputFile);
    this.log(`Markdown report written to ${outputPath}`);
  }

  /**
   * Builds the complete reporter data structure for the Markdown renderer.
   *
   * Aggregates raw Vitest test module data into a normalized, renderer-friendly
   * format. This includes:
   * - Global test run metadata (timing and final state)
   * - Grouped and ordered project data with per-project summaries
   * - High-level summary statistics for test files and individual tests
   * - Report configuration such as title and project labeling
   *
   * This method acts as the primary transformation boundary between the Vitest
   * reporter API and the Markdown rendering layer.
   *
   * @internal
   * @param testModules - All test modules executed during the test run.
   * @param reason      - The final reason/state of the test run.
   * @param endTime     - Timestamp marking the end of the test run.
   * @returns             A fully populated `TestRunData` object ready for rendering.
   */
  private buildTestRunData(
    testModules: ReadonlyArray<TestModule>,
    reason: TestRunEndReason,
    endTime: number,
  ): TestRunData {
    return {
      meta: {
        duration: roundDurationToMs(endTime - this.startTime),
        endTime: endTime,
        startTime: this.startTime,
        state: this.convertState(reason),
      },
      projectLabel: this.projectLabel,
      projects: testModules
        .map((testModule) => this.mapTestModule(testModule))
        .reduce(this.groupByProject, [])
        .sort(this.sortByProject)
        .map(this.enhanceProject),
      summary: {
        testModules: {
          passed: this.filterTestModulesByState(testModules, 'passed').length,
          failed: this.filterTestModulesByState(testModules, 'failed').length,
          skipped: this.filterTestModulesByState(testModules, 'skipped').length,
          total: testModules.length,
        },
        tests: {
          passed: this.filterTestsByState(testModules, 'passed').length,
          failed: this.filterTestsByState(testModules, 'failed').length,
          skipped: this.filterTestsByState(testModules, 'skipped').length,
          total: testModules.flatMap((testModule) =>
            Array.from(testModule.children.allTests()),
          ).length,
        },
      },
      title: this.title,
    };
  }

  /**
   * Filters test modules by their execution state.
   *
   * @internal
   * @param testModules - All executed test modules.
   * @param state       - The desired test module state.
   * @returns             Test modules matching the given state.
   */
  private filterTestModulesByState(
    testModules: ReadonlyArray<TestModule>,
    state: TestModuleState,
  ) {
    return testModules.filter((testModule) => testModule.state() === state);
  }

  /**
   * Collects all test cases across test modules that match a given state.
   *
   * Iterates over the provided test modules and extracts test cases whose
   * execution result matches the specified state (e.g. passed, failed,
   * or skipped). The returned list is used for computing aggregated
   * test result statistics.
   *
   * @internal
   * @param testModules - All executed test modules.
   * @param state       - The desired test result state to filter by.
   * @returns             A flat array of test cases matching the given state.
   */
  private filterTestsByState(
    testModules: ReadonlyArray<TestModule>,
    state: State,
  ): TestCase[] {
    return testModules.flatMap((testModule) =>
      Array.from(testModule.children.allTests(state)),
    );
  }

  /**
   * Computes the total number of tests in a set of test modules for a given state.
   *
   * Iterates over the provided test modules and sums the counts of tests that
   * match the specified state (`passed`, `failed`, `skipped`, or `total`).
   * This is used to generate aggregated summaries at the project or module level.
   *
   * @internal
   * @param testModules - Array of test modules to sum counts from.
   * @param state       - The test state to sum counts for ('passed', 'failed', 'skipped', or 'total').
   * @returns             The total number of tests in the provided modules matching the given state.
   */
  private sumTestsCountByState(
    testModules: TestModuleData[],
    state: keyof TestStateCounts,
  ): number {
    return testModules.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.summary.tests[state],
      0,
    );
  }

  /**
   * Maps Vitest test cases to the internal `TestData` format used by the reporter.
   *
   * Converts each `TestCase` from Vitest into a normalized object containing:
   * - `name`: The test case name
   * - `state`: The execution state of the test (passed, failed, skipped)
   * - `duration`: The test execution duration in milliseconds, rounded for readability
   *
   * This method acts as the boundary between Vitest's native test case objects
   * and the reporter's internal data model, ensuring consistency across modules
   * and suites.
   *
   * @internal
   * @param testCases - Array of Vitest `TestCase` objects to normalize.
   * @returns           An array of normalized `TestData` objects suitable for rendering.
   */
  private mapTests(testCases: TestCase[]): TestData[] {
    return testCases.map((testCase) => ({
      meta: {
        duration: roundDurationToMs(testCase.diagnostic()?.duration),
        state: this.convertState(testCase.result().state),
      },
      name: testCase.name,
    }));
  }

  /**
   * Recursively maps Vitest test suites to the internal `SuiteData` format used by the reporter.
   *
   * For each input `TestSuite`, this method produces a normalized object containing:
   * - `name`: The suite name
   * - `suites`: Recursively mapped child suites
   * - `tests`: Mapped test cases within this suite
   *
   * This method ensures that nested suite structures from Vitest are transformed
   * into a consistent internal representation suitable for aggregation and rendering.
   *
   * @internal
   * @param testSuite - Array of Vitest `TestSuite` objects to map.
   * @returns           An array of normalized `SuiteData` objects preserving the suite hierarchy.
   */
  private mapSuites(testSuites: TestSuite[]): SuiteData[] {
    return testSuites.map((testSuite) => ({
      name: testSuite.name,
      suites: this.mapSuites(Array.from(testSuite.children.suites())),
      tests: this.mapTests(Array.from(testSuite.children.tests())),
    }));
  }

  /**
   * Converts a Vitest test module into the internal reporter representation.
   *
   * Normalizes Vitest-specific structures into a format suitable for rendering,
   * including metadata, aggregated summaries, and nested suites and tests.
   *
   * @internal
   * @param testModule - The Vitest test module to map.
   * @returns            Normalized test module data used by the renderer.
   */
  private mapTestModule(testModule: TestModule): TestModuleData {
    return {
      meta: {
        duration: roundDurationToMs(testModule.diagnostic().duration),
        state: this.convertState(testModule.state()),
      },
      name: testModule.relativeModuleId,
      projectName: testModule.project.name,
      summary: {
        tests: {
          passed: Array.from(testModule.children.allTests('passed')).length,
          failed: Array.from(testModule.children.allTests('failed')).length,
          skipped: Array.from(testModule.children.allTests('skipped')).length,
          total: Array.from(testModule.children.allTests()).length,
        },
      },
      suites: this.mapSuites(Array.from(testModule.children.suites())),
      tests: this.mapTests(Array.from(testModule.children.tests())),
    };
  }

  /**
   * Reducer function to group test modules by project for use with `Array.prototype.reduce`.
   *
   * Given an accumulator array of projects and a single test module, this method:
   * - Finds the existing project group that matches the test module's `projectName`
   * - If no group exists, creates a new project group and adds it to the accumulator
   * - Pushes the test module into the matching project's `testModules` array
   *
   * This method is intended to be used in a pipeline like:
   * ```ts
   * const groupedProjects = testModules
   *   .map(this.mapTestModule)
   *   .reduce(this.groupByProject, []);
   * ```
   *
   * @internal
   * @param projects   - The accumulator array of project groups.
   * @param testModule - The test module to assign to its corresponding project group.
   * @returns            The updated array of project groups with the test module added.
   */
  private groupByProject(
    projects: BasicProject[],
    testModule: TestModuleData,
  ): BasicProject[] {
    let projectGroup = projects.find(
      (project) => project.name === testModule.projectName,
    );

    if (!projectGroup) {
      projectGroup = {
        name: testModule.projectName,
        testModules: [],
      };
      projects.push(projectGroup);
    }

    projectGroup.testModules.push(testModule);

    return projects;
  }

  /**
   * Sorts projects based on the user-defined project order.
   *
   * This comparator function can be used with `Array.prototype.sort` to
   * order projects according to the `projectsOrder` map provided in the reporter
   * options. Projects not present in the map are assigned `Infinity` and
   * sorted to the end of the array. If no custom order is defined, the function
   * returns `0` to preserve the original order.
   *
   * @internal
   * @param a - The first project to compare.
   * @param b - The second project to compare.
   * @returns   A negative number if `a` should come before `b`, positive if `b` should come before `a`, or `0` if they are considered equal.
   */
  private sortByProject(a: BasicProject, b: BasicProject): number {
    if (!this.projectsOrder) return 0;

    return (
      (this.projectsOrder.get(a.name) ?? Infinity) -
      (this.projectsOrder.get(b.name) ?? Infinity)
    );
  }

  /**
   * Enhances a basic project by computing aggregated metadata and test summary.
   *
   * Takes a `BasicProject` (just name and test modules) and returns a fully
   * populated `Project` object including:
   * - `meta`: Aggregated duration of all test modules
   * - `summary`: Counts of tests in each state (`passed`, `failed`, `skipped`, `total`)
   *
   * This method is the final step in transforming raw test module data into
   * a project structure suitable for rendering by the Markdown reporter.
   *
   * @internal
   * @param project - The basic project object containing its test modules.
   * @returns         A `Project` object with computed `meta` and `summary`.
   */
  private enhanceProject(project: BasicProject): Project {
    return {
      ...project,
      meta: {
        duration: project.testModules.reduce(
          (duration, testModule) => duration + testModule.meta.duration,
          0,
        ),
      },
      summary: {
        tests: {
          passed: this.sumTestsCountByState(project.testModules, 'passed'),
          failed: this.sumTestsCountByState(project.testModules, 'failed'),
          skipped: this.sumTestsCountByState(project.testModules, 'skipped'),
          total: this.sumTestsCountByState(project.testModules, 'total'),
        },
      },
    };
  }

  /**
   * Converts a Vitest test module or test run state to the internal `State` type.
   *
   * This method provides a single point of conversion between Vitest's
   * native states (`TestModuleState` or `TestRunEndReason`) and the reporter's
   * internal `State` representation. Currently, it performs a simple type cast,
   * but having a dedicated method allows for future adjustments or validations
   * if needed.
   *
   * Pending state is not used in this reporter as it runs after all tests are already finished.
   *
   * @internal
   * @param state - The Vitest state to convert (module state or run end reason).
   * @returns       The corresponding internal `State`.
   */
  private convertState(state: TestModuleState | TestRunEndReason): State {
    return state as State;
  }

  /**
   * Logs a message using the Vitest context logger.
   *
   * This is a convenience method that wraps `Vitest.logger.log` to centralize
   * logging within the reporter. Using this method ensures consistency and
   * makes it easier to modify logging behavior in the future if needed.
   *
   * @internal
   * @param logMessage - The message to log.
   */
  private log(logMessage: string): void {
    this.ctx.logger.log(logMessage);
  }
}
