@echo off
cd /d c:\Users\abhis\python\ml_engineS\ml_engine
python -m uvicorn app:app --host 0.0.0.0 --port 8002
