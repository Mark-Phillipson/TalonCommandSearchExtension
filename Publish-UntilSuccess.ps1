# Publish-UntilSuccess.ps1
$logFile = "publish-log.txt"
$patFile = "publish-secret.txt"

function Write-Log {
    param([string]$message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $entry = "$timestamp - $message"
    Write-Host $entry
    Add-Content -Path $logFile -Value $entry
}

# Read PAT from file
if (!(Test-Path $patFile)) {
    Write-Log "PAT file not found: $patFile"
    exit 1
}
$pat = Get-Content $patFile | Select-Object -First 1

# Set VSCE_TOKEN environment variable for this session
$env:VSCE_TOKEN = $pat

Write-Log "Starting publish loop..."

while ($true) {
    Write-Log "Attempting to publish extension..."
    vsce publish
    $exitCode = $LASTEXITCODE
    if ($exitCode -eq 0) {
        Write-Log "Publish succeeded!"
        [System.Windows.Forms.MessageBox]::Show("VSCE Publish Succeeded!", "Publish Notification")
        break
    } else {
        Write-Log "Publish failed (exit code $exitCode). Retrying in 60 seconds..."
        Start-Sleep -Seconds 60
    }
}