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

export function clearProcessedRecords(): void {
  store.set(KEY, []);
}
