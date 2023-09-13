/* eslint-disable @typescript-eslint/naming-convention */
import noFolderImportForModule from './rules/typescript/no-folder-import-for-module/no-folder-import-for-module';
import templateAsyncNumberLimitation from './rules/template/template-async-number-limitation/template-async-number-limitation';
import jsonDependencyVersionsHarmonize from './rules/json/json-dependency-versions-harmonize/json-dependency-versions-harmonize';

module.exports = {
  rules: {
    'no-folder-import-for-module': noFolderImportForModule,
    'template-async-number-limitation': templateAsyncNumberLimitation,
    'json-dependency-versions-harmonize': jsonDependencyVersionsHarmonize
  },
  configs: {
    '@o3r/no-folder-import-for-module': 'error',
    '@o3r/json-dependency-versions-harmonize': 'error',
    '@o3r/template-async-number-limitation': 'warn',

    recommended: {
      rules: {
        '@o3r/no-folder-import-for-module': 'error',
        '@o3r/template-async-number-limitation': 'off'
      }
    },

    'template-recommended': {
      rules: {
        '@o3r/no-folder-import-for-module': 'error',
        '@o3r/template-async-number-limitation': 'warn'
      }
    },

    'json-recommended': {
      rules: {
        '@o3r/json-dependency-versions-harmonize': 'error'
      }
    }
  }
};

