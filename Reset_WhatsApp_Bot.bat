@echo off
echo Stopping existing CreatorOS Services to avoid port conflicts...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1

echo Resetting WhatsApp Bot session...
rmdir /s /q backend\plugins\whatsapp-bridge\whatsapp_auth_info

echo.
echo ==============================================================
echo 📱 SCAN THE QR CODE BELOW WITH YOUR **SECONDARY (BOT)** PHONE
echo ==============================================================
echo Once scanned and connected, close this window and run CreatorOs.bat again.
echo.

cd backend\plugins\whatsapp-bridge
node index.js
