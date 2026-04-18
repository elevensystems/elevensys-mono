import { create } from 'jsondiffpatch';
import type { Delta } from 'jsondiffpatch';
import { format as formatHtml } from 'jsondiffpatch/formatters/html';

export type JsonPath = Array<string | number>;

export interface DiffPaths {
  added: JsonPath[];
  removed: JsonPath[];
  modified: JsonPath[];
}

export interface DiffResult {
  delta: Delta | undefined;
  paths: DiffPaths;
}

const diffPatcher = create({
  arrays: {
    detectMove: true,
    includeValueOnMove: false,
  },
});

const createEmptyPaths = (): DiffPaths => ({
  added: [],
  removed: [],
  modified: [],
});

const isArrayDelta = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value && typeof value === 'object' && '_t' in value);
};

const collectDeltaPaths = (
  delta: unknown,
  currentPath: JsonPath,
  result: DiffPaths
) => {
  if (!delta || typeof delta !== 'object') {
    return;
  }

  const deltaRecord = delta as Record<string, unknown>;
  const isArray = isArrayDelta(deltaRecord);

  for (const [rawKey, value] of Object.entries(deltaRecord)) {
    if (rawKey === '_t') {
      continue;
    }

    const key = isArray
      ? rawKey.startsWith('_')
        ? Number(rawKey.slice(1))
        : Number(rawKey)
      : rawKey;

    const nextPath: JsonPath = [...currentPath, key];

    if (Array.isArray(value)) {
      // jsondiffpatch leaf nodes are arrays that describe the change type.
      // [newValue] => added
      // [oldValue, newValue] => modified
      // [oldValue, 0, 0] => removed
      // [oldValue, newIndex, 3] => moved (treat as modified)
      if (value.length === 1) {
        result.added.push(nextPath);
        continue;
      }

      if (value.length === 2) {
        result.modified.push(nextPath);
        continue;
      }

      if (value.length === 3) {
        if (value[1] === 0 && value[2] === 0) {
          result.removed.push(nextPath);
          continue;
        }

        if (value[2] === 3) {
          result.modified.push(nextPath);
          continue;
        }
      }

      result.modified.push(nextPath);
      continue;
    }

    collectDeltaPaths(value, nextPath, result);
  }
};

export const computeJsonDiff = (left: unknown, right: unknown): DiffResult => {
  const delta = diffPatcher.diff(left, right) as Delta | undefined;
  const paths = createEmptyPaths();

  if (delta) {
    collectDeltaPaths(delta, [], paths);
  }

  return { delta, paths };
};

export const formatDiffHtml = (delta: Delta, left: unknown): string => {
  return (formatHtml(delta, left) ?? '') as string;
};
