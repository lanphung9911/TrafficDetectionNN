@echo off
setlocal EnableDelayedExpansion

echo ============================================
echo   TrafficDetectionNN Environment Setup
echo ============================================
echo.

cd /d "%~dp0.."
set "PROJECT_ROOT=%CD%"
set "REQUIRED_PYTHON_VERSION=3.12"
set "PYTHON_CMD="

:: ========== Check Python ==========
echo [1/6] Checking Python installation...

:: First, try to find Python 3.12 using py launcher
where py >nul 2>&1
if %ERRORLEVEL% equ 0 (
    py -3.12 --version >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        for /f "tokens=2 delims= " %%v in ('py -3.12 --version 2^>^&1') do set "PYTHON_VERSION=%%v"
        set "PYTHON_CMD=py -3.12"
        echo [OK] Found Python !PYTHON_VERSION! via py launcher
        goto :python_found
    )
)

:: Try direct python command and check version
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=2 delims= " %%v in ('python --version 2^>^&1') do set "PYTHON_VERSION=%%v"
    echo [INFO] Found Python !PYTHON_VERSION!
    
    :: Check if it's Python 3.12.x
    echo !PYTHON_VERSION! | findstr /B "3.12" >nul
    if !ERRORLEVEL! equ 0 (
        set "PYTHON_CMD=python"
        echo [OK] Python version matches required %REQUIRED_PYTHON_VERSION%.x
        goto :python_found
    ) else (
        echo [WARNING] Python !PYTHON_VERSION! found, but %REQUIRED_PYTHON_VERSION%.x is recommended.
        set /p "USE_EXISTING=Do you want to continue with Python !PYTHON_VERSION!? (y/N): "
        if /i "!USE_EXISTING!"=="y" (
            set "PYTHON_CMD=python"
            goto :python_found
        )
    )
)

:: Python 3.12 not found - provide installation options
echo.
echo [ERROR] Python %REQUIRED_PYTHON_VERSION% not found.
echo.
echo Please install Python %REQUIRED_PYTHON_VERSION% from one of these sources:
echo   1. Official: https://www.python.org/downloads/release/python-31213/
echo   2. Microsoft Store: Search "Python 3.12" in Microsoft Store
echo.
echo After installation, make sure to:
echo   - Check "Add Python to PATH" during installation
echo   - Restart this script
echo.
pause
exit /b 1

:python_found
echo [INFO] Using: !PYTHON_CMD!

:: ========== Check Node.js ==========
echo.
echo [2/6] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Node.js is not installed.
    echo.
    set /p "INSTALL_NODE=Do you want to automatically install Node.js LTS? (Y/n): "
    if /i "!INSTALL_NODE!"=="n" (
        echo [SKIPPED] Node.js installation skipped. Frontend setup will be skipped.
        set "SKIP_NODE=1"
        goto :node_check_done
    )

    :: Try installing via winget
    echo [INFO] Attempting to install Node.js LTS via winget...
    where winget >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        if !ERRORLEVEL! equ 0 (
            echo [OK] Node.js installed successfully via winget.
            :: Refresh PATH so node is available in current session
            for /f "tokens=*" %%p in ('where node 2^>nul') do set "NODE_PATH=%%p"
            if "!NODE_PATH!"=="" (
                echo [INFO] Please restart this script to continue with the updated PATH.
                pause
                exit /b 0
            )
        ) else (
            echo [ERROR] winget installation failed.
            goto :node_manual_install
        )
    ) else (
        echo [WARNING] winget is not available on this system.
        goto :node_manual_install
    )
    goto :node_installed

    :node_manual_install
    echo.
    echo [INFO] Please install Node.js manually:
    echo   - Official LTS: https://nodejs.org/en/download/
    echo   - After installation, re-run this script.
    echo.
    set /p "CONTINUE_WITHOUT_NODE=Continue setup without Node.js? (y/N): "
    if /i "!CONTINUE_WITHOUT_NODE!"=="y" (
        set "SKIP_NODE=1"
        goto :node_check_done
    )
    pause
    exit /b 1

    :node_installed
    where node >nul 2>&1
    if !ERRORLEVEL! neq 0 (
        echo [WARNING] Node.js not detected in PATH after installation. Frontend setup will be skipped.
        set "SKIP_NODE=1"
        goto :node_check_done
    )
) 

