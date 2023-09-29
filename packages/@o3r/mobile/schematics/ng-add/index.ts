import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getProjectNewDependenciesType } from '@o3r/schematics';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { NgAddSchematicsSchema } from './schema';

/**
 * Add Otter mobile to an Angular Project
 * @param options ng add options
 */
export function ngAdd(options: NgAddSchematicsSchema): Rule {
  /* ng add rules */
  return async (tree: Tree, context: SchematicContext) => {
    try {
      const { addDependenciesInPackageJson, ngAddPackages, getO3rPeerDeps, getWorkspaceConfig, removePackages } = await import('@o3r/schematics');
      const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }));
      const depsInfo = getO3rPeerDeps(packageJsonPath);
      const workspaceProject = options.projectName ? getWorkspaceConfig(tree)?.projects[options.projectName] : undefined;
      const workingDirectory = workspaceProject?.root || '.';
      const dependencyType = getProjectNewDependenciesType(workspaceProject);
      return () => chain([
        addDependenciesInPackageJson([packageJson.name!], {...options, workingDirectory, version: packageJson.version}),
        removePackages(['@otter/mobile']),
        ngAddPackages(depsInfo.o3rPeerDeps, {
          skipConfirmation: true,
          version: depsInfo.packageVersion,
          parentPackageInfo: depsInfo.packageName,
          projectName: options.projectName,
          dependencyType,
          workingDirectory
        })
      ])(tree, context);

    } catch (e) {
      // o3r mobile needs o3r/core as peer dep. o3r/core will install o3r/schematics
      context.logger.error(`[ERROR]: Adding @o3r/mobile has failed.
      If the error is related to missing @o3r dependencies you need to install '@o3r/core' to be able to use the mobile package. Please run 'ng add @o3r/core' .
      Otherwise, use the error message as guidance.`);
      throw (e);
    }
  };
}
