// Handcrafted unified diff parser and line differ for DriftSmith code patches.
// Parses standard patch/diff output into structured hunks and side-by-side rows.

export type DiffLineType = 'add' | 'delete' | 'context' | 'header';

export interface DiffLine {
  type: DiffLineType;
  text: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface ParsedDiff {
  oldPath: string;
  newPath: string;
  hunks: DiffHunk[];
  raw: string;
}

export interface SideBySideRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

/**
 * Parses unified diff text into structured hunks and lines.
 */
export function parseUnifiedDiff(diffText: string): ParsedDiff {
  const result: ParsedDiff = {
    oldPath: '',
    newPath: '',
    hunks: [],
    raw: diffText,
  };

  if (!diffText || diffText.trim() === '') {
    return result;
  }

  const lines = diffText.split('\n');
  let currentHunk: DiffHunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (const line of lines) {
    if (line.startsWith('--- ')) {
      result.oldPath = line.substring(4).replace(/^[ab]\//, '').trim();
      continue;
    }
    if (line.startsWith('+++ ')) {
      result.newPath = line.substring(4).replace(/^[ab]\//, '').trim();
      continue;
    }
    if (line.startsWith('diff --git') || line.startsWith('index ')) {
      // Git metadata lines
      continue;
    }

    // Hunk header: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
    if (hunkMatch) {
      if (currentHunk) {
        result.hunks.push(currentHunk);
      }
      oldLineNum = parseInt(hunkMatch[1], 10);
      const oldCount = hunkMatch[2] !== undefined ? parseInt(hunkMatch[2], 10) : 1;
      newLineNum = parseInt(hunkMatch[3], 10);
      const newCount = hunkMatch[4] !== undefined ? parseInt(hunkMatch[4], 10) : 1;

      currentHunk = {
        header: line,
        oldStart: oldLineNum,
        oldCount,
        newStart: newLineNum,
        newCount,
        lines: [],
      };
      continue;
    }

    if (!currentHunk) {
      // Header or preamble lines outside a hunk
      continue;
    }

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'add',
        text: line.substring(1),
        oldLineNumber: null,
        newLineNumber: newLineNum++,
      });
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'delete',
        text: line.substring(1),
        oldLineNumber: oldLineNum++,
        newLineNumber: null,
      });
    } else {
      // Context line (starts with space or empty)
      const text = line.startsWith(' ') ? line.substring(1) : line;
      currentHunk.lines.push({
        type: 'context',
        text,
        oldLineNumber: oldLineNum++,
        newLineNumber: newLineNum++,
      });
    }
  }

  if (currentHunk) {
    result.hunks.push(currentHunk);
  }

  return result;
}

/**
 * Transforms hunk lines into aligned side-by-side rows for split diff views.
 */
export function buildSideBySideRows(hunk: DiffHunk): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  const lines = hunk.lines;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'context') {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }

    if (line.type === 'delete') {
      // Collect sequential deletes
      const deletes: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'delete') {
        deletes.push(lines[i]);
        i++;
      }
      // Collect subsequent adds
      const adds: DiffLine[] = [];
      while (i < lines.length && lines[i].type === 'add') {
        adds.push(lines[i]);
        i++;
      }

      const maxLen = Math.max(deletes.length, adds.length);
      for (let j = 0; j < maxLen; j++) {
        rows.push({
          left: deletes[j] || null,
          right: adds[j] || null,
        });
      }
      continue;
    }

    if (line.type === 'add') {
      rows.push({ left: null, right: line });
      i++;
      continue;
    }

    i++;
  }

  return rows;
}
