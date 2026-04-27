# deploy.ps1 — Push GitHub + Deploy Vercel en une commande
# Usage : .\deploy.ps1 "mon message de commit"

param(
    [string]$message = "chore : mise a jour"
)

Write-Host "`n🚀 Déploiement de builtwithbugs..." -ForegroundColor Cyan

# 1. Git add + commit + push
Write-Host "`n📦 Git..." -ForegroundColor Yellow
git add .

$status = git status --porcelain
if ($status) {
    git commit -m $message
    git push origin main
    Write-Host "✅ Push GitHub OK" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Rien à commiter, push ignoré" -ForegroundColor Gray
}

# 2. Deploy Vercel en production
Write-Host "`n⚡ Vercel..." -ForegroundColor Yellow
vercel --prod

Write-Host "`n✅ Déploiement terminé !" -ForegroundColor Green
