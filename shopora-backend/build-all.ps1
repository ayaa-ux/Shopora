$services = @(
    "auth-service",
    "catalog-service",
    "groupbuying-service",
    "ai-assistant-service",
    "api-gateway"
)

$results = @{}

foreach ($service in $services) {
    Write-Host "`n=== Compilation de $service ===" -ForegroundColor Cyan
    Push-Location $service
    mvnd clean package -DskipTests
    if ($LASTEXITCODE -eq 0) {
        $results[$service] = "OK"
    } else {
        $results[$service] = "ECHEC"
    }
    Pop-Location
}

Write-Host "`n=== Resume final ===" -ForegroundColor Yellow
foreach ($service in $services) {
    $status = $results[$service]
    if ($status -eq "OK") {
        Write-Host "$service : OK" -ForegroundColor Green
    } else {
        Write-Host "$service : ECHEC - voir les logs ci-dessus" -ForegroundColor Red
    }
}