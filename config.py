"""
Configuration settings for Cybercrime Intelligence System
"""
import os
from typing import Optional

# API Configuration
GEMINI_API_KEY: str = "AIzaSyAuMhGodTDSiwHb2Z8y5Y0n72Wcp0HCToE"
GEMINI_URL: str = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# Application Settings
APP_TITLE: str = "Cybercrime Intelligence System"
APP_VERSION: str = "1.0.0"
APP_DESCRIPTION: str = "AI-powered criminal network analysis and intelligence system"

# Analysis Parameters
MAX_KINGPINS: int = 50  # Increased limit for large datasets
MIN_RING_SIZE: int = 2
RISK_THRESHOLD: float = 0.7

# Weights for kingpin scoring
PAGERANK_WEIGHT: float = 0.6
BETWEENNESS_WEIGHT: float = 0.4

# Model Configuration
RANDOM_STATE: int = 42
N_CLUSTERS: int = 3

# Data paths
DATA_DIR: str = os.path.join(os.path.dirname(__file__), "data")
SUSPECTS_FILE: str = os.path.join(DATA_DIR, "suspects.csv")
CALLS_FILE: str = os.path.join(DATA_DIR, "call_logs.csv")
TRANSACTIONS_FILE: str = os.path.join(DATA_DIR, "transactions.csv")

# Data chunk size for loading large datasets
DATA_CHUNK_SIZE: int = 10000
