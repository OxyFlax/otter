import {DateInput, Operator, SupportedSimpleTypes} from './operator.interface';

/**
 * Execute Operator
 *
 * @param lhs Left hand side
 * @param rhs Right hand side
 * @param operator Operator to compare values
 */
export function executeOperator<L = unknown, R = unknown>(lhs: L, rhs: R, operator: Operator<L, R>) {
  const validLhs = (!operator.validateLhs || operator.validateLhs(lhs));
  const validRhs = (!operator.validateRhs || operator.validateRhs(rhs));
  if (!validLhs) {
    throw new Error(`Invalid left operand : ${JSON.stringify(lhs)}`);
  }
  if (!validRhs) {
    throw new Error(`Invalid right operand : ${JSON.stringify(rhs)}`);
  }
  const obs = operator.evaluator(lhs, rhs);
  return obs;
}

/**
 * Validate a number operand
 *
 * @param operand value of one of the operands
 */
export function numberValidator(operand: unknown): operand is number | string {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  return operand !== '' && !Array.isArray(operand) && !isNaN(+`${operand}`);
}

/**
 * Validate an operand is a range of numbers
 *
 * @param operatorInput value of one of the operands
 */
export function isRangeNumber(operatorInput: unknown): operatorInput is [number | string, number | string] {
  return Array.isArray(operatorInput) &&
    operatorInput.length === 2 &&
    numberValidator(operatorInput[0]) &&
    numberValidator(operatorInput[1]) &&
    operatorInput[0] <= operatorInput[1];
}

/**
 * Verifies if the parameter is a valid date for the operator (getTime function available returning a number)
 *
 * @param operatorInput
 */
export const isValidDate = (operatorInput: any): operatorInput is Date => {
  if (!operatorInput || typeof operatorInput.getTime !== 'function') {
    return false;
  }
  const getTimeResult = operatorInput.getTime();
  return typeof getTimeResult === 'number' && !isNaN(getTimeResult);
};

/**
 * Verifies if the parameter is a valid input for Date constructor (new Date returns a valid date)
 *
 * @param operatorInput
 */
export const isValidDateInput = (operatorInput: any): operatorInput is DateInput => {
  return operatorInput === 0 || !!operatorInput && isValidDate(new Date(operatorInput));
};

/**
 * Verifies if the parameter is a valid date range
 *
 * @param operatorInput
 */
export const isValidDateRange = (operatorInput: any): operatorInput is [DateInput, DateInput] => {
  return Array.isArray(operatorInput) &&
    operatorInput.length === 2 &&
    isValidDateInput(operatorInput[0]) &&
    isValidDateInput(operatorInput[1]) &&
    new Date(operatorInput[0]) <= new Date(operatorInput[1]);
};


/**
 * Verifies if the parameter has a valid date and number representing minutes
 *
 * @param operatorInput
 */
export const isValidDateWithMinutes = (operatorInput: any): operatorInput is [DateInput, number] => {
  return Array.isArray(operatorInput) &&
    operatorInput.length === 2 &&
    isValidDateInput(operatorInput[0]) &&
    numberValidator(operatorInput[1]);
};

/**
 * Validate that a value is a supported simple type
 *
 * @param value value to validate
 */
export function isSupportedSimpleTypes(value: unknown): value is SupportedSimpleTypes {
  return ['string', 'boolean', 'number', 'undefined'].includes(typeof value) || value === null || isValidDate(value);
}

/**
 * Validate that a value is a string
 *
 * @param value
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
