#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

// Parse CLI arguments into a normalized options object used by the rest of the pipeline.
function parseArgs(argv) {
  const options = {
    targetPath: '.',
    outputFile: null,
    compact: false,
    includeUntracked: false,
    includeIgnored: false,
    maxDepth: null,
    sort: 'type',
    noIcons: false,
    rootLabel: null,
    includeGlobs: [],
    excludeGlobs: [],
    filesOnly: false,
    dirsOnly: false,
    pruneEmptyDirs: false,
    stats: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--output' || arg === '-o') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --output');
      }
      options.outputFile = value;
      i += 1;
      continue;
    }

    if (arg === '--max-depth') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --max-depth');
      }

      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error('--max-depth must be an integer >= 0');
      }

      options.maxDepth = parsed;
      i += 1;
      continue;
    }

    if (arg === '--sort') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --sort');
      }

      if (value !== 'type' && value !== 'name') {
        throw new Error('--sort must be one of: type, name');
      }

      options.sort = value;
      i += 1;
      continue;
    }

    if (arg === '--root-label') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --root-label');
      }

      options.rootLabel = value;
      i += 1;
      continue;
    }

    if (arg === '--include') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --include');
      }

      options.includeGlobs.push(value);
      i += 1;
      continue;
    }

    if (arg === '--exclude') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Missing value for --exclude');
      }

      options.excludeGlobs.push(value);
      i += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--compact') {
      options.compact = true;
      continue;
    }

    if (arg === '--no-icons') {
      options.noIcons = true;
      continue;
    }

    if (arg === '--files-only') {
      options.filesOnly = true;
      continue;
    }

    if (arg === '--dirs-only') {
      options.dirsOnly = true;
      continue;
    }

    if (arg === '--prune-empty-dirs') {
      options.pruneEmptyDirs = true;
      continue;
    }

    if (arg === '--stats') {
      options.stats = true;
      continue;
    }

    if (arg === '--tracked') {
      // Tracked-only is the default, so this is a no-op for explicitness.
      continue;
    }

    if (arg === '--untracked') {
      options.includeUntracked = true;
      continue;
    }

    if (arg === '--ignored') {
      options.includeIgnored = true;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.targetPath = arg;
  }

  if (options.filesOnly && options.dirsOnly) {
    throw new Error('Cannot use --files-only and --dirs-only together');
  }

  return options;
}

function getRepoRoot() {
  // Ask Git for the canonical repository root so all path math stays consistent.
  return execFileSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
  }).trim();
}

// Run `git ls-files` with the provided flags and return clean, non-empty lines.
function runGitLsFiles(repoRoot, args) {
  const output = execFileSync('git', ['-C', repoRoot, 'ls-files', ...args], {
    encoding: 'utf8',
    // Ignored-mode can produce large output on mobile project artifacts.
    maxBuffer: 64 * 1024 * 1024,
  });

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function getVisibleFiles(repoRoot, options) {
  // Start from tracked files (the default mode).
  const files = new Set(runGitLsFiles(repoRoot, ['--cached']));

  if (options.includeUntracked) {
    // Optionally add untracked files that are not ignored.
    for (const file of runGitLsFiles(repoRoot, ['--others', '--exclude-standard'])) {
      files.add(file);
    }
  }

  if (options.includeIgnored) {
    // Optionally add ignored files as well.
    for (const file of runGitLsFiles(repoRoot, ['--others', '--ignored', '--exclude-standard'])) {
      files.add(file);
    }
  }

  // Skip entries that no longer exist on disk.
  return [...files].filter((file) => existsSync(path.join(repoRoot, file)));
}

// Escape special characters in a literal string so it can be embedded in a RegExp.
function escapeRegExp(literal) {
  return literal.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

// Convert a simple glob pattern into a RegExp for path filtering.
// Supported wildcards:
// - `*`  : any characters except '/'
// - `**` : any characters including '/'
// - `?`  : one character except '/'
function globToRegExp(globPattern) {
  const normalized = globPattern.replaceAll('\\', '/');
  let regexText = '^';

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (char === '*' && next === '*') {
      regexText += '.*';
      i += 1;
      continue;
    }

    if (char === '*') {
      regexText += '[^/]*';
      continue;
    }

    if (char === '?') {
      regexText += '[^/]';
      continue;
    }

    regexText += escapeRegExp(char);
  }

  regexText += '$';
  return new RegExp(regexText);
}

function applyGlobFilters(filePaths, includeGlobs, excludeGlobs) {
  // Compile include/exclude filters once, then apply to each path.
  const includeMatchers = includeGlobs.map(globToRegExp);
  const excludeMatchers = excludeGlobs.map(globToRegExp);

  return filePaths.filter((filePath) => {
    const normalized = filePath.replaceAll('\\', '/');

    if (includeMatchers.length > 0 && !includeMatchers.some((rx) => rx.test(normalized))) {
      return false;
    }

    if (excludeMatchers.some((rx) => rx.test(normalized))) {
      return false;
    }

    return true;
  });
}

function toRepoRelative(targetPath, repoRoot) {
  // Resolve user input to an absolute path and project it onto the repo root.
  const absoluteTarget = path.resolve(targetPath);
  const relative = path.relative(repoRoot, absoluteTarget);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Target path must be inside the current Git repository.');
  }

  return relative === '' ? '.' : relative;
}

function buildTree(filePaths, basePath, maxDepth) {
  // Internal tree node structure:
  // { dirs: Map<string, Node>, files: Set<string> }
  const root = { dirs: new Map(), files: new Set() };

  const normalizedBase = basePath === '.' ? '' : `${basePath.replaceAll('\\', '/')}/`;

  for (const filePath of filePaths) {
    const normalizedFile = filePath.replaceAll('\\', '/');

    if (normalizedBase && !normalizedFile.startsWith(normalizedBase)) {
      continue;
    }

    const relativePath = normalizedBase ? normalizedFile.slice(normalizedBase.length) : normalizedFile;

    if (!relativePath || relativePath.startsWith('../')) {
      continue;
    }

    const parts = relativePath.split('/').filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    if (maxDepth === 0) {
      // Depth 0 means "root only".
      continue;
    }

    let cursor = root;
    let truncatedAtDepth = false;

    for (let i = 0; i < parts.length - 1; i += 1) {
      const depth = i + 1;
      if (maxDepth !== null && depth > maxDepth) {
        truncatedAtDepth = true;
        break;
      }

      const segment = parts[i];
      if (!cursor.dirs.has(segment)) {
        cursor.dirs.set(segment, { dirs: new Map(), files: new Set() });
      }
      cursor = cursor.dirs.get(segment);

      if (maxDepth !== null && depth === maxDepth) {
        truncatedAtDepth = true;
        break;
      }
    }

    if (truncatedAtDepth) {
      continue;
    }

    const fileDepth = parts.length;
    if (maxDepth !== null && fileDepth > maxDepth) {
      continue;
    }

    cursor.files.add(parts[parts.length - 1]);
  }

  return root;
}

function cloneTree(node) {
  // Clone before transformations so the source tree remains reusable.
  const dirs = new Map();
  for (const [name, child] of node.dirs.entries()) {
    dirs.set(name, cloneTree(child));
  }

  return {
    dirs,
    files: new Set(node.files),
  };
}

function pruneEmptyDirs(node) {
  // Bottom-up pruning removes directories that contain neither files nor child dirs.
  for (const [name, child] of node.dirs.entries()) {
    const hasChildContent = pruneEmptyDirs(child);
    if (!hasChildContent) {
      node.dirs.delete(name);
    }
  }

  return node.dirs.size > 0 || node.files.size > 0;
}

function applyDisplayModes(node, options) {
  // Apply display flags recursively after content selection/pruning.
  for (const child of node.dirs.values()) {
    applyDisplayModes(child, options);
  }

  if (options.dirsOnly) {
    node.files.clear();
  }

  if (options.filesOnly) {
    node.dirs.clear();
  }
}

function filterTreeForModes(node, options) {
  // Two-pass transform:
  // 1) prune with full content context
  // 2) apply display-only modes (files-only / dirs-only)
  const cloned = cloneTree(node);

  if (options.pruneEmptyDirs) {
    pruneEmptyDirs(cloned);
  }

  applyDisplayModes(cloned, options);
  return cloned;
}

function collectStats(node) {
  // Count descendant directories/files (root node itself is not counted as a directory).
  let dirCount = 0;
  let fileCount = node.files.size;

  for (const child of node.dirs.values()) {
    dirCount += 1;
    const childStats = collectStats(child);
    dirCount += childStats.directories;
    fileCount += childStats.files;
  }

  return {
    directories: dirCount,
    files: fileCount,
  };
}

function compareEntries(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: 'base' });
}

function getSortedEntries(node, sortMode) {
  // `type` mode: directories first, then files.
  // `name` mode: pure alphabetical across both.
  const dirs = [...node.dirs.keys()].map((name) => ({ type: 'dir', name, node: node.dirs.get(name) }));
  const files = [...node.files].map((name) => ({ type: 'file', name }));

  if (sortMode === 'name') {
    return [...dirs, ...files].sort((a, b) => compareEntries(a.name, b.name));
  }

  return [
    ...dirs.sort((a, b) => compareEntries(a.name, b.name)),
    ...files.sort((a, b) => compareEntries(a.name, b.name)),
  ];
}

