FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY pyproject.toml .
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .
COPY start.sh .

# Install dependencies including test dependencies
RUN pip install --no-cache-dir -e .
RUN pip install --no-cache-dir pytest pytest-asyncio pytest-cov httpx

# Make startup script executable
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 8000

# Start the application
CMD ["/app/start.sh"] 
