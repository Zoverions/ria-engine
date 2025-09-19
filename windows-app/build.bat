@echo off
REM Build script for Windows distribution
REM This script prepares the application for Windows distribution

echo 🚀 Building RIA Trading Desktop for Windows...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing dependencies...
call npm install

REM Check if electron-builder is installed
npm list electron-builder >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing electron-builder...
    call npm install --save-dev electron-builder
)

echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo 🔧 Building application...

REM Build for Windows x64
echo Building for Windows x64...
call npm run build:win64

REM Build for Windows x32 (optional)
echo Building for Windows x32...
call npm run build:win32

echo ✅ Build completed successfully!
echo.
echo 📁 Output files can be found in the 'dist' directory:
echo    - RIA-Trading-Desktop-Setup.exe (installer)
echo    - RIA-Trading-Desktop-Portable.exe (portable)
echo.
echo 🎉 Ready for distribution!
pause