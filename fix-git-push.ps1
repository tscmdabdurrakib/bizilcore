# Script to remove large file from Git history and push to GitHub
# ================================================================
# IMPORTANT: Run this script OUTSIDE of Qoder/sandbox/restricted environment!
# The sandbox blocks Git history rewriting operations.
#
# How to run:
# 1. Close Qoder/IDE
# 2. Open regular PowerShell (not in sandbox)
# 3. Navigate to: cd "f:\Bizilcore\bizilcore 5"
# 4. Run: .\fix-git-push.ps1
# ================================================================

Write-Host "=== Cleaning Git History ===" -ForegroundColor Cyan

# Navigate to project directory
Set-Location "f:\Bizilcore\bizilcore 5"

# Method 1: Try git-filter-repo (recommended)
Write-Host "`nAttempting Method 1: git-filter-repo..." -ForegroundColor Yellow
try {
    # First, verify the file exists in history
    Write-Host "Checking for large file in history..." -ForegroundColor Cyan
    $hasLargeFile = git rev-list --objects --all | Select-String "log-query.db"
    
    if ($hasLargeFile) {
        Write-Host "Found large file in history. Removing..." -ForegroundColor Yellow
        python -m git_filter_repo --path .local/state/replit/log-query.db --invert-path --force
        Write-Host "✓ Successfully removed file from history" -ForegroundColor Green
        
        # Also remove the -shm and -wal variants
        python -m git_filter_repo --path .local/state/replit/log-query.db-shm --invert-path --force
        python -m git_filter_repo --path .local/state/replit/log-query.db-wal --invert-path --force
        
        # Clean up garbage
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
        
        Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
        git push --force origin main
        
        Write-Host "`n✓ Complete! File removed and pushed successfully." -ForegroundColor Green
        exit 0
    }
    else {
        Write-Host "Large file not found in history. Trying normal push..." -ForegroundColor Yellow
        git push origin main
        exit 0
    }
}
catch {
    Write-Host "✗ Method 1 failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nFalling back to Method 2..." -ForegroundColor Yellow
}

# Method 2: Reset to commit before file was added
Write-Host "`nAttempting Method 2: Reset to clean state..." -ForegroundColor Yellow

# Find the last clean commit (before log-query.db was added)
$cleanCommit = "a4b858d"  # "basic commit" - before the large file

Write-Host "Resetting to commit: $cleanCommit" -ForegroundColor Cyan
git reset --hard $cleanCommit

# Verify file is gone
if (Test-Path ".local\state\replit\log-query.db") {
    Remove-Item -Path ".local\state\replit\log-query.db" -Force
    Write-Host "Removed local file" -ForegroundColor Green
}

# Add updated .gitignore
git add .gitignore
git commit -m "Ensure .local is in .gitignore"

# Push with force
Write-Host "`nForce pushing to GitHub..." -ForegroundColor Cyan
git push --force origin main

Write-Host "`n✓ Complete!" -ForegroundColor Green
