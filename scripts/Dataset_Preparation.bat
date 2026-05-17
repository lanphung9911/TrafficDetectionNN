@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   Dataset Preparation - TrafficDetectionNN
echo ============================================
echo.

cd /d "%~dp0.."
set "PROJECT_ROOT=%CD%"
set "DATASET_DIR=backend\dataset"
set "ZIP_FILE=%DATASET_DIR%\dataset.zip"

:: ========== Check if zip file exists ==========
echo [1/3] Checking dataset.zip...

if not exist "%ZIP_FILE%" (
    echo [ERROR] dataset.zip not found at:
    echo         %PROJECT_ROOT%\%ZIP_FILE%
    echo.
    echo Please download the dataset and place it in the backend\dataset folder.
    pause
    exit /b 1
)

echo [OK] Found dataset.zip

:: ========== Check if already extracted ==========
echo.
echo [2/3] Checking existing data...

set "EXTRACT_COUNT=0"
for /d %%d in ("%DATASET_DIR%\*") do set /a EXTRACT_COUNT+=1

if %EXTRACT_COUNT% gtr 0 (
    echo [WARNING] Dataset folder already contains %EXTRACT_COUNT% subfolder(s).
    set /p "OVERWRITE=Do you want to extract anyway? This may overwrite existing files. (y/N): "
    if /i not "!OVERWRITE!"=="y" (
        echo [SKIPPED] Extraction cancelled.
        pause
        exit /b 0
    )
)

:: ========== Extract dataset ==========
echo.
echo [3/3] Extracting dataset.zip...
echo         This may take a few minutes depending on the dataset size.
echo.

:: Use PowerShell to extract (available on Windows 10+)
powershell -Command "Expand-Archive -Path '%PROJECT_ROOT%\%ZIP_FILE%' -DestinationPath '%PROJECT_ROOT%\%DATASET_DIR%' -Force"

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to extract dataset.zip
    echo         Try extracting manually or check if the file is corrupted.
    pause
    exit /b 1
)

echo [OK] Dataset extracted successfully!

:: ========== Show extracted contents ==========
echo.
echo ============================================
echo   Extracted Contents:
echo ============================================
dir /ad /b "%DATASET_DIR%" 2>nul
echo.

:: ========== Optional: Delete zip after extraction ==========
set /p "DELETE_ZIP=Delete dataset.zip to save disk space? (y/N): "
if /i "!DELETE_ZIP!"=="y" (
    del "%ZIP_FILE%"
    echo [OK] dataset.zip deleted.
)

echo.
echo ============================================
echo   Dataset Preparation Complete!
echo ============================================
echo.

pause
endlocal
