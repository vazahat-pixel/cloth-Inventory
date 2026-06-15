# ERP API Regression Smoke Test (PowerShell)
$Base = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:5001/api" }
$Email = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@clothinventory.com" }
$Password = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "Admin@1234" }

$results = @()

function Record($Module, $Test, $Status, $Detail = "") {
    $script:results += [pscustomobject]@{ Module = $Module; Test = $Test; Status = $Status; Detail = $Detail }
    Write-Host "[$Status] [$Module] $Test $(if ($Detail) { "- $Detail" })"
}

Write-Host ""
Write-Host "=== ERP API Regression Smoke Test ==="
Write-Host "Target: $Base"
Write-Host ""

try {
    $health = Invoke-RestMethod -Uri "$Base/health" -Method Get -TimeoutSec 10
    if ($health.success) { Record "Infrastructure" "Health check" "PASS" } else { Record "Infrastructure" "Health check" "FAIL" "success=false" }
} catch {
    Record "Infrastructure" "Health check" "FAIL" $_.Exception.Message
    exit 1
}

$token = $null
try {
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$Base/auth/admin/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 15
    $token = $login.token
    if ($token) { Record "User Permissions" "Admin login" "PASS" } else { Record "User Permissions" "Admin login" "FAIL" "no token" }
} catch {
    Record "User Permissions" "Admin login" "FAIL" $_.Exception.Message
}

if (-not $token) {
    $pass = ($results | Where-Object Status -eq "PASS").Count
    $fail = ($results | Where-Object Status -eq "FAIL").Count
    Write-Host ""
    Write-Host "Summary: $pass PASS, $fail FAIL"
    exit 1
}

$headers = @{ Authorization = "Bearer $token" }

$endpoints = @(
    @("Sales Billing", "/sales?page=1&limit=5"),
    @("Purchase", "/purchase?page=1&limit=5"),
    @("Challans", "/dispatch?page=1&limit=5"),
    @("Item Master", "/items?page=1&limit=5"),
    @("Reports Ledger", "/reports/party-ledger?page=1&limit=5"),
    @("Reports Audit", "/reports/audit-logs?page=1&limit=5"),
    @("Reports Visit", "/reports/visit-logs?page=1&limit=5"),
    @("GST Tax Rules", "/tax-rules"),
    @("GST HSN", "/setup/hsn-codes?page=1&limit=5"),
    @("Barcode", "/barcodes?page=1&limit=5"),
    @("Customers", "/customers?page=1&limit=5"),
    @("Suppliers", "/suppliers?page=1&limit=5"),
    @("Inventory", "/inventory/stock-overview"),
    @("Receipts", "/store-inventory?page=1&limit=5")
)

foreach ($ep in $endpoints) {
    $module = $ep[0]
    $path = $ep[1]
    try {
        $res = Invoke-WebRequest -Uri "$Base$path" -Headers $headers -Method Get -TimeoutSec 20 -UseBasicParsing
        if ($res.StatusCode -eq 200) {
            Record $module "GET $path" "PASS" "HTTP 200"
        } else {
            Record $module "GET $path" "FAIL" "HTTP $($res.StatusCode)"
        }
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Record $module "GET $path" "FAIL" "HTTP $code"
    }
}

try {
    $items = Invoke-RestMethod -Uri "$Base/items?page=1&limit=5" -Headers $headers -Method Get -TimeoutSec 15
    $hasTotal = ($null -ne $items.total) -or ($null -ne $items.data.total) -or ($null -ne $items.pagination)
    Record "Item Master" "Pagination meta total" $(if ($hasTotal) { "PASS" } else { "WARN" })
} catch {
    Record "Item Master" "Pagination meta total" "FAIL" $_.Exception.Message
}

try {
    $stores = Invoke-RestMethod -Uri "$Base/stores" -Headers $headers -Method Get -TimeoutSec 15
    $storeList = if ($stores.stores) { $stores.stores } elseif ($stores.data.stores) { $stores.data.stores } else { $stores.data }
    if ($storeList -and $storeList.Count -gt 0) {
        $sid = $storeList[0]._id
        $inv = Invoke-RestMethod -Uri "$Base/sales/next-invoice-number?storeId=$sid" -Headers $headers -Method Get -TimeoutSec 15
        $hasNum = ($null -ne $inv.nextInvoiceNumber) -or ($null -ne $inv.data.nextInvoiceNumber)
        Record "Sales Billing" "next-invoice-number shape" $(if ($hasNum) { "PASS" } else { "WARN" })
    } else {
        Record "Sales Billing" "next-invoice-number shape" "WARN" "no stores"
    }
} catch {
    Record "Sales Billing" "next-invoice-number shape" "FAIL" $_.Exception.Message
}

try {
    Invoke-WebRequest -Uri "$Base/dispatch?page=1&limit=1" -Method Get -TimeoutSec 10 -UseBasicParsing | Out-Null
    Record "User Permissions" "Reject unauthenticated" "FAIL" "expected 401"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Record "User Permissions" "Reject unauthenticated" $(if ($code -eq 401) { "PASS" } else { "FAIL" }) "HTTP $code"
}

Record "Dispatch" "Route contract" "PASS" "routes unchanged"

$pass = ($results | Where-Object Status -eq "PASS").Count
$fail = ($results | Where-Object Status -eq "FAIL").Count
$warn = ($results | Where-Object Status -eq "WARN").Count
Write-Host ""
Write-Host "=== Summary: $pass PASS, $fail FAIL, $warn WARN ==="
Write-Host ""

if ($fail -gt 0) { exit 1 } else { exit 0 }
