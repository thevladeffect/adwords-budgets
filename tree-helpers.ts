import { Interval, IntervalTree } from 'node-interval-tree';
import { dayFromMoment, daysInMonth } from './date-helper';

export interface IntervalWithBudget extends Interval {
  readonly budget: number;
}

export type Tree = IntervalTree<IntervalWithBudget>;

export function currentBudget(tree: Tree, moment: number): number {
  const matches: IntervalWithBudget[] = tree.search(moment, moment);
  return matches[matches.length - 1]?.budget ?? 0;
}

export function maxDailyBudget(tree: Tree, moment: number): number {
  const { start, end } = dayFromMoment(moment);
  return maxBudget(tree, start, end);
}

export function maxMonthlyBudget(tree: Tree, moment: number): number {
  const currentDate: Date = new Date(moment);
  const monthStartDate: Date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  return [...Array(daysInMonth(moment)).keys()]
    .map((currentDayNo: number) => {
      const todayDate = new Date(monthStartDate);
      todayDate.setDate(monthStartDate.getDate() + currentDayNo);

      return maxDailyBudget(tree, todayDate.getTime());
    })
    .reduce((accumulator: number, currentValue: number) => accumulator + currentValue)
}

function maxBudget(tree: Tree, start: number, end: number): number {
  const matches: IntervalWithBudget[] = tree.search(start, end);
  return matches.reduce((max: number, current: IntervalWithBudget) => current.budget > max ? current.budget : max, 0);
}
