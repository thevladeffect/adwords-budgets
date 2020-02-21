import { resolve } from 'path';
import { parse } from 'fast-csv';
import { createReadStream } from 'fs';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Entry {
  moment: number;
  budget: number;
}

export class InputReader {

  constructor(private pathToCsv: string) {
  }

  read(): Observable<Entry> {
    const dataSubject: Subject<Entry> = new Subject<Entry>();

    createReadStream(resolve(__dirname, this.pathToCsv))
      .pipe(parse({ headers: true }))
      .on('data', ({ moment, budget }) => dataSubject.next({
        moment: Date.parse(moment),
        budget: parseInt(budget),
      }))
      .on('end', () => dataSubject.complete());

    return dataSubject.asObservable();
  }
}
