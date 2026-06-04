#!/bin/bash
echo "Starting deployment..."

# Pull the latest code from GitHub
git pull origin main

# Build the React frontend
cd frontend
npm install
npm run build
cd ..

# Overwrite the public folder with the new build
cp -r frontend/dist/* .

# Restart the Python AI engine using the absolute virtual environment path
cd ai_engine
pkill -f engine.py
source /var/www/html/ai-photo-filtering-system/myvenv/bin/activate
nohup python3 engine.py > ai_log.txt 2>&1 &
cd ..

echo "Deployment complete!"