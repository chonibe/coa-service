@echo off
REM Simple script to apply Polaris updates migration
REM Run this in PowerShell or copy the SQL manually to Supabase dashboard

echo ============================================
echo Polaris Updates Migration
echo ============================================
echo.
echo OPTION 1: Copy and paste this SQL into Supabase Dashboard
echo Go to: https://supabase.com/dashboard/project/YOUR-PROJECT-ID/sql
echo.
echo OPTION 2: Use this command (if you have DATABASE_URL set):
echo psql %DATABASE_URL% -f supabase/migrations/20260125_create_polaris_updates_table.sql
echo.
echo OPTION 3: The SQL is ready in:
echo %~dp0..\supabase\migrations\20260125_create_polaris_updates_table.sql
echo.
echo ============================================
echo.
pause

type "%~dp0..\supabase\migrations\20260125_create_polaris_updates_table.sql"
