import fs from 'fs/promises';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function canOpenForRead(filePath: string): Promise<boolean> {
  try {
    const fh = await fs.open(filePath, 'r');
    await fh.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait until the file is readable and its size is stable across two checks.
 * This helps avoid renaming files that are still being copied/written.
 */
export async function waitForFileReady(
  filePath: string,
  opts?: { timeoutMs?: number; intervalMs?: number }
): Promise<boolean> {
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  const intervalMs = opts?.intervalMs ?? 1_000;

  const start = Date.now();
  let prevSize: number | null = null;
  let stableReads = 0;

  while (Date.now() - start < timeoutMs) {
    const canRead = await canOpenForRead(filePath);
    if (!canRead) {
      prevSize = null;
      stableReads = 0;
      await delay(intervalMs);
      continue;
    }

    try {
      const st = await fs.stat(filePath);
      if (prevSize != null && st.size === prevSize) {
        stableReads++;
      } else {
        stableReads = 0;
      }
      prevSize = st.size;

      // Stable for 2 consecutive size checks.
      if (stableReads >= 1) return true;
    } catch {
      prevSize = null;
      stableReads = 0;
    }

    await delay(intervalMs);
  }

  return false;
}

