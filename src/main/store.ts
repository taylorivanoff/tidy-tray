import Store from 'electron-store';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export interface WindowBounds {
  width: number;
  height: number;
  x?: number;
  y?: number;
}

type StoreSchema = AppSettings & { windowBounds?: WindowBounds };

const store = new Store<StoreSchema>({
  defaults: DEFAULT_SETTINGS as StoreSchema,
});

export function getSettings(): AppSettings {
  return store.store as AppSettings;
}

export function setSettings(settings: Partial<AppSettings>): void {
  store.set(settings as Partial<StoreSchema>);
}

export function getWindowBounds(): WindowBounds | undefined {
  return store.get('windowBounds') as WindowBounds | undefined;
}

export function setWindowBounds(bounds: WindowBounds): void {
  store.set('windowBounds', bounds);
}
