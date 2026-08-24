#!/usr/bin/env bash
# build.sh — ใช้สำหรับ Deploy บน Render.com
# ทำงาน: Build Frontend (React/Vite) แล้วติดตั้ง Backend (Python/FastAPI) dependencies

set -e

echo "🔨 Step 1: Building Frontend (React + Vite)..."
cd frontend
npm install
npm run build
cd ..

echo "📦 Step 2: Installing Backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "✅ Build complete!"
