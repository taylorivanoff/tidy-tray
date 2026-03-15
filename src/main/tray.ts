import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'path';

let tray: Tray | null = null;

export function createTray(iconPath: string, onOpenSettings: () => void): Tray {
  const resolved = path.isAbsolute(iconPath) ? iconPath : path.join(app.getAppPath(), iconPath);
  let image = nativeImage.createFromPath(resolved);
  if (image.isEmpty()) {
    image = nativeImage.createEmpty();
  }
  tray = new Tray(image);
  tray.setToolTip('Media Renamer');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Settings', click: onOpenSettings },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
  tray.on('double-click', onOpenSettings);
  return tray;
}

export function getTray(): Tray | null {
  return tray;
}
