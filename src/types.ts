import {
  TestModule,
  TestModuleState,
  TestRunEndReason,
  TestState,
} from 'vitest/node';

export type ExtendedVitestConfig = {
  outputFile: Partial<Record<'md', string>>;
};

export type Meta = {
  duration: number;
};

export type ProjectName = string;
export type Project = {
  meta: Meta;
  name: string;
  summary: SummaryResults;
  testModules: TestModuleData[];
};

export type MetaData = {
  duration: number;
  endTime: number;
  startTime: number;
  state: TestRunEndReason;
};

export type SummaryResults = {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
};

export type Summary = {
  testFiles: SummaryResults;
  tests: SummaryResults;
};

export type Test = {
  duration: number;
  name: string;
  state: TestState;
};

export type Suite = {
  name: string;
  suites: Suite[];
  tests: Test[];
};

export type TestModuleData = {
  meta: {
    duration: number;
    state: TestModuleState;
  };
  name: string;
  projectName: string;
  summary: SummaryResults;
  suites: Suite[];
  tests: Test[];
};

export type ReporterData = {
  meta: MetaData;
  projectLabel: string;
  projects: Project[];
  summary: Summary;
  title: string;
};
