import { chain, SchematicContext, Tree } from '@angular-devkit/schematics';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { NgAddSchematicsSchema } from './schema';

/**
 * Add Otter configuration to an Angular Project
 * @param options The options to pass to ng-add execution
 */
export function ngAdd(options: NgAddSchematicsSchema) {
  /* ng add rules */
  return async (tree: Tree, context: SchematicContext) => {
    try {
      const {
        addDependenciesInPackageJson,
        ngAddPackages,
        getProjectNewDependenciesType,
        getWorkspaceConfig,
        getO3rPeerDeps,
        registerPackageCollectionSchematics,
        setupSchematicsDefaultParams
      } = await import('@o3r/schematics');
      const packageJsonPath = path.resolve(__dirname, '..', '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' }));
      const depsInfo = getO3rPeerDeps(packageJsonPath);
      const workspaceProject = options.projectName ? getWorkspaceConfig(tree)?.projects[options.projectName] : undefined;
      const workingDirectory = workspaceProject?.root || '.';
      const dependencyType = getProjectNewDependenciesType(workspaceProject);
      context.logger.info(`The package ${depsInfo.packageName as string} comes with a debug mechanism`);
      context.logger.info('Get more information on the following page: https://github.com/AmadeusITGroup/otter/tree/main/docs/configuration/OVERVIEW.md#Runtime-debugging');
      return chain([
        addDependenciesInPackageJson(['@o3r/configuration'], {...options, workingDirectory, version: packageJson.version}),
        registerPackageCollectionSchematics(packageJson),
        setupSchematicsDefaultParams({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '@o3r/core:component': {
            useOtterConfig: undefined
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '@o3r/core:component-container': {
            useOtterConfig: undefined
          },
          // eslint-disable-next-line @typescript-eslint/naming-convention
          '@o3r/core:component-presenter': {
            useOtterConfig: undefined
          }
        }),
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
      // configuration needs o3r/core as peer dep. o3r/core will install o3r/schematics
      context.logger.error(`[ERROR]: Adding @o3r/configuration has failed.
      If the error is related to missing @o3r dependencies you need to install '@o3r/core' to be able to use the configuration package. Please run 'ng add @o3r/core' .
      Otherwise, use the error message as guidance.`);
      throw (e);
    }
  };

}
