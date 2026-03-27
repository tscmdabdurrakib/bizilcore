# Quick fix - Reset to clean commit and force push
# ================================================================
# IMPORTANT: Run this OUTSIDE of Qoder/sandbox/restricted environment!
#
# How to run:
# 1. Close Qoder/IDE
# 2. Open regular PowerShell
# 3. Navigate to: cd "f:\Bizilcore\bizilcore 5"
# 4. Run: .\quick-git-fix.ps1
# ================================================================

Set-Location "f:\Bizilcore\bizilcore 5"

Write-Host "=== Quick Git Fix ===" -ForegroundColor Cyan
Write-Host "Resetting to clean commit (before large file was added)..." -ForegroundColor Yellow

# Reset to commit before log-query.db was in history
git reset --hard a4b858d

# Verify .gitignore is correct
git add .gitignore
git status

Write-Host "`n=== Current Status ===" -ForegroundColor Cyan
git log --oneline -5

Write-Host "`n=== Next Steps ===" -ForegroundColor Yellow
Write-Host "Run this command to push to GitHub:" -ForegroundColor White
Write-Host "git push --force origin main" -ForegroundColor Green
