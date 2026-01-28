import fs from 'node:fs';
import path from 'node:path';

/**
 * Rounds milliseconds to the nearest integer.
 *
 * @param milliseconds - The number of milliseconds to round.
 * @example
 * // returns 538
 * roundDurationToMs(538.300212349909);
 * @returns              The rounded value of milliseconds.
 */
export const roundDurationToMs = (milliseconds: number = 0) => {
  return Math.round(milliseconds);
};

/**
 * Saves the file inside the current process root.
 *
 * @param fileContent    - The conent to write to the file.
 * @param outputFilePath - A relative path or an absolute path that resolves inside the allowed root.
 * @returns                The resolved absolute path of the saved file
 * @throws {Error}         If the resolved path is outside the current process root.
 */
export const saveFileToDisk = (fileContent: string, outputFilePath: string) => {
  const root = path.resolve(process.env.REPORT_OUTPUT_ROOT ?? process.cwd());
  const resolvedPath = path.resolve(root, outputFilePath);

  if (!resolvedPath.startsWith(root + path.sep)) {
    throw new Error(
      `Invalid output file path: ${outputFilePath}. Must be inside ${root}.`,
    );
  }

  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, fileContent, 'utf-8');

  return resolvedPath;
};
