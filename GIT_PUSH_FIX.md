# Git Push Fix - Large File Removal

## Problem
GitHub is rejecting the push because `.local/state/replit/log-query.db` (129.68 MB) exceeds the 100 MB file size limit.

## Why This Happens
- The file was accidentally committed to Git history
- Even after deleting it, the file still exists in previous commits
- GitHub checks ALL commits in history, not just the current state

## Solution Options

### Option 1: Automated Script (RECOMMENDED)

**Important:** Run this OUTSIDE of Qoder/sandbox environment!

```powershell
# Close Qoder first, then open regular PowerShell
cd "f:\Bizilcore\bizilcore 5"
.\fix-git-push.ps1
```

This script will:
1. Use `git-filter-repo` to remove the file from ALL history
2. Force push to GitHub

### Option 2: Manual Reset (QUICK)

If Option 1 doesn't work, reset to a clean commit:

```powershell
# Close Qoder first, then open regular PowerShell
cd "f:\Bizilcore\bizilcore 5"

# Reset to commit before large file was added
git reset --hard a4b858d

# Verify .gitignore has .local/
cat .gitignore | Select-String ".local"

# Force push to GitHub
git push --force origin main
```

**Warning:** This will undo commits after `a4b858d`. Review what you'll lose:
```powershell
git log a4b858d..HEAD --oneline
```

### Option 3: Fresh Clone (NUCLEAR OPTION)

If nothing else works:

```powershell
# Backup your work first!
cd "f:\Bizilcore"

# Clone without history
git clone --depth 1 https://github.com/tscmdabdurrakib/bizilcore.git bizilcore-clean

# Copy important files manually (exclude .local/)
cd bizilcore-clean

# Add remote if needed
git remote add origin https://github.com/tscmdabdurrakib/bizilcore.git

# Make a new commit with current state
git add .
git commit -m "Fresh start without large files"

# Force push
git push --force origin main
```

## Verification

After fixing, verify the file is gone:

```powershell
# Check file is not in git
git ls-files .local/state/replit/log-query.db
# Should return nothing

# Check file size in history
git rev-list --objects --all | Select-String "log-query.db"
# Should return nothing

# Verify .gitignore has .local/
cat .gitignore | Select-String ".local"
```

## Prevention

The `.gitignore` file has been updated to exclude:
- `.local/`
- `.agents/`
- `.qoder/`
- `.qodo/`

These directories contain local state files and should never be committed.

## Common Errors

### "sandbox blocks Git operations"
The Qoder sandbox prevents Git history rewriting. Always run cleanup scripts outside the sandbox.

### "remote: GH001: Large files detected"
The file still exists in Git history. You need to rewrite history (Option 1) or reset (Option 2).

### "failed to push some refs"
GitHub rejected the push. Check for large files in history using:
```powershell
git rev-list --objects --all | Where-Object { $_ -match "[0-9a-f]{40}" }
```

## Need Help?

If none of these work:
1. Check which commits contain the file: `git log --all --oneline -- .local/state/replit/log-query.db`
2. Find a clean commit to reset to
3. Consider creating a fresh repository and re-pushing

## Contact

For assistance, share your screen showing:
1. Output of: `git log --oneline -20`
2. Output of: `git status`
3. The exact error message from GitHub
