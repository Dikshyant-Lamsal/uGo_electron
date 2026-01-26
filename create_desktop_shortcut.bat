@echo off
cls
echo ================================================
echo   UGo Student Management - Shortcut Creator
echo ================================================
echo.

set SCRIPT_DIR=%~dp0
set SHORTCUT_NAME=UGo Student Management
set TARGET=%SCRIPT_DIR%UGo_Student_Management.bat
set ICON=%SCRIPT_DIR%src\renderer\src\assets\logo\icon.ico

REM Check if icon exists
if not exist "%ICON%" (
    echo Warning: Icon file not found at %ICON%
    echo Shortcut will use default icon.
    echo.
)

echo Creating desktop shortcut...
powershell -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('%USERPROFILE%\Desktop\%SHORTCUT_NAME%.lnk'); $SC.TargetPath = '%TARGET%'; $SC.WorkingDirectory = '%SCRIPT_DIR%'; $SC.IconLocation = '%ICON%'; $SC.Description = 'Launch UGo Student Management System'; $SC.Save()"

echo.
echo ================================================
echo   Desktop shortcut created successfully!
echo   Location: %USERPROFILE%\Desktop\%SHORTCUT_NAME%.lnk
echo ================================================
pause
```

### **3. If you need a different icon:**

**Convert PNG to ICO:**
- Use online converter: https://convertio.co/png-ico/
- Or use: https://www.icoconverter.com/
- Recommended size: 256x256px

**Save as:**
```
src/renderer/assets/logo/app_icon.ico