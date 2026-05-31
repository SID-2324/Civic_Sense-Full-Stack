$base = $env:API_BASE
if ([string]::IsNullOrWhiteSpace($base)) {
	$base = 'http://localhost:3001'
}

# Demo user id (UUID) - override via API_DEMO_ID env var if desired
$demoId = $env:API_DEMO_ID
if ([string]::IsNullOrWhiteSpace($demoId)) { $demoId = '9764b712-eaf7-4836-895f-d5a4348b2bb5' }

Write-Host "Health check:`n"
Invoke-RestMethod -Uri "$base/health"

Write-Host "Using demo id: $demoId`n"

Write-Host "`nExposure assessment:`n"
Invoke-RestMethod -Method Post -Uri "$base/api/assessments/exposure" -Headers @{ 'x-demo-user-id'=$demoId; 'Content-Type'='application/json' } -Body (@{ publicInstagram = $true; locationSharing = $false } | ConvertTo-Json)

Write-Host "`nActivate emergency:`n"
Invoke-RestMethod -Method Post -Uri "$base/api/emergency/activate" -Headers @{ 'x-demo-user-id'=$demoId; 'Content-Type'='application/json' } -Body (@{ reason='Threat received'; exposureAnswers=@{ publicInstagram=$true }; threatAnswers=@{ directThreats=$true } } | ConvertTo-Json)

Write-Host "`nList evidence:`n"
Invoke-RestMethod -Uri "$base/api/evidence" -Headers @{ 'x-demo-user-id'=$demoId }

Write-Host "`nList audit logs:`n"
Invoke-RestMethod -Uri "$base/api/audit" -Headers @{ 'x-demo-user-id'=$demoId }

Write-Host "`nNote: to test file upload, use the curl multipart example in the README."

Write-Host "`n--- Additional smoke checks ---`n"
Write-Host "GET /api/civicvault/dashboard:`n"
Invoke-RestMethod -Uri "$base/api/civicvault/dashboard" -Headers @{ 'x-demo-user-id'=$demoId } | ConvertTo-Json -Depth 4

Write-Host "`nGET /api/social:`n"
Invoke-RestMethod -Uri "$base/api/civicvault/social" -Headers @{ 'x-demo-user-id'=$demoId } | ConvertTo-Json -Depth 4

Write-Host "`nGET /api/admin/citizens (admin role):`n"
Invoke-RestMethod -Uri "$base/api/admin/citizens" -Headers @{ 'x-demo-user-id'=$demoId; 'x-demo-role'='admin' } | ConvertTo-Json -Depth 4

Write-Host "`nPOST /api/admin/requests (admin create):`n"
$body = @{ citizen_id = '9764b712-eaf7-4836-895f-d5a4348b2bb5'; note = 'smoke-test request' } | ConvertTo-Json
$body = @{ targetUserId = '9764b712-eaf7-4836-895f-d5a4348b2bb5'; officerName = 'Smoke Tester'; reason = 'smoke test'; caseId = 'SMOKE-001' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/admin/requests" -Headers @{ 'x-demo-user-id'=$demoId; 'x-demo-role'='admin'; 'Content-Type'='application/json' } -Body $body | ConvertTo-Json -Depth 4
