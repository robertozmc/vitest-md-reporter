import fs from 'node:fs';
import path from 'node:path';
import type {
  Reporter,
  ResolvedConfig,
  SerializedError,
  TestCase,
  TestModule,
  TestModuleState,
  TestResult,
  TestRunEndReason,
  TestSuite,
  Vitest,
} from 'vitest/node';
import { MarkdownRenderer } from './renderer';
import type {
  ExtendedVitestConfig,
  Project,
  ProjectName,
  Suite,
  SummaryResults,
  Test,
  TestModuleData,
} from './types';

interface MarkdownReporterOptions {
  projectLabel?: string;
  projectsOrder?: string[];
  title?: string;
}

export class MarkdownReporter implements Reporter {
  private ctx!: Vitest;
  private renderer: MarkdownRenderer;

  private outputFile = 'vitest-report.md';
  private projectLabel = 'Project';
  private projectsOrder?: Map<string, number>;
  private title = 'Vitest Test Report';

  private startTime = 0;

  constructor(options?: MarkdownReporterOptions) {
    this.renderer = new MarkdownRenderer();

    if (options?.projectLabel) this.projectLabel = options.projectLabel;
    if (options?.projectsOrder)
      this.projectsOrder = new Map(
        options.projectsOrder.map((projectName, index) => [projectName, index])
      );
    if (options?.title) this.title = options.title;
  }

  onInit(vitest: Vitest) {
    this.ctx = vitest;

    const config = vitest.config as ResolvedConfig & ExtendedVitestConfig;
    if (config.outputFile?.md) this.outputFile = config.outputFile.md;

    this.startTime = Date.now();
  }

  async onTestRunEnd(
    testModules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    reason: TestRunEndReason
  ) {
    const endTime = Date.now();

    const markdownDocument = this.renderer.render({
      meta: {
        duration: endTime - this.startTime,
        endTime: endTime,
        startTime: this.startTime,
        state: reason,
      },
      projectLabel: this.projectLabel,
      projects: this.groupTestModulesByProject(testModules),
      summary: {
        testFiles: {
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
            Array.from(testModule.children.allTests())
          ).length,
        },
      },
      title: this.title,
    });

    const outputPath = this.saveReportToFile(markdownDocument, this.outputFile);

    this.ctx.logger.log(`Markdown report written to ${outputPath}`);
  }

  private groupTestModulesByProject(
    testModules: ReadonlyArray<TestModule>
  ): Project[] {
    return testModules
      .map<TestModuleData>((testModule) => {
        return {
          meta: {
            duration: Math.round(testModule.diagnostic().duration),
            state: testModule.state(),
          },
          name: testModule.relativeModuleId,
          projectName: testModule.project.name,
          summary: {
            passed: Array.from(testModule.children.allTests('passed')).length,
            failed: Array.from(testModule.children.allTests('failed')).length,
            skipped: Array.from(testModule.children.allTests('skipped')).length,
            total: Array.from(testModule.children.allTests()).length,
          },
          suites: this.mapSuites(Array.from(testModule.children.suites())),
          tests: this.mapTests(Array.from(testModule.children.tests())),
        };
      })
      .reduce<Omit<Project, 'meta' | 'summary'>[]>(
        (accumulator, currentValue) => {
          let projectGroup = accumulator.find(
            (project) => project.name === currentValue.projectName
          );

          if (!projectGroup) {
            projectGroup = {
              name: currentValue.projectName,
              testModules: [],
            };
            accumulator.push(projectGroup);
          }

          projectGroup.testModules.push(currentValue);

          return accumulator;
        },
        []
      )
      .sort((a, b) =>
        this.projectsOrder
          ? (this.projectsOrder.get(a.name) ?? Infinity) -
            (this.projectsOrder.get(b.name) ?? Infinity)
          : 0
      )
      .map<Project>((project) => ({
        ...project,
        meta: {
          duration: this.sumProjectTestsDuration(project),
        },
        summary: {
          passed: this.sumProjectTestsCountByState(project, 'passed'),
          failed: this.sumProjectTestsCountByState(project, 'failed'),
          skipped: this.sumProjectTestsCountByState(project, 'skipped'),
          total: this.sumProjectTestsCountByState(project, 'total'),
        },
      }));
  }

  private filterTestModulesByState(
    testModules: ReadonlyArray<TestModule>,
    state: TestModuleState
  ) {
    return testModules.filter((testModule) => testModule.state() === state);
  }

  private filterTestsByState(
    testModules: ReadonlyArray<TestModule>,
    state: TestResult['state']
  ) {
    return testModules.flatMap((testModule) =>
      Array.from(testModule.children.allTests(state))
    );
  }

  private sumProjectTestsDuration(project: Omit<Project, 'meta' | 'summary'>) {
    return project.testModules.reduce(
      (accumulator, currentValue) => accumulator + currentValue.meta.duration,
      0
    );
  }

  private sumProjectTestsCountByState(
    project: Omit<Project, 'meta' | 'summary'>,
    state: keyof SummaryResults
  ) {
    return project.testModules.reduce(
      (accumulator, currentValue) => accumulator + currentValue.summary[state],
      0
    );
  }

  private mapTests(tests: TestCase[]): Test[] {
    return tests.map((test) => ({
      duration: Math.round(test.diagnostic()?.duration ?? 0),
      name: test.name,
      state: test.result().state,
    }));
  }

  private mapSuites(suites: TestSuite[]): Suite[] {
    return suites.map((suite) => ({
      name: suite.name,
      suites: this.mapSuites(Array.from(suite.children.suites())),
      tests: this.mapTests(Array.from(suite.children.tests())),
    }));
  }

  private saveReportToFile(fileContent: string, outputFilePath: string) {
    const outputPath = path.resolve(process.cwd(), outputFilePath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, fileContent, 'utf-8');

    return outputPath;
  }
}
