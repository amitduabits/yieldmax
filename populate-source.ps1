# populate-source.ps1
Write-Host "Creating source files..." -ForegroundColor Green

function Write-FileContent {
    param([string]$Path, [string]$Content)
    $dir = Split-Path -Parent $Path
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "Created: $Path" -ForegroundColor Yellow
}

# Create app layout
$layoutContent = @"
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YieldMax - Cross-Chain DeFi Yield Optimizer',
  description: 'Maximize your DeFi yields across multiple chains with AI-powered optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
"@
Write-FileContent -Path "frontend\src\app\layout.tsx" -Content $layoutContent

# Create app page
$pageContent = @"
export default function Home() {
  return (
    <div>
      <h1>YieldMax Dashboard</h1>
      <p>Cross-Chain DeFi Yield Optimizer</p>
    </div>
  );
}
"@
Write-FileContent -Path "frontend\src\app\page.tsx" -Content $pageContent

Write-Host "Source files created!" -ForegroundColor Green
