import { Observable, range } from 'rxjs';
import { map, mergeMap, share } from 'rxjs/operators';
import { randomInteger } from './random-helper';

const MAX_GENERATIONS_PER_DAY = 10;

export function dayFromMoment(moment: number): { start: number, end: number } {
  const start = new Date(moment);
  start.setHours(0, 0, 0, 0);

  const end = new Date(moment);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

export function randomDates$(start: number, numberOfDays: number = 90): Observable<number> {
  return dates$(start, numberOfDays).pipe(
    mergeMap((moment: number) => {
      const { start, end } = dayFromMoment(moment);
      return [...Array(randomInteger(0, MAX_GENERATIONS_PER_DAY))].map(() => randomInteger(start, end)).sort();
    }),
  );
}

export function dates$(start: number, numberOfDays: number = 90): Observable<number> {
  const startDate = new Date(start);

  return range(0, numberOfDays).pipe(
    map((currentDayNo: number) => {
      const todayDate = new Date(startDate);
      todayDate.setDate(startDate.getDate() + currentDayNo);

      return todayDate.getTime();
    }),
    share(),
  );
}

export function daysInMonth(moment: number): number {
  const now = new Date(moment);
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export function monthKey(moment: number): string {
  return new Date(moment).toISOString().slice(0, 7);
}

export function dateKey(moment: number): string {
  return new Date(moment).toISOString().slice(0, 10);
}
