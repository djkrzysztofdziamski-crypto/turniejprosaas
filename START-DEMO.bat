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

echo Gotowe! Demo Story E0-E7 (~20 min)

echo.

echo   1. ZOBACZ FINAL TURNIEJU

echo   2. DALEJ - hook (31/32 meczow)

echo   3. DALEJ - widok kibica: MECZE / TABELE / PLAY-OFF

echo   4. Wroc do stolu organizatora - DALEJ - final

echo   5. Wpisz wynik finalu (np. 3:2) - podium

echo   6. Dalej - konwersja i archiwum

echo.

echo Sciaga: DEMO_STORY_SCIAGA.pdf

echo.

pause

