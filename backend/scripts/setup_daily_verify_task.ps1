# Runs daily zero-mismatch verification at 6:00 AM
# Right-click → Run with PowerShell (as Administrator for first-time setup)

$TaskName = "ClothERP-DailyZeroMismatch"
$BackendPath = Split-Path -Parent $PSScriptRoot
$NodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$ScriptPath = Join-Path $BackendPath "scripts\daily_zero_mismatch_cron.js"
$LogDir = Join-Path $BackendPath "logs"
$LogFile = Join-Path $LogDir "daily-zero-mismatch.log"

if (-not $NodePath) {
    Write-Error "Node.js not found in PATH. Install Node.js first."
    exit 1
}

if (-not (Test-Path $ScriptPath)) {
    Write-Error "Script not found: $ScriptPath"
    exit 1
}

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$Action = New-ScheduledTaskAction -Execute $NodePath -Argument "`"$ScriptPath`"" -WorkingDirectory $BackendPath
$Trigger = New-ScheduledTaskTrigger -Daily -At "06:00AM"
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Force | Out-Null

Write-Host "Scheduled task created: $TaskName"
Write-Host "Runs daily at 6:00 AM"
Write-Host "Script: $ScriptPath"
Write-Host "Logs append to: $LogFile"
Write-Host ""
Write-Host "Test now:"
Write-Host "  cd `"$BackendPath`""
Write-Host "  node scripts\daily_zero_mismatch_cron.js"
Write-Host ""
Write-Host "Optional .env settings:"
Write-Host "  DAILY_ZERO_MISMATCH_CRON=true"
Write-Host "  DAILY_ZERO_MISMATCH_TIME=06:00"
Write-Host "  ZERO_MISMATCH_ALERT_WEBHOOK=https://hooks.slack.com/..."
