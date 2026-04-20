#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import stripJsonComments from 'strip-json-comments';

const modulePath = path.resolve('module.jsonc');
const packagePath = path.resolve('package.json');

const rl = createInterface({ input, output });

function run(command, options = {}) {
  return execSync(command, {
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  }).trim();
}

function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatSemver(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function bumpVersion(currentVersion, bumpType) {
  const parsed = parseSemver(currentVersion);

  switch (bumpType) {
    case 'patch':
      return formatSemver({ ...parsed, patch: parsed.patch + 1 });
    case 'minor':
      return formatSemver({ ...parsed, minor: parsed.minor + 1, patch: 0 });
    case 'major':
      return formatSemver({ major: parsed.major + 1, minor: 0, patch: 0 });
    default:
      throw new Error(`Unsupported bump type: ${bumpType}`);
  }
}

function parseRemote(remoteUrl) {
  const sshMatch = /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/.exec(remoteUrl);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = /^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/.exec(remoteUrl);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}

async function askYesNo(prompt, defaultValue = true) {
  const suffix = defaultValue ? '[Y/n]' : '[y/N]';
  const answer = (await rl.question(`${prompt} ${suffix}: `)).trim().toLowerCase();

  if (!answer) {
    return defaultValue;
  }

  return answer === 'y' || answer === 'yes';
}

async function askRequired(prompt, defaultValue = '') {
  const text = defaultValue ? `${prompt} (${defaultValue}): ` : `${prompt}: `;

  while (true) {
    const answer = (await rl.question(text)).trim();
    if (answer) {
      return answer;
    }
    if (defaultValue) {
      return defaultValue;
    }
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function escapeJsonString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function replaceTopLevelStringProperty(source, key, value) {
  const matcher = new RegExp(`(^\\s*"${key}"\\s*:\\s*")([^"\\\\]|\\\\.)*("\\s*,?\\s*$)`, 'm');
  if (!matcher.test(source)) {
    throw new Error(`Could not find top-level "${key}" in module.jsonc`);
  }

  return source.replace(matcher, `$1${escapeJsonString(value)}$3`);
}

function printHeader(title) {
  console.log(`\n=== ${title} ===`);
}

async function main() {
  try {
    const moduleJsonSource = fs.readFileSync(modulePath, 'utf8');
    const moduleJson = JSON.parse(stripJsonComments(moduleJsonSource));
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    printHeader('Interactive Release Creator');

    const status = run('git status --porcelain');
    if (status) {
      console.log('Working tree has uncommitted changes.');
      const continueDirty = await askYesNo('Continue anyway?', false);
      if (!continueDirty) {
        console.log('Aborting release creation.');
        return;
      }
    }

    const currentVersion = moduleJson.version;
    parseSemver(currentVersion);

    printHeader('Version Selection');
    console.log(`Current version: ${currentVersion}`);
    console.log('Choose bump type: patch, minor, major, custom');

    let bumpType = await askRequired('Bump type', 'patch');
    bumpType = bumpType.toLowerCase();

    let nextVersion = '';
    if (['patch', 'minor', 'major'].includes(bumpType)) {
      nextVersion = bumpVersion(currentVersion, bumpType);
    } else {
      nextVersion = await askRequired('Enter explicit version (MAJOR.MINOR.PATCH)');
      parseSemver(nextVersion);
    }

    const tagName = `v${nextVersion}`;
    const currentBranch = run('git rev-parse --abbrev-ref HEAD');

    let tagExists = false;
    try {
      run(`git rev-parse --verify refs/tags/${tagName}`);
      tagExists = true;
    } catch {
      tagExists = false;
    }

    if (tagExists) {
      throw new Error(`Tag ${tagName} already exists.`);
    }
    console.log(`Next version: ${nextVersion}`);
    console.log(`Tag to create: ${tagName}`);

    if (!(await askYesNo('Proceed with this release version?', true))) {
      console.log('Aborting release creation.');
      return;
    }

    printHeader('Repository Metadata');

    let owner = '';
    let repo = '';

    const moduleUrl = moduleJson.url;
    const moduleUrlMatch = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/.exec(moduleUrl || '');
    if (moduleUrlMatch && !moduleUrl.includes('YOUR_GITHUB_NAME')) {
      owner = moduleUrlMatch[1];
      repo = moduleUrlMatch[2];
    } else {
      let remote = '';
      try {
        remote = run('git config --get remote.origin.url');
      } catch {
        remote = '';
      }

      const parsedRemote = remote ? parseRemote(remote) : null;
      if (parsedRemote) {
        owner = parsedRemote.owner;
        repo = parsedRemote.repo;
      }
    }

    owner = await askRequired('GitHub owner', owner || 'jeremyglebe');
    repo = await askRequired('GitHub repository', repo || 'wfrp4e-species-builder');

    const repoBaseUrl = `https://github.com/${owner}/${repo}`;
    moduleJson.version = nextVersion;
    moduleJson.url = repoBaseUrl;
    moduleJson.manifest = `${repoBaseUrl}/releases/latest/download/module.json`;
    moduleJson.download = `${repoBaseUrl}/releases/latest/download/module.zip`;

    const syncPackageVersion = await askYesNo(
      'Sync package.json version to match module.json version?',
      true,
    );
    if (syncPackageVersion) {
      packageJson.version = nextVersion;
    }

    let nextModuleJsonc = moduleJsonSource;
    nextModuleJsonc = replaceTopLevelStringProperty(nextModuleJsonc, 'version', moduleJson.version);
    nextModuleJsonc = replaceTopLevelStringProperty(nextModuleJsonc, 'url', moduleJson.url);
    nextModuleJsonc = replaceTopLevelStringProperty(
      nextModuleJsonc,
      'manifest',
      moduleJson.manifest,
    );
    nextModuleJsonc = replaceTopLevelStringProperty(
      nextModuleJsonc,
      'download',
      moduleJson.download,
    );
    fs.writeFileSync(modulePath, nextModuleJsonc, 'utf8');

    if (syncPackageVersion) {
      writeJson(packagePath, packageJson);
    }

    printHeader('Optional Validation');
    const runBuild = await askYesNo('Run npm run build now?', true);
    if (runBuild) {
      console.log('Running npm run build...');
      execSync('npm run build', { stdio: 'inherit' });
    }

    printHeader('Git Operations');
    const createGitCommit = await askYesNo('Create commit and git tag now?', true);
    if (createGitCommit) {
      const filesToAdd = ['module.jsonc'];
      if (syncPackageVersion) {
        filesToAdd.push('package.json');
      }

      execSync(`git add ${filesToAdd.join(' ')}`, { stdio: 'inherit' });

      const commitMessage = await askRequired('Commit message', `Release ${tagName}`);
      execSync(`git commit -m "${commitMessage.replaceAll('"', '\\"')}"`, {
        stdio: 'inherit',
      });

      execSync(`git tag ${tagName}`, { stdio: 'inherit' });

      const pushNow = await askYesNo('Push commit and tag to origin now?', true);
      if (pushNow) {
        execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
        execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
      }
    }

    printHeader('Release Summary');
    console.log(`Updated module.jsonc to version ${nextVersion}`);
    console.log(`Release tag: ${tagName}`);
    console.log(`Repository: ${repoBaseUrl}`);
    console.log('Done.');
  } catch (error) {
    console.error('Release script failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

await main();
