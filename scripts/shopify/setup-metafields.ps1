# Setup Homepage Metafields via Shopify Admin API (PowerShell)
# Run: .\scripts\shopify\setup-metafields.ps1

Write-Host "🚀 Setting up homepage metafields..." -ForegroundColor Cyan
Write-Host ""

# Check environment variables
$SHOP = $env:SHOPIFY_SHOP
if (-not $SHOP) { $SHOP = $env:NEXT_PUBLIC_SHOPIFY_SHOP }

$ACCESS_TOKEN = $env:SHOPIFY_ADMIN_ACCESS_TOKEN

if (-not $SHOP -or -not $ACCESS_TOKEN) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    Write-Host "   - SHOPIFY_SHOP (e.g., your-store.myshopify.com)" -ForegroundColor Yellow
    Write-Host "   - SHOPIFY_ADMIN_ACCESS_TOKEN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Add these to your .env file or set as environment variables" -ForegroundColor Yellow
    exit 1
}

Write-Host "Shop: $SHOP" -ForegroundColor Green
Write-Host ""

# Run the Node.js script
Write-Host "Running setup script..." -ForegroundColor Cyan
node scripts/shopify/setup-metafields.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Setup failed. Check the errors above." -ForegroundColor Red
    exit 1
}
