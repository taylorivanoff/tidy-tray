import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export type TrayMenuTemplate = Array<{
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox';
  click?: () => void;
}>;

export function createTray(
  iconPath: string,
  getMenuTemplate: () => TrayMenuTemplate,
  onDoubleClick: () => void
): Tray {
  const resolved = path.isAbsolute(iconPath) ? iconPath : path.join(app.getAppPath(), iconPath);
  let image = nativeImage.createFromPath(resolved);
  if (image.isEmpty()) {
    image = nativeImage.createEmpty();
  }
  tray = new Tray(image);
  tray.setToolTip('Tidy Tray');
  setTrayMenu(getMenuTemplate());
  tray.on('click', onDoubleClick);
  tray.on('double-click', onDoubleClick);
  return tray;
}

export function setTrayMenu(template: TrayMenuTemplate): void {
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(Menu.buildFromTemplate(template as Electron.MenuItemConstructorOptions[]));
  }
}

export function getTray(): Tray | null {
  return tray;
}

export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
}
