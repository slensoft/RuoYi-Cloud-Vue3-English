@echo off
echo.
echo [Info] Install the web project and generate the node_modules file.
echo.

%~d0
cd %~dp0

cd ..
yarn --registry=https://registry.npmmirror.com

pause
