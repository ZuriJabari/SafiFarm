#!/bin/bash

# Exit on error
set -e

echo "🌱 Setting up SafiFarm development environment..."

# Create necessary directories
mkdir -p backend/media
mkdir -p backend/static
mkdir -p backend/ml/models

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements.dev.txt

# Run database migrations
echo "🔄 Running database migrations..."
python manage.py migrate

# Create default superuser if not exists
echo "👤 Creating default superuser..."
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@safifarm.com', 'admin') if not User.objects.filter(username='admin').exists() else None"

# Download initial ML models
echo "🤖 Downloading ML models..."
python manage.py update_ml_models

# Install frontend dependencies
echo "📱 Setting up frontend..."
cd ../app
npm install

# Set up git hooks
echo "🔨 Setting up git hooks..."
cd ..
cp scripts/pre-commit .git/hooks/
chmod +x .git/hooks/pre-commit

# Create .env files if they don't exist
echo "⚙️ Creating environment files..."
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
fi

if [ ! -f app/.env ]; then
    cp app/.env.example app/.env
fi

echo "✅ Development environment setup complete!"
echo "
Next steps:
1. Update backend/.env with your configuration
2. Update app/.env with your configuration
3. Start the development servers:
   - Backend: cd backend && python manage.py runserver
   - Frontend: cd app && npm start
"
