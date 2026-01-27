import { faker } from '@faker-js/faker';

import type {
  Project,
  SuiteData,
  TestData,
  TestMetaData,
  TestModuleData,
  TestRunData,
  TestRunMetaData,
} from '../../../src/types';

export const generateData = () => {
  return {
    ...generateMeta(),
    ...generateProjectLabel(),
    ...generateProjects(),
    ...generateSummary(),
    ...generateTitle(),
  } satisfies TestRunData;
};

export const generateTitle = (): Pick<TestRunData, 'title'> => {
  return {
    title: faker.company.catchPhrase(),
  };
};

export const generateProjectLabel = (): Pick<TestRunData, 'projectLabel'> => {
  return {
    projectLabel: faker.company.name(),
  };
};

export const generateProjects = (): Pick<TestRunData, 'projects'> => {
  return {
    projects: [generateProject()],
  };
};

export const generateProject = (project?: Partial<Project>) => {
  return {
    meta: {
      duration: faker.number.int({ min: 1, max: 6 }),
    },
    name: faker.animal.dog(),
    summary: {
      tests: {
        passed: faker.number.int({ min: 0, max: 4 }),
        failed: faker.number.int({ min: 0, max: 4 }),
        skipped: faker.number.int({ min: 0, max: 4 }),
        total: faker.number.int({ min: 0, max: 4 }),
      },
    },
    testModules: [generateTestModule()],
    ...project,
  };
};

export const generateTestModule = (testModule?: Partial<TestModuleData>) => {
  return {
    name: faker.system.filePath(),
    projectName: faker.animal.dog(),
    summary: {
      tests: {
        passed: faker.number.int({ min: 0, max: 4 }),
        failed: faker.number.int({ min: 0, max: 4 }),
        skipped: faker.number.int({ min: 0, max: 4 }),
        total: faker.number.int({ min: 0, max: 4 }),
      },
    },
    suites: [generateSuite()],
    tests: [generateTestData()],
    ...generateTestModuleMeta(),
    ...testModule,
  } satisfies TestModuleData;
};

export const generateTestModuleMeta = (meta?: Partial<TestMetaData>) => {
  return {
    meta: {
      duration: faker.number.int({ min: 1, max: 6 }),
      state: 'passed',
      ...meta,
    } satisfies TestMetaData,
  };
};

export const generateTestData = (testData?: Partial<TestData>) => {
  return {
    meta: {
      duration: faker.number.int({ min: 1, max: 6 }),
      state: 'passed',
    },
    name: faker.animal.dog(),
    ...testData,
  } satisfies TestData;
};

export const generateSuite = (suite?: Partial<SuiteData>) => {
  return {
    name: faker.animal.dog(),
    suites: [],
    tests: [generateTestData()],
    ...suite,
  };
};

export const generateMeta = (
  meta?: Partial<TestRunMetaData>,
): Pick<TestRunData, 'meta'> => {
  return {
    meta: {
      duration: faker.number.int({ min: 1, max: 6 }),
      startTime: faker.date.past().getTime(),
      endTime: faker.date.future().getTime(),
      state: 'passed',
      ...meta,
    },
  };
};

export const generateSummary = (): Pick<TestRunData, 'summary'> => {
  return {
    summary: {
      testModules: {
        passed: faker.number.int({ min: 0, max: 4 }),
        failed: faker.number.int({ min: 0, max: 4 }),
        skipped: faker.number.int({ min: 0, max: 4 }),
        total: faker.number.int({ min: 0, max: 4 }),
      },
      tests: {
        passed: faker.number.int({ min: 0, max: 4 }),
        failed: faker.number.int({ min: 0, max: 4 }),
        skipped: faker.number.int({ min: 0, max: 4 }),
        total: faker.number.int({ min: 0, max: 4 }),
      },
    },
  };
};
