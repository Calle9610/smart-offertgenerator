.PHONY: help install dev install-dev lint format check typecheck clean test test-cov ci

# Default target
help:
	@echo "Smart Offertgenerator Backend - Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  install      Install production dependencies"
	@echo "  install-dev  Install development dependencies"
	@echo "  dev          Start development server"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint         Run Ruff linter"
	@echo "  format       Format code with Ruff"
	@echo "  check        Run linting and formatting checks"
	@echo "  typecheck    Run MyPy type checking"
	@echo "  ci           Run full CI pipeline"
	@echo ""
	@echo "Testing:"
	@echo "  test         Run tests"
	@echo "  test-cov     Run tests with coverage"
	@echo ""
	@echo "Utilities:"
	@echo "  clean        Clean cache and build files"

# Installation
install:
	pip install -e .

install-dev:
	pip install -e ".[dev,test]"

# Development server
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Code quality
lint:
	ruff check .

format:
	ruff format .

check: lint format

typecheck:
	mypy app

# Full CI pipeline
ci: check typecheck test

# Testing
test:
	pytest

test-cov:
	pytest --cov=app --cov-report=term-missing --cov-report=html

# Clean up
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "htmlcov" -exec rm -rf {} +
	find . -type d -name ".tox" -exec rm -rf {} +
	find . -type d -name "build" -exec rm -rf {} +
	find . -type d -name "dist" -exec rm -rf {} +
