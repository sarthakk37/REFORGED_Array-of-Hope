FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject and install dependencies
COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir .

# Copy application source code and migrations
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY seeds/ ./seeds/
COPY fixtures/ ./fixtures/
COPY alembic.ini ./

# Ensure runtime directories exist
RUN mkdir -p data out

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV LLM_MODE=mock
ENV AUTH_ENABLED=true

CMD ["uvicorn", "driftsmith.main:app", "--host", "0.0.0.0", "--port", "8000"]
