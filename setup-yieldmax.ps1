# setup-yieldmax.ps1
Write-Host "Setting up YieldMax project structure..." -ForegroundColor Green

# Create all directories
$directories = @(
    "frontend\src\app\portfolio",
    "frontend\src\app\markets",
    "frontend\src\app\history",
    "frontend\src\app\api\yields",
    "frontend\src\app\api\portfolio",
    "frontend\src\app\api\transactions",
    "frontend\src\components\Dashboard",
    "frontend\src\components\UI",
    "frontend\src\components\Layout",
    "frontend\src\components\Wallet",
    "frontend\src\hooks",
    "frontend\src\utils",
    "frontend\src\styles",
    "frontend\src\types",
    "frontend\src\design-system",
    "frontend\public",
    "frontend\tests\e2e\helpers",
    "frontend\tests\unit\components",
    "frontend\tests\unit\hooks",
    "frontend\tests\unit\utils",
    "contracts\contracts\core",
    "contracts\contracts\interfaces",
    "contracts\contracts\libraries",
    "contracts\contracts\mocks",
    "contracts\contracts\attacks",
    "contracts\scripts",
    "contracts\test\helpers",
    "contracts\test\utils",
    "contracts\deployments\mainnet",
    "contracts\deployments\arbitrum",
    "contracts\deployments\polygon",
    "contracts\deployments\optimism",
    "backend\src\controllers",
    "backend\src\services",
    "backend\src\models",
    "backend\src\routes\v1",
    "backend\src\middleware",
    "backend\src\config",
    "backend\tests",
    "scripts\demo",
    "scripts\deployment",
    "scripts\monitoring",
    "docs\technical",
    "docs\user-guides",
    "docs\hackathon",
    ".github\workflows"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "Created: $dir" -ForegroundColor Yellow
}

Write-Host "`nProject structure created successfully!" -ForegroundColor Green
Write-Host "Now run the file creation commands from Step 6 onwards." -ForegroundColor Cyan