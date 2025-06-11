@echo off
echo Fixing YieldMax setup...

echo Creating fresh package.json...
node create-root-package.js

echo Installing everything...
node install-everything.js

echo.
echo ✅ Setup complete!
echo.
echo To start the app:
echo 1. Edit .env files with your API keys
echo 2. Run: npm run dev
echo.
pause