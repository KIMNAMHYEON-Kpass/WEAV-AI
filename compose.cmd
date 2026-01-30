@echo off
REM WEAV AI - Docker Compose 래퍼 (Windows CMD)
REM 사용: compose.cmd up | down | build | test | migrate | logs | shell | help
REM 프로젝트 루트에서 실행하세요.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0compose.ps1" %*
