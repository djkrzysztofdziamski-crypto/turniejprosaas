@echo off
title TurniejPro Demo Story
cd /d "%~dp0"

echo Uruchamiam serwer lokalny na porcie 8080...
start "TurniejPro Serwer" cmd /k "python -m http.server 8080"

echo Czekam 2 sekundy...
timeout /t 2 /nobreak >nul

echo Otwieram Demo Story w przegladarce...
start http://localhost:8080/index.html?demo=story

echo.
echo Gotowe! W przegladarce kliknij:
echo   1. ZOBACZ FINAL TURNIEJU
echo   2. DALEJ (dwa razy) - zobaczysz widok kibica z meczami
echo.
pause
