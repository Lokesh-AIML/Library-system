@echo off
title Athenaeum Library System Server
cd /d "%~dp0"
echo ====================================================
echo   Starting Athenaeum Library Management System...
echo ====================================================
echo.
echo Opening server at http://localhost:3000
echo Ready for registration and user login.
echo.
node server.js
pause
