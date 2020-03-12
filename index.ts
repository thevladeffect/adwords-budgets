import { config as loadEnvironment } from 'dotenv';
import { IntervalTree } from 'node-interval-tree'
import { Entry, InputReader } from './input-reader';
import { delay, map, pairwise, reduce, share, switchMap, take, tap } from 'rxjs/operators';
import { combineLatest, Observable } from 'rxjs';
import { currentBudget, IntervalWithBudget, maxDailyBudget, maxMonthlyBudget, Tree } from './tree-helpers';
import { dateKey, dates$, monthKey, randomDates$ } from './date-helper';
import { randomNumber } from './random-helper';
import roundTo from 'round-to';

loadEnvironment();

const reader: InputReader = new InputReader('input.csv');

const intervalTree$: Observable<Tree> = reader.read().pipe(
  pairwise(),
  map<[Entry, Entry], IntervalWithBudget>(([first, second]) => ({
    low: first.moment,
    high: second.moment,
    budget: first.budget,
  })),
  reduce(
    (accumulator: IntervalTree<IntervalWithBudget>, currentValue: IntervalWithBudget) => {
      accumulator.insert(currentValue);
      return accumulator;
    },
    new IntervalTree<IntervalWithBudget>(),
  ),
  share(),
);

const generatedDates$ = reader.read().pipe(
  map<Entry, number>(entry => entry.moment),
  take(1),
  switchMap(start => randomDates$(start)),
  delay(50),
);

const allDates$ = reader.read().pipe(
  map<Entry, number>(entry => entry.moment),
  take(1),
  switchMap(start => dates$(start)),
  delay(50),
);

const costPerMonth: { [key: string]: number } = {};
const costPerDay: { [key: string]: number } = {};

const costs$ = combineLatest([intervalTree$, generatedDates$])
  .pipe(
    map(([tree, moment]) => {
      const currentMaximum: number = currentBudget(tree, moment) * 2;
      const currentDaily: number = costPerDay[dateKey(moment)] ?? 0;

      const monthlyMaximum: number = maxMonthlyBudget(tree, moment);
      const currentMonthly: number = costPerMonth[monthKey(moment)] ?? 0;

      const maxCost: number = Math.min(
        currentMaximum - currentDaily,
        monthlyMaximum - currentMonthly,
      );

      const cost: number = randomNumber(0, maxCost);

      costPerMonth[monthKey(moment)] = (costPerMonth[monthKey(moment)] ?? 0) + cost;
      costPerDay[dateKey(moment)] = (costPerDay[dateKey(moment)] ?? 0) + cost;

      return {
        moment,
        cost,
      };
    }),
    reduce(
      (accumulator, { moment, cost }) => {
        const currentCost = (accumulator[dateKey(moment)] ?? 0) + cost;
        accumulator[dateKey(moment)] = roundTo.down(currentCost, 2);
        return accumulator;
      },
      {} as { [key: string]: number },
    )
  );

const result$ = combineLatest([intervalTree$, allDates$, costs$]).pipe(
  map(([tree, date, costs]) => ({ tree, date, costs })),
  reduce(
    (accumulator, { tree, date, costs }) => {
      accumulator[dateKey(date)] = {
        budget: accumulator[dateKey(date)]?.budget ?? maxDailyBudget(tree, date),
        cost: costs[dateKey(date)] ?? 0,
      };
      return accumulator;
    },
    {} as { [key: string]: { budget: number, cost: number } },
  ),
  tap(console.table),
);

result$.subscribe();
