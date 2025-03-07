@echo off
echo.
echo [Info] Run the web project using the Vite command.
echo.

%~d0
cd %~dp0

cd ..
yarn dev

pause
