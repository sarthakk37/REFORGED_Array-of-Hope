.PHONY: setup seed dev test lint clean

PYTHON ?= python

setup:
	$(PYTHON) -m pip install -e ".[dev]"
	mkdir -p data out

seed:
	$(PYTHON) seeds/seed_demo_users.py

dev:
	$(PYTHON) -m uvicorn driftsmith.main:app --host 0.0.0.0 --port 8000 --reload

test:
	$(PYTHON) -m pytest tests -v

lint:
	$(PYTHON) -m ruff check src tests seeds migrations
	$(PYTHON) -m black --check src tests seeds migrations

clean:
	rm -rf data/*.db out/* .pytest_cache .ruff_cache build dist *.egg-info
