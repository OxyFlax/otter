import {isValidDateInput, isValidDateRange, isValidDateWithMinutes} from '../operator.helpers';
import {DateInput, Operator} from '../operator.interface';

/**
 * Check if a date variable is in a specified date range
 *
 * @title is between
 */
export const inRangeDate: Operator<Date, [DateInput, DateInput], DateInput> = {
  name: 'inRangeDate',
  evaluator: (date, [from, to]) => {
    const dateObject = new Date(date);
    return new Date(from) <= dateObject && new Date(to) >= dateObject;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateRange
};

/**
 * Check if the value of the variable is in the next x minutes
 *
 * @title is in next minutes
 */
export const dateInNextMinutes: Operator<Date, [DateInput, number], DateInput> = {
  name: 'dateInNextMinutes',
  evaluator: (leftDateInput, [rightDate, minutes]) => {
    const targetDate = new Date(rightDate);
    const leftDate = new Date(leftDateInput);
    targetDate.setMinutes(targetDate.getMinutes() + +minutes);
    return leftDate <= targetDate;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateWithMinutes
};

/**
 * Check if the value of the variable is not in the next x minutes
 *
 * @title is not in next minutes
 */
export const dateNotInNextMinutes: Operator<Date, [DateInput, number], DateInput> = {
  name: 'dateNotInNextMinutes',
  evaluator: (leftDateInput, [rightDate, minutes]) => {
    const targetDate = new Date(rightDate);
    const leftDate = new Date(leftDateInput);
    targetDate.setMinutes(targetDate.getMinutes() + +minutes);
    return leftDate > targetDate;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateWithMinutes
};

/**
 * Check if a date variable is prior than a specified date
 *
 * @title is before
 */
export const dateBefore: Operator<Date, DateInput, DateInput> = {
  name: 'dateBefore',
  evaluator: (leftDate, rightDate) => {
    const firstDateTime = new Date(leftDate).setHours(0,0,0,0);
    const secondDateTime = new Date(rightDate).setHours(0,0,0,0);
    return firstDateTime < secondDateTime;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateInput
};

/**
 * Check if a date variable is posterior than a specified date
 *
 * @title is after
 */
export const dateAfter: Operator<Date, DateInput, DateInput> = {
  name: 'dateAfter',
  evaluator: (leftDate, rightDate) => {
    const firstDateTime = new Date(leftDate).setHours(0,0,0,0);
    const secondDateTime = new Date(rightDate).setHours(0,0,0,0);
    return firstDateTime > secondDateTime;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateInput
};

/**
 * Check if a date variable is the same as a specified date
 *
 * @title is equal to
 */
export const dateEquals: Operator<Date, DateInput, DateInput> = {
  name: 'dateEquals',
  evaluator: (leftDate, rightDate) => {
    const firstDateIgnoringHours = new Date(leftDate).setHours(0, 0, 0, 0);
    const secondDateIgnoringHours = new Date(rightDate).setHours(0, 0, 0, 0);
    return firstDateIgnoringHours === secondDateIgnoringHours;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateInput
};

/**
 * Check if a date variable is different from a specified date
 *
 * @title is not equal
 */
export const dateNotEquals: Operator<Date, DateInput, DateInput> = {
  name: 'dateNotEquals',
  evaluator: (leftDate, rightDate) => {
    const firstDateIgnoringHours = new Date(leftDate).setHours(0, 0, 0, 0);
    const secondDateIgnoringHours = new Date(rightDate).setHours(0, 0, 0, 0);
    return firstDateIgnoringHours !== secondDateIgnoringHours;
  },
  validateLhs: isValidDateInput,
  validateRhs: isValidDateInput
};

export const dateBasedOperators = [
  inRangeDate, dateInNextMinutes, dateNotInNextMinutes, dateAfter, dateBefore, dateEquals, dateNotEquals
];
