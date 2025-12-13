---
description: Publish a new release with version bump and notes
---
# Publish New Release

This workflow automates the process of creating a new release.

1.  **Ask User for Inputs** (if not provided):
    -   New Version Number (e.g., v1.0.9)
    -   List of Changes (Bullet points)

2.  **Update Version Config**:
    -   Edit `src/config.ts`: Update `APP_VERSION` to the new version.

3.  **Update Release Notes**:
    -   Read `src/data/releaseNotes.ts`.
    -   Prepend the new release object to the `releaseNotes` array.
    ```typescript
    {
        version: 'v1.0.9',
        changes: [
            'Change 1',
            'Change 2'
        ]
    },
    // ... existing notes
    ```

4.  **Verify UI**:
    -   Ensure `SettingsModal` displays the new version as "GÜNCEL".

5.  **Git Operations**:
    -   `git add .`
    -   `git commit -m "chore(release): Bump version to <VERSION>"`
    -   `git push`

6.  **Notify User**:
    -   Confirm the release is live.
