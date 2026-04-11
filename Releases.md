# Releases

This document outlines the process for creating and publishing a release of the module using GitHub and the configured CI pipeline.

---

## Overview

Releases are created by:

1. Committing and pushing changes to the repository
2. Creating a version tag (e.g., `v0.1.0`)
3. Pushing the tag to GitHub
4. Allowing GitHub Actions to build and publish release assets
5. Using the generated `module.json` as a Foundry install manifest

---

## Versioning

This project uses semantic versioning:

* `v0.1.0` → initial release
* `v0.2.0` → new features
* `v0.2.1` → bug fixes

Format:

```
vMAJOR.MINOR.PATCH
```

---

## Creating a Release

### 1. Commit and Push Changes

Ensure all changes are committed and pushed:

```sh
git add .
git commit -m "Prepare release v0.1.0"
git push origin main
```

---

### 2. Create a Tag

Create a version tag:

```
git tag v0.1.0
```

---

### 3. Push the Tag

Push the tag to GitHub:

```sh
git push origin v0.1.0
```

---

### 4. GitHub Actions Runs Automatically

After pushing the tag:

* Go to the **Actions** tab in GitHub
* Locate the workflow triggered by the tag
* Wait for it to complete successfully

The pipeline should:

* Build the project
* Package the module
* Create a GitHub release
* Upload:

  * `module.json`
  * `module.zip`

---

### 5. Verify the Release

Go to:

```
Repository → Releases
```

Confirm:

* A release named `v0.1.0` exists
* Assets are present:

  * `module.json`
  * `module.zip`

---

## Installing via Manifest URL

### Latest Release (Recommended for Testing)

```
https://github.com/<USER>/<REPO>/releases/latest/download/module.json
```

### Specific Version (Recommended for Distribution)

```
https://github.com/<USER>/<REPO>/releases/download/v0.1.0/module.json
```

---

## Installing in Foundry

1. Open Foundry Setup
2. Go to **Add-on Modules**
3. Click **Install Module**
4. Paste the manifest URL
5. Click **Install**

---

## Updating the Module

To release a new version:

```
git add .
git commit -m "Release v0.2.0"
git push origin main

git tag v0.2.0
git push origin v0.2.0
```

Then repeat the verification steps.

---

## Troubleshooting

### Workflow did not run

* Ensure `.github/workflows/` exists in the repo
* Ensure the workflow is configured to trigger on tag pushes

### No release created

* Some workflows require manually creating a release
* If needed:

  * Go to **Releases**
  * Click **Draft new release**
  * Select the tag
  * Publish

### Missing assets

* Check the Actions logs for errors
* Ensure build output paths match workflow expectations

---

## Notes

* The `module.json` file is the entry point for Foundry installation
* The `module.zip` is the packaged module
* The `/latest/` manifest URL always points to the newest release
* Use version-specific URLs for stable distribution

---

## First Release Checklist

* [ ] Code is pushed to GitHub
* [ ] Workflow file is present
* [ ] Tag created and pushed
* [ ] GitHub Actions completed successfully
* [ ] Release contains `module.json` and `module.zip`
* [ ] Module installs successfully via manifest
* [ ] Module loads without errors in Foundry
