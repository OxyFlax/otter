import * as semver from 'semver';
import type { PackageJson } from 'type-fest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, normalize , resolve } from 'node:path';
import { sync as globbySync } from 'globby';

export interface PackageProperty {
  packages: {
    content: PackageJson;
    path: string;
    isWorkspace?: boolean;
  }[];
  hasDefaulted?: boolean;
}

export interface RangeInformation {
  range: string;
  path: string;
}

/**
 * Find the closest package.json file containing workspace definition in the parent directories
 * @param directory Current directory to search for
 * @param rootDir First directory of the recursion
 */
export const findWorkspacePackageJsons = (directory: string, rootDir?: string): PackageProperty | undefined => {
  const parentFolder = dirname(directory);
  rootDir ||= directory;
  if (parentFolder === directory) {
    return undefined;
  }
  const packageJsonPath = resolve(directory, 'package.json');
  const content = existsSync(packageJsonPath) && JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' })) as PackageJson;
  if (!content || !content.workspaces) {
    return findWorkspacePackageJsons(parentFolder, rootDir);
  }
  const packagePaths = globbySync(
    (Array.isArray(content.workspaces) ? content.workspaces : content.workspaces.packages || []).map((f) => join(f, 'package.json')),
    { cwd: directory, onlyFiles: false, absolute: true }
  );
  const isPackageWorkspace = packagePaths.some((workspacePath) => normalize(workspacePath) === rootDir);
  const getPackages = () => ([
    { content, path: packageJsonPath, isWorkspace: true },
    ...packagePaths.map((subPackageJsonPath) => ({ content: JSON.parse(readFileSync(subPackageJsonPath, { encoding: 'utf-8' })) as PackageJson, path: subPackageJsonPath }))
  ]);
  if (isPackageWorkspace) {
    return {
      packages: getPackages()
    };
  } else { // In case we discover a workspace for which the package is not part of
    const parent = findWorkspacePackageJsons(parentFolder, rootDir);
    if (!parent || parent.hasDefaulted) {
      return {
        hasDefaulted: true,
        packages: getPackages()
      };
    }
  }
};

export const isRangeBetter = (currentRange?: string, range?: string) => {
  if (!range || !semver.validRange(range)) {
    return currentRange && semver.validRange(currentRange) ? currentRange : undefined;
  }
  if (!currentRange || !semver.validRange(currentRange)) {
    return range;
  }
  if (currentRange !== range) {
    const minVersion = semver.minVersion(range)!;
    const currentMinVersion = semver.minVersion(currentRange)!;
    if (semver.gt(minVersion, currentMinVersion)) {
      return range;
    } else if (semver.eq(minVersion, currentMinVersion) && semver.subset(range, currentRange)) {
      return range;
    }
  }
  return currentRange;
};

export const getBestRanges = (dependencyTypes: string[], packages: PackageProperty['packages']) => {
  return packages.reduce((acc, pck) => {
    dependencyTypes.forEach((depType) => {
      const dependencies = pck.content[depType];
      if (dependencies) {
        Object.entries(dependencies).forEach(([depName, range]) => {
          if (!acc[depName]) {
            if (range) {
              acc[depName] = { range, path: pck.path };
            }
          } else if (isRangeBetter(acc[depName].range, range) !== acc[depName].range) {
            acc[depName] = { range: range, path: pck.path };
          }
        });
      }
    });
    return acc;
  }, {} as Record<string, RangeInformation>);
};