function renderBranchLines(node, renderOptions, prefix = '') {
  // Render a tree block using box-drawing characters and optional icons.
  const entries = getSortedEntries(node, renderOptions.sort);
  const lines = [];

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const isLast = i === entries.length - 1;
    const branch = isLast ? '┗' : '┣';
    const icon = renderOptions.noIcons ? '' : entry.type === 'dir' ? '📂' : '📜';

    lines.push(`${prefix} ${branch} ${icon}${entry.name}`);

    if (entry.type === 'dir') {
      const childPrefix = `${prefix} ${isLast ? '  ' : '┃'}`;
      lines.push(...renderBranchLines(entry.node, renderOptions, childPrefix));

      // Spacer row between sibling entries that preserves vertical branch guides.
      if (!renderOptions.compact && !isLast) {
        lines.push(childPrefix);
      }
    }
  }

  return lines;
}

function renderTree(rootLabel, node, renderOptions) {
  // Root label is rendered separately from branch lines.
  const children = renderBranchLines(node, renderOptions);
  return [rootLabel, ...children];
}

function printHelp() {
  // Keep usage text in one place so CLI behavior and docs stay aligned.
  const helpText = [
    'Usage: node scripts/generate-tree.mjs [path] [options]',
    '',
    'Generates a tree of files from Git file sets.',
    'Default behavior is tracked files only.',
    '',
    'Options:',
    '  --output, -o <file>  Write output to file',
    '  --compact            Disable spacer lines between sibling folder blocks',
    '  --max-depth <n>      Limit output depth (0 = root only)',
    '  --sort <mode>        Sort mode: type (default) or name',
    '  --no-icons           Disable folder/file/root icons',
    '  --root-label <text>  Override root label text',
    '  --include <glob>     Include only paths matching glob (repeatable)',
    '  --exclude <glob>     Exclude paths matching glob (repeatable)',
    '  --files-only         Show files only (no directories)',
    '  --dirs-only          Show directories only (no files)',
    '  --prune-empty-dirs   Remove empty directories from output',
    '  --stats              Show directory/file totals at the end',
    '  --tracked            Tracked files only (default)',
    '  --untracked          Include untracked, non-ignored files',
    '  --ignored            Include ignored files',
    '  --help, -h           Show help',
    '',
    'Examples:',
    '  node scripts/generate-tree.mjs',
    '  node scripts/generate-tree.mjs . --max-depth 3 --no-icons',
    '  node scripts/generate-tree.mjs client --untracked --exclude "**/*.png"',
    '  node scripts/generate-tree.mjs . --dirs-only --prune-empty-dirs',
    '  node scripts/generate-tree.mjs . --ignored --output tree',
  ].join('\n');

  process.stdout.write(`${helpText}\n`);
}

async function main() {
  try {
    // 1) Parse options
    const options = parseArgs(process.argv.slice(2));

    if (options.help) {
      printHelp();
      return;
    }

    // 2) Resolve paths and collect candidate files from Git
    const repoRoot = getRepoRoot();
    const basePath = toRepoRelative(path.resolve(options.targetPath), repoRoot);
    const visibleFiles = getVisibleFiles(repoRoot, options);

    // 3) Apply include/exclude filters and build the in-memory tree
    const filteredFiles = applyGlobFilters(visibleFiles, options.includeGlobs, options.excludeGlobs);
    const tree = buildTree(filteredFiles, basePath, options.maxDepth);

    // 4) Apply presentation-related tree transforms
    const displayTree = filterTreeForModes(tree, options);

    const rootName = basePath === '.' ? path.basename(repoRoot) : path.basename(basePath);
    const defaultRootIcon = basePath === '.' ? '📦' : '📂';
    const rootPrefix = options.noIcons ? '' : defaultRootIcon;
    const resolvedRootLabel = options.rootLabel ?? rootName;
    // 5) Render output text
    const output = renderTree(`${rootPrefix}${resolvedRootLabel}`, displayTree, {
      compact: options.compact,
      noIcons: options.noIcons,
      sort: options.sort,
    }).join('\n');

    let finalOutput = output;
    if (options.stats) {
      // Append summary counts at the end when requested.
      const stats = collectStats(displayTree);
      finalOutput = [output, '', `Stats: ${stats.directories} directories, ${stats.files} files`].join('\n');
    }

    if (options.outputFile) {
      // Write to file and exit early when an output path is supplied.
      const fs = await import('node:fs/promises');
      await fs.writeFile(path.resolve(options.outputFile), `${finalOutput}\n`, 'utf8');
      return;
    }

    process.stdout.write(finalOutput.length > 0 ? `${finalOutput}\n` : '');
  } catch (error) {
    // Keep CLI errors readable and non-verbose by default.
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
  }
}

main();