where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "tokens=1 delims= " %%v in ('node --version 2^>^&1') do set "NODE_VERSION=%%v"
    echo [OK] Found Node.js !NODE_VERSION!
    set "SKIP_NODE=0"
)

:node_check_done

:: ========== Create Python Virtual Environment ==========
echo.
echo [3/6] Setting up Python virtual environment with Python !PYTHON_VERSION!...

if exist "backend\.venv" (
    echo [INFO] Virtual environment already exists.
    set /p "RECREATE=Do you want to recreate it? (y/N): "
    if /i "!RECREATE!"=="y" (
        echo [INFO] Removing existing virtual environment...
        rmdir /s /q "backend\.venv"
        !PYTHON_CMD! -m venv backend\.venv
        echo [OK] Virtual environment recreated with Python !PYTHON_VERSION!
    ) else (
        echo [OK] Using existing virtual environment.
    )
) else (
    !PYTHON_CMD! -m venv backend\.venv
    echo [OK] Virtual environment created at backend\.venv with Python !PYTHON_VERSION!
)

:: ========== Install Python Dependencies ==========
echo.
echo [4/6] Installing Python dependencies...

call backend\.venv\Scripts\activate.bat

:: Upgrade pip first
python -m pip install --upgrade pip

:: ========== Detect GPU and CUDA version ==========
echo.
echo [INFO] Detecting GPU...
set "HAS_GPU=0"
set "CUDA_MAJOR=0"
set "CUDA_MINOR=0"
set "DETECTED_CUDA="
set "RECOMMENDED_WHL=cpu"
set "RECOMMENDED_LABEL=CPU (no GPU detected)"

where nvidia-smi >nul 2>&1
if !ERRORLEVEL! equ 0 (
    :: Get GPU name
    for /f "tokens=*" %%g in ('nvidia-smi --query-gpu=name --format=csv^,noheader 2^>nul') do (
        set "GPU_NAME=%%g"
    )
    :: Get CUDA version from nvidia-smi header line
    for /f "tokens=9 delims= " %%c in ('nvidia-smi 2^>nul ^| findstr /C:"CUDA Version"') do (
        set "DETECTED_CUDA=%%c"
    )
    if not "!GPU_NAME!"=="" set "HAS_GPU=1"
)

if "!HAS_GPU!"=="1" (
    echo [OK] GPU detected: !GPU_NAME!
    if not "!DETECTED_CUDA!"=="" (
        echo [OK] Driver-supported CUDA version: !DETECTED_CUDA!
        :: Parse major version
        for /f "tokens=1 delims=." %%a in ("!DETECTED_CUDA!") do set "CUDA_MAJOR=%%a"
        for /f "tokens=2 delims=." %%b in ("!DETECTED_CUDA!") do set "CUDA_MINOR=%%b"
        :: Map CUDA version to PyTorch wheel
        if !CUDA_MAJOR! equ 11 (
            set "RECOMMENDED_WHL=cu118"
            set "RECOMMENDED_LABEL=CUDA 11.8 ^(driver supports CUDA !DETECTED_CUDA!^)"
        ) else if !CUDA_MAJOR! equ 12 (
            if !CUDA_MINOR! lss 4 (
                set "RECOMMENDED_WHL=cu121"
                set "RECOMMENDED_LABEL=CUDA 12.1 ^(driver supports CUDA !DETECTED_CUDA!^)"
            ) else if !CUDA_MINOR! lss 8 (
                set "RECOMMENDED_WHL=cu124"
                set "RECOMMENDED_LABEL=CUDA 12.4 ^(driver supports CUDA !DETECTED_CUDA!^)"
            ) else (
                set "RECOMMENDED_WHL=cu128"
                set "RECOMMENDED_LABEL=CUDA 12.8 ^(driver supports CUDA !DETECTED_CUDA!^)"
            )
        ) else if !CUDA_MAJOR! gtr 12 (
            set "RECOMMENDED_WHL=cu128"
            set "RECOMMENDED_LABEL=CUDA 12.8 ^(driver supports CUDA !DETECTED_CUDA!^)"
        )
    ) else (
        echo [WARNING] Could not determine CUDA version from nvidia-smi.
    )
) else (
    echo [INFO] No NVIDIA GPU detected. Will install CPU-only PyTorch.
)

