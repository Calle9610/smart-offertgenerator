#!/bin/bash

# Smart Offertgenerator Backend - Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Smart Offertgenerator Backend development environment..."

# Check if Python 3.11+ is available
python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python 3.11+ is required, but found Python $python_version"
    echo "Please install Python 3.11 or later"
    exit 1
fi

echo "✅ Python $python_version detected"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install development dependencies
echo "📚 Installing development dependencies..."
pip install -e ".[dev,test]"

# Install pre-commit hooks
echo "🔒 Installing pre-commit hooks..."
pre-commit install

# Verify installation
echo "🔍 Verifying installation..."

echo "📝 Checking Ruff..."
ruff --version

echo "🔍 Checking MyPy..."
mypy --version

echo "🧪 Checking pytest..."
pytest --version

echo "🔒 Checking pre-commit..."
pre-commit --version

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "🚀 Available commands:"
echo "  make help          - Show all available commands"
echo "  make dev           - Start development server"
echo "  make lint          - Run Ruff linter"
echo "  make format        - Format code with Ruff"
echo "  make typecheck     - Run MyPy type checking"
echo "  make ci            - Run full CI pipeline"
echo "  make test          - Run tests"
echo "  make test-cov      - Run tests with coverage"
echo ""
echo "🔧 To activate the virtual environment:"
echo "  source venv/bin/activate"
echo ""
echo "📚 For more information, see README.md"
