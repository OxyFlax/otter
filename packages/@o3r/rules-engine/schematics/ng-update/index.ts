/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable camelcase */

import { chain, Rule } from '@angular-devkit/schematics';
import { updateRuleEngineService } from './v9.0/action-module-split';

/**
 * update of Otter library V9.0
 */
export function updateV90(): Rule {
  return (tree, context) => {

    const updateRules: Rule[] = [
      updateRuleEngineService()
    ];

    return chain(updateRules)(tree, context);
  };
}