echo.
echo [INFO] Recommended PyTorch build: !RECOMMENDED_LABEL!
echo.
echo PyTorch installation options:
echo   1. Auto-select ^(!RECOMMENDED_LABEL!^)     [recommended]
echo   2. CPU only
echo   3. CUDA 11.8
echo   4. CUDA 12.1
echo   5. CUDA 12.4
echo   6. CUDA 12.8
set /p "TORCH_CHOICE=Enter choice [1-6, default=1]: "
if "!TORCH_CHOICE!"=="" set "TORCH_CHOICE=1"

if "!TORCH_CHOICE!"=="1" goto :torch_auto
if "!TORCH_CHOICE!"=="2" goto :torch_cpu
if "!TORCH_CHOICE!"=="3" goto :cuda_118
if "!TORCH_CHOICE!"=="4" goto :cuda_121
if "!TORCH_CHOICE!"=="5" goto :cuda_124
if "!TORCH_CHOICE!"=="6" goto :cuda_128
echo [INFO] Invalid choice. Using auto-select...

:torch_auto
if "!RECOMMENDED_WHL!"=="cpu" goto :torch_cpu
if "!RECOMMENDED_WHL!"=="cu118" goto :cuda_118
if "!RECOMMENDED_WHL!"=="cu121" goto :cuda_121
if "!RECOMMENDED_WHL!"=="cu124" goto :cuda_124
if "!RECOMMENDED_WHL!"=="cu128" goto :cuda_128
goto :torch_cpu

:torch_cpu
echo [INFO] Installing PyTorch CPU version...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
goto :torch_done

:cuda_118
echo [INFO] Installing PyTorch with CUDA 11.8...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
goto :torch_done

:cuda_121
echo [INFO] Installing PyTorch with CUDA 12.1...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
goto :torch_done

:cuda_124
echo [INFO] Installing PyTorch with CUDA 12.4...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
goto :torch_done

:cuda_128
echo [INFO] Installing PyTorch with CUDA 12.8...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
goto :torch_done

:torch_done

:: Install other dependencies from requirements.txt
echo [INFO] Installing dependencies from requirements.txt...
if exist "backend\requirements.txt" (
    pip install -r backend\requirements.txt
    echo [OK] Python dependencies installed from requirements.txt
) else (
    echo [WARNING] requirements.txt not found. Installing packages manually...
    pip install fastapi uvicorn[standard] python-multipart python-dotenv pydantic
    pip install numpy pandas opencv-python Pillow matplotlib plotly PyJWT pyyaml
    pip install ipykernel
    echo [OK] Python dependencies installed.
)

:: Register .venv as Jupyter kernel
echo.
echo [INFO] Registering .venv as Jupyter kernel...
set "KERNEL_NAME=trafficdetection-venv"
set "KERNEL_DISPLAY=Python 3.12.13.1 (.venv)"
python -m ipykernel install --user --name "!KERNEL_NAME!" --display-name "!KERNEL_DISPLAY!"
if %ERRORLEVEL% equ 0 (
    echo [OK] Jupyter kernel registered: !KERNEL_DISPLAY!
) else (
    echo [WARNING] Failed to register Jupyter kernel.
)

:: Patch notebook kernelspec to use .venv kernel
echo.
set "NOTEBOOK_PATH=%PROJECT_ROOT%\backend\src\CNN\traffic-sign-recognition-using-pytorch-and-cnn.ipynb"
echo [INFO] Patching notebook kernelspec...
python -c ^
    "import json, sys;" ^
    "nb = json.load(open(r'!NOTEBOOK_PATH!', encoding='utf-8'));" ^
    "nb['metadata']['kernelspec'] = {'display_name': '!KERNEL_DISPLAY!', 'language': 'python', 'name': '!KERNEL_NAME!'};" ^
    "json.dump(nb, open(r'!NOTEBOOK_PATH!', 'w', encoding='utf-8'), indent=1, ensure_ascii=False)"
