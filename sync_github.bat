@echo off
echo ===================================================
echo     CreatorOS GitHub Sync (Secured)
echo ===================================================
echo.
echo Removing network.json from git tracking if it was tracked before...
git rm --cached backend/settings/network.json 2>nul
echo.
echo Adding all tracked changes...
git add .
echo.
echo Committing changes...
git commit -m "Implement Tailscale Secure Remote Access, WebSocket Real-time layer, Mobile PWA, UI fixes, and Gemini 3.5 Upgrade"
echo.
echo Pushing to GitHub...
git push
echo.
echo ===================================================
echo DONE!
echo ===================================================
pause
