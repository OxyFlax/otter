import {
  addImportToAppModule,
  getDefaultExecSyncOptions,
  getGitDiff,
  packageManagerExec,
  packageManagerInstall,
  packageManagerRunOnProject,
  prepareTestEnv,
  setupLocalRegistry
} from '@o3r/test-helpers';
import { rm } from 'node:fs/promises';
import * as path from 'node:path';

const appFolder = 'test-app-styling';
const o3rVersion = '999.0.0';
const execAppOptions = getDefaultExecSyncOptions();
let projectPath: string;
let workspacePath: string;
let projectName: string;
let isInWorkspace: boolean;
let untouchedProjectPath: undefined | string;
describe('new otter application with styling', () => {
  setupLocalRegistry();
  beforeAll(async () => {
    ({ projectPath, workspacePath, projectName, isInWorkspace, untouchedProjectPath } = await prepareTestEnv(appFolder));
    execAppOptions.cwd = workspacePath;
  });
  afterAll(async () => {
    try { await rm(workspacePath, { recursive: true }); } catch { /* ignore error */ }
  });
  test('should add styling to existing application', async () => {
    const relativeProjectPath = path.relative(workspacePath, projectPath);
    packageManagerExec({script: 'ng', args: ['add', `@o3r/styling@${o3rVersion}`, '--enable-metadata-extract', '--skip-confirmation', '--project-name', projectName]}, execAppOptions);

    packageManagerExec({script: 'ng', args: ['g', '@o3r/core:component', '--defaults', 'true', 'test-component', '--use-otter-theming', 'false', '--project-name', projectName]}, execAppOptions);
    const filePath = path.normalize(path.join(relativeProjectPath, 'src/components/test-component/test-component.style.scss'));
    packageManagerExec({script: 'ng', args: ['g', '@o3r/styling:add-theming', '--path', filePath]}, execAppOptions);
    addImportToAppModule(projectPath, 'TestComponentModule', 'src/components/test-component');

    await addImportToAppModule(projectPath, 'TestComponentModule', 'src/components/test-component');

    const diff = getGitDiff(execAppOptions.cwd as string);
    expect(diff.modified).toContain('package.json');
    expect(diff.added).toContain(path.join(relativeProjectPath, 'src/components/test-component/test-component.style.theme.scss').replace(/[\\/]+/g, '/'));

    if (untouchedProjectPath) {
      const relativeUntouchedProjectPath = path.relative(workspacePath, untouchedProjectPath);
      expect(diff.all.filter((file) => new RegExp(relativeUntouchedProjectPath.replace(/[\\/]+/g, '[\\\\/]')).test(file)).length).toBe(0);
    }

    expect(() => packageManagerInstall(execAppOptions)).not.toThrow();
    expect(() => packageManagerRunOnProject(projectName, isInWorkspace, {script: 'build'}, execAppOptions)).not.toThrow();
  });
});
