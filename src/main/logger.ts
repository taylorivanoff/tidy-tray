const MAX_ENTRIES = 1000;

export interface LogEntry {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

const entries: LogEntry[] = [];
let onNewEntry: ((entry: LogEntry) => void) | null = null;

function timestamp(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function addLog(level: LogEntry['level'], message: string): void {
  const entry: LogEntry = { time: timestamp(), level, message };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  onNewEntry?.(entry);
}

export function getLogs(): LogEntry[] {
  return [...entries];
}

export function setOnNewEntry(cb: ((entry: LogEntry) => void) | null): void {
  onNewEntry = cb;
}
