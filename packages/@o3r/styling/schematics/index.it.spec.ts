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

const appName = 'test-app-styling';
const o3rVersion = '999.0.0';
const execAppOptions = getDefaultExecSyncOptions();
let appFolderPath: string;

describe('new otter application with styling', () => {
  setupLocalRegistry();
  describe('standalone', () => {
    beforeAll(async () => {
      appFolderPath = await prepareTestEnv(appName, 'angular-with-o3r-core');
      execAppOptions.cwd = appFolderPath;
    });
    test('should add styling to existing application', () => {
      packageManagerExec(`ng add --skip-confirmation @o3r/styling@${o3rVersion} --enable-metadata-extract`, execAppOptions);

      packageManagerExec('ng g @o3r/core:component --defaults=true test-component --use-otter-theming=false', execAppOptions);
      packageManagerExec('ng g @o3r/styling:add-theming --path="src/components/test-component/presenter/test-component-pres.style.scss"', execAppOptions);
      addImportToAppModule(appFolderPath, 'TestComponentContModule', 'src/components/test-component');

      const diff = getGitDiff(execAppOptions.cwd as string);
      expect(diff.modified).toContain('package.json');
      expect(diff.added).toContain('src/components/test-component/presenter/test-component-pres.style.theme.scss');

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
    test('should add styling to existing application', () => {
      const projectName = '--project-name=test-app';
      packageManagerExec(`ng add --skip-confirmation @o3r/styling@${o3rVersion} --enable-metadata-extract ${projectName}`, execAppOptions);

      packageManagerExec(`ng g @o3r/core:component --defaults=true test-component --use-otter-theming=false ${projectName}`, execAppOptions);
      packageManagerExec('ng g @o3r/styling:add-theming --path="projects/test-app/src/components/test-component/presenter/test-component-pres.style.scss"', execAppOptions);
      addImportToAppModule(appFolderPath, 'TestComponentContModule', 'projects/test-app/src/components/test-component');

      const diff = getGitDiff(execAppOptions.cwd as string);
      expect(diff.all.some((file) => /projects[\\/]dont-modify-me/.test(file))).toBe(false);
      expect(diff.modified).toContain('package.json');
      expect(diff.modified).toContain('projects/test-app/package.json');
      expect(diff.added).toContain('projects/test-app/src/components/test-component/presenter/test-component-pres.style.theme.scss');

      expect(() => packageManagerInstall(execAppOptions)).not.toThrow();
      expect(() => packageManagerRun('build', execAppOptions)).not.toThrow();
    });
    afterAll(() => rm(execAppOptions.cwd, {recursive: true}));
  });
});
