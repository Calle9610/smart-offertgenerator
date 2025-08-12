#!/bin/bash

echo "🚀 Starting Smart Offertgenerator..."

# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env..."
    cat > backend/.env << EOF
DATABASE_URL=postgresql+psycopg://app:app@db:5432/quotes
COMPANY_ID=00000000-0000-0000-0000-000000000001
PROFILE_ID=00000000-0000-0000-0000-000000000001
EOF
fi

# Create frontend .env.local if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_BASE=http://localhost:8000
EOF
fi

echo "✅ Environment files created"
echo "🐳 Starting with Docker Compose..."
docker-compose up --build 
