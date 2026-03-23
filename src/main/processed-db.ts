import Store from 'electron-store';
import type { ProcessedRecord } from '../types';

const MAX_RECORDS = 2000;
const KEY = 'processedRecords';

const store = new Store<{ [KEY]: ProcessedRecord[] }>({
  defaults: { [KEY]: [] },
});

export function addProcessedRecord(record: ProcessedRecord): void {
  const list = (store.get(KEY) as ProcessedRecord[]) || [];
  list.unshift(record);
  if (list.length > MAX_RECORDS) list.length = MAX_RECORDS;
  store.set(KEY, list);
}

export function getProcessedRecords(): ProcessedRecord[] {
  return (store.get(KEY) as ProcessedRecord[]) || [];
}

export function wasProcessed(sourcePath: string): boolean {
  const list = getProcessedRecords();
  return list.some((r) => r.sourcePath === sourcePath);
}

export function removeProcessedRecord(sourcePath: string): void {
  const list = getProcessedRecords();
  const next = list.filter((r) => r.sourcePath !== sourcePath);
  store.set(KEY, next);
}

export function removeProcessedRecords(sourcePaths: string[]): void {
  if (sourcePaths.length === 0) return;
  const set = new Set(sourcePaths);
  const list = getProcessedRecords();
  const next = list.filter((r) => !set.has(r.sourcePath));
  store.set(KEY, next);
}

export function clearProcessedRecords(): void {
  store.set(KEY, []);
}
