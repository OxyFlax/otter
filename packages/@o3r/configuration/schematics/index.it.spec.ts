import {
  addImportToAppModule,
  getDefaultExecSyncOptions,
  getGitDiff,
  packageManagerExec,
  packageManagerInstall,
  packageManagerRun,
  prepareTestEnv,
  setupLocalRegistry
} from '@o3r/test-helpers';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const appName = 'test-app-configuration';
const o3rVersion = '999.0.0';
const execAppOptions = getDefaultExecSyncOptions();
let appFolderPath: string;

describe('new otter application with configuration', () => {
  setupLocalRegistry();
  describe('standalone', () => {
    beforeAll(async () => {
      appFolderPath = await prepareTestEnv(appName, 'angular-with-o3r-core');
      execAppOptions.cwd = appFolderPath;
    });
    test('should add configuration to existing application', () => {
      packageManagerExec(`ng add --skip-confirmation @o3r/configuration@${o3rVersion}`, execAppOptions);

      packageManagerExec('ng g @o3r/core:component test-component --use-otter-config=false', execAppOptions);
      packageManagerExec('ng g @o3r/configuration:add-config --path="src/components/test-component/container/test-component-cont.component.ts"', execAppOptions);
      addImportToAppModule(appFolderPath, 'TestComponentContModule', 'src/components/test-component');

      const diff = getGitDiff(appFolderPath);
      expect(diff.modified).toContain('package.json');
      expect(diff.added).toContain('src/components/test-component/container/test-component-cont.config.ts');

      expect(() => packageManagerInstall(execAppOptions)).not.toThrow();
      expect(() => packageManagerRun('build', execAppOptions)).not.toThrow();
    });
    afterAll(() => rm(execAppOptions.cwd, {recursive: true}));
  });

  describe('monorepo', () => {
    beforeAll(async () => {
      const workspacePath = await prepareTestEnv(`${appName}-monorepo`, 'angular-monorepo-with-o3r-core');
      appFolderPath = join(workspacePath, 'projects', 'test-app');
      execAppOptions.cwd = workspacePath;
    });
    test('should add configuration to existing application', () => {
      const projectName = '--project-name=test-app';
      packageManagerExec(`ng add --skip-confirmation @o3r/configuration@${o3rVersion} ${projectName}`, execAppOptions);

      packageManagerExec(`ng g @o3r/core:component test-component --use-otter-config=false ${projectName}`, execAppOptions);
      packageManagerExec('ng g @o3r/configuration:add-config --path="projects/test-app/src/components/test-component/container/test-component-cont.component.ts"', execAppOptions);
      addImportToAppModule(appFolderPath, 'TestComponentContModule', 'projects/test-app/src/components/test-component');

      const diff = getGitDiff(execAppOptions.cwd as string);
      expect(diff.all.some((file) => /projects[\\/]dont-modify-me/.test(file))).toBe(false);
      expect(diff.modified).toContain('package.json');
      expect(diff.modified).toContain('projects/test-app/package.json');
      expect(diff.added).toContain('projects/test-app/src/components/test-component/container/test-component-cont.config.ts');

      expect(() => packageManagerInstall(execAppOptions)).not.toThrow();
      expect(() => packageManagerRun('build', execAppOptions)).not.toThrow();
    });
    afterAll(() => rm(execAppOptions.cwd, {recursive: true}));
  });
});
