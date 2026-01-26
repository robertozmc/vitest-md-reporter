import { faker } from '@faker-js/faker';

import { TestRunData } from '../../../src/types';

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
    title: faker.book.title(),
  };
};

export const generateProjectLabel = (): Pick<TestRunData, 'projectLabel'> => {
  return {
    projectLabel: faker.company.name(),
  };
};

export const generateProjects = (): Pick<TestRunData, 'projects'> => {
  return {
    projects: [],
  };
};

export const generateMeta = (): Pick<TestRunData, 'meta'> => {
  return {
    meta: {
      duration: faker.number.int({ min: 1, max: 6 }),
      startTime: faker.date.past().getTime(),
      endTime: faker.date.future().getTime(),
      state: 'passed',
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
