@echo off
cd /d "%~dp0"
echo Starting your natal chart app. Leave this window open while you use it.
start "" http://localhost:3000
npm run dev
