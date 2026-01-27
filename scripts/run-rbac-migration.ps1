# RBAC Migration Runner Script
# This script applies the fixed RBAC migration to your Supabase database

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RBAC System Migration - Fixed Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    Write-Host "Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}

# Check if Supabase is running
Write-Host "Checking if Supabase is running..." -ForegroundColor Yellow
$supabaseStatus = supabase status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Supabase is not running" -ForegroundColor Red
    Write-Host "Starting Supabase..." -ForegroundColor Yellow
    supabase start
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to start Supabase" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Supabase started successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Supabase is running" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Applying RBAC Migration..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if the fixed migration file exists
$migrationFile = "scripts\apply-rbac-migrations-fixed.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "✗ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Reading migration file: $migrationFile" -ForegroundColor Yellow

# Apply the migration
try {
    Get-Content $migrationFile | supabase db execute
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✓ Migration Applied Successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Next Steps:" -ForegroundColor Cyan
        Write-Host "1. Open Supabase Studio: http://localhost:54323" -ForegroundColor White
        Write-Host "2. Verify the migration in SQL Editor:" -ForegroundColor White
        Write-Host "   SELECT role, COUNT(*) FROM public.user_roles GROUP BY role;" -ForegroundColor Gray
        Write-Host "3. Check JWT hook is enabled in supabase/config.toml" -ForegroundColor White
        Write-Host "4. Test login and verify JWT contains user_roles claim" -ForegroundColor White
        Write-Host "5. See docs/RBAC_MIGRATION_FIX.md for verification steps" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "✗ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Check Supabase logs: supabase logs" -ForegroundColor White
        Write-Host "2. Check database logs: supabase db logs" -ForegroundColor White
        Write-Host "3. See docs/RBAC_MIGRATION_FIX.md for common issues" -ForegroundColor White
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ Error applying migration: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Optional: Run verification queries
Write-Host ""
$verify = Read-Host "Would you like to verify the migration? (y/n)"
if ($verify -eq 'y' -or $verify -eq 'Y') {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Verification Results" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Role Distribution:" -ForegroundColor Yellow
    "SELECT role, COUNT(*) as count FROM public.user_roles GROUP BY role ORDER BY role;" | supabase db execute
    
    Write-Host ""
    Write-Host "Functions Created:" -ForegroundColor Yellow
    "SELECT proname as function_name FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('has_role', 'has_permission', 'jwt_vendor_id', 'custom_access_token') ORDER BY proname;" | supabase db execute
    
    Write-Host ""
    Write-Host "Tables Created:" -ForegroundColor Yellow
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('user_roles', 'role_permissions', 'user_permission_overrides', 'user_role_audit_log') ORDER BY table_name;" | supabase db execute
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Green
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
