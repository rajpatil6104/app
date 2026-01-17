#!/usr/bin/env bash
# Backend Start Script for Render

set -o errexit  # Exit on error

echo "Starting FastAPI server..."
uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
