@echo off
title MentorAssist Full-Stack Launcher (National Hackathon)
echo ====================================================================
echo  MentorAssist: Fair Student-Support Prioritization Platform
echo ====================================================================
echo.
echo Starting FastAPI ML Microservice on port 8000...
start "POFR-Ed Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo Starting React Dashboard on port 3000...
start "POFR-Ed Frontend (React Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser to http://localhost:3000...
start http://localhost:3000

echo.
echo ====================================================================
echo  Both services are running!
echo  - Frontend Dashboard: http://localhost:3000
echo  - Backend API Docs:   http://localhost:8000/docs
echo ====================================================================