if %ERRORLEVEL% equ 0 (
    echo [OK] Notebook kernel set to: !KERNEL_DISPLAY!
) else (
    echo [WARNING] Failed to patch notebook kernelspec.
)

:: ========== Install Node.js Dependencies ==========
echo.
echo [5/6] Installing Node.js dependencies...

if "!SKIP_NODE!"=="1" (
    echo [SKIPPED] Node.js not installed.
) else (
    cd app
    if exist "package.json" (
        call npm install
        echo [OK] Node.js dependencies installed.
    ) else (
        echo [WARNING] package.json not found in app folder.
    )
    cd ..
)

:: ========== Create Backend Directories ==========
echo.
echo [6/6] Creating required directories and files...

:: Create backend directories
if not exist "backend\output_logs" mkdir "backend\output_logs"
if not exist "backend\upload" mkdir "backend\upload"
if not exist "backend\reference" mkdir "backend\reference"
if not exist "backend\feedback" mkdir "backend\feedback"
if not exist "backend\feedback\attachments" mkdir "backend\feedback\attachments"
if not exist "backend\auth_login" mkdir "backend\auth_login"
if not exist "backend\input_users" mkdir "backend\input_users"
if not exist "backend\analysis_logs" mkdir "backend\analysis_logs"

echo [OK] Backend directories created.

:: ========== Create .env files ==========
echo.
echo Creating environment files...

:: Default values
set "HOST=0.0.0.0"
set "PORT=8000"
set "SYSTEM_VERSION=0_0"
set "MY_SECRET=dev-secret-change-in-production"

echo.
echo Configure backend settings (press Enter for defaults):
set /p "INPUT_HOST=Backend Host [%HOST%]: "
if not "!INPUT_HOST!"=="" set "HOST=!INPUT_HOST!"

set /p "INPUT_PORT=Backend Port [%PORT%]: "
if not "!INPUT_PORT!"=="" set "PORT=!INPUT_PORT!"

:: Create backend .env
> "backend\src\.env" (
    echo # Backend Environment Configuration
    echo # Generated by setup_environment.bat
    echo.
    echo HOST=!HOST!
    echo PORT=!PORT!
    echo SYSTEM_VERSION=!SYSTEM_VERSION!
    echo MY_SECRET=!MY_SECRET!
    echo JWT_ALGORITHM=HS256
    echo REACT_APP_API_URL=http://localhost:5173
    echo FRONTEND_URLS=http://localhost:5173
    echo PRE_FIX_AUTH=/api/auth
    echo PRE_FIX_INPUT=/api/input
    echo PRE_FIX_USER=/api/user
    echo OUTPUT_DIR=output_logs
    echo UPLOAD_DIR=upload
    echo LIST_FOLDER_DIR=list-files
    echo REFDATA_DIR=reference
    echo FEEDBACK_DIR=feedback
    echo AUTH_USER_DIR=auth_login
    echo INPUT_USER_DIR=input_users
    echo ANALYSISLOGS_DIR=analysis_logs
)
echo [OK] Backend .env created at backend\src\.env

:: Create frontend .env.local
> "app\.env.local" (
    echo # Frontend Environment Configuration
    echo # Generated by setup_environment.bat
    echo VITE_API_URL=http://!HOST!:!PORT!
)
echo [OK] Frontend .env.local created at app\.env.local

:: ========== Summary ==========
echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Activate virtual environment:
echo      backend\.venv\Scripts\activate
echo.
echo   2. Start backend server:
echo      cd backend
echo      uvicorn src.main:app --reload
echo.
echo   3. Start frontend (in another terminal):
echo      cd app
echo      npm run dev
echo.
echo   4. Open notebook in VS Code and select kernel:
echo      "Python 3.12.13.1 (.venv)"
echo.
echo ============================================

call deactivate 2>nul
pause
endlocal
