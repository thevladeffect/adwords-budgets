export function randomInteger(start: number, end: number): number {
  return start + Math.floor(Math.random() * (end - start));
}

export function randomNumber(start: number, end: number): number {
  return start + Math.random() * (end - start);
}
