"""
Data Loader Module
==================
Handles loading and validation of CSV data files for the CIS system.
"""
import os
import logging
from typing import Tuple, Optional
import pandas as pd

from config import DATA_DIR, SUSPECTS_FILE, CALLS_FILE, TRANSACTIONS_FILE, DATA_CHUNK_SIZE

logger = logging.getLogger(__name__)


class DataLoadError(Exception):
    """Custom exception for data loading errors."""
    pass


def validate_dataframe(df: pd.DataFrame, required_columns: list, name: str) -> bool:
    """Validate that a DataFrame has the required columns."""
    missing = set(required_columns) - set(df.columns)
    if missing:
        raise DataLoadError(f"{name} is missing columns: {missing}")
    return True


def load_large_csv(filepath: str, chunksize: int = 10000) -> pd.DataFrame:
    """Load large CSV files in chunks."""
    chunks = []
    for chunk in pd.read_csv(filepath, chunksize=chunksize):
        chunks.append(chunk)
    return pd.concat(chunks, ignore_index=True)


def load_suspects(filepath: Optional[str] = None) -> pd.DataFrame:
    """Load suspects data from CSV file."""
    filepath = filepath or SUSPECTS_FILE
    if not os.path.exists(filepath):
        raise DataLoadError(f"Suspects file not found: {filepath}")
    
    df = load_large_csv(filepath)
    validate_dataframe(df, ["suspect_id", "name"], "suspects")
    logger.info(f"Loaded {len(df)} records from {filepath}")
    return df


def load_calls(filepath: Optional[str] = None) -> pd.DataFrame:
    """Load call logs from CSV file."""
    filepath = filepath or CALLS_FILE
    if not os.path.exists(filepath):
        raise DataLoadError(f"Call logs file not found: {filepath}")
    
    df = load_large_csv(filepath)
    validate_dataframe(df, ["from", "to", "duration"], "call_logs")
    logger.info(f"Loaded {len(df)} records from {filepath}")
    return df


def load_transactions(filepath: Optional[str] = None) -> pd.DataFrame:
    """Load financial transactions from CSV file."""
    filepath = filepath or TRANSACTIONS_FILE
    if not os.path.exists(filepath):
        raise DataLoadError(f"Transactions file not found: {filepath}")
    
    df = load_large_csv(filepath)
    validate_dataframe(df, ["from", "to", "amount"], "transactions")
    logger.info(f"Loaded {len(df)} records from {filepath}")
    return df


def load_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Load all required data files.
    
    Returns:
        Tuple containing (suspects_df, calls_df, transactions_df)
    """
    try:
        suspects = load_suspects()
        calls = load_calls()
        transactions = load_transactions()
        logger.info("All data files loaded successfully")
        return suspects, calls, transactions
    except DataLoadError as e:
        logger.error(f"Data loading failed: {e}")
        raise


def generate_sample_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Generate sample data for testing when no data files exist."""
    logger.info("Generating sample data for demonstration...")
    
    # Sample suspects
    suspects = pd.DataFrame({
        "suspect_id": ["S001", "S002", "S003", "S004", "S005", "S006", "S007", "S008"],
        "name": ["John Doe", "Jane Smith", "Bob Wilson", "Alice Brown", 
                 "Charlie Davis", "Diana Evans", "Frank Miller", "Grace Lee"],
        "age": [35, 28, 42, 31, 45, 29, 38, 33],
        "location": ["New York", "Los Angeles", "Chicago", "Houston", 
                     "Phoenix", "Philadelphia", "San Antonio", "San Diego"]
    })
    
    # Sample call logs
    calls = pd.DataFrame({
        "from": ["S001", "S001", "S002", "S003", "S004", "S005", "S001", "S006", "S007", "S002"],
        "to": ["S002", "S003", "S003", "S004", "S005", "S006", "S004", "S007", "S008", "S005"],
        "duration": [120, 45, 300, 180, 90, 250, 60, 150, 200, 75],
        "timestamp": ["2024-01-15 10:30:00", "2024-01-15 14:20:00", "2024-01-16 09:00:00",
                      "2024-01-16 11:45:00", "2024-01-17 08:30:00", "2024-01-17 15:00:00",
                      "2024-01-18 12:00:00", "2024-01-18 16:30:00", "2024-01-19 10:00:00",
                      "2024-01-19 14:45:00"]
    })
    
    # Sample transactions
    transactions = pd.DataFrame({
        "from": ["S001", "S002", "S003", "S001", "S004", "S005", "S006", "S002"],
        "to": ["S002", "S004", "S005", "S006", "S007", "S008", "S008", "S003"],
        "amount": [5000, 12000, 3500, 8000, 15000, 2500, 6000, 9500],
        "timestamp": ["2024-01-15 11:00:00", "2024-01-16 10:30:00", "2024-01-16 14:00:00",
                      "2024-01-17 09:30:00", "2024-01-17 16:00:00", "2024-01-18 11:30:00",
                      "2024-01-18 17:00:00", "2024-01-19 13:00:00"]
    })
    
    return suspects, calls, transactions


def save_sample_data() -> None:
    """Save sample data to CSV files."""
    os.makedirs(DATA_DIR, exist_ok=True)
    
    suspects, calls, transactions = generate_sample_data()
    
    suspects.to_csv(SUSPECTS_FILE, index=False)
    calls.to_csv(CALLS_FILE, index=False)
    transactions.to_csv(TRANSACTIONS_FILE, index=False)
    
    logger.info(f"Sample data saved to {DATA_DIR}")


def load_or_generate_data() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load data from files or generate sample data if files don't exist."""
    try:
        return load_data()
    except DataLoadError:
        logger.warning("Data files not found, generating sample data...")
        save_sample_data()
        return load_data()


def load_or_generate_data_in_chunks(chunksize: int = DATA_CHUNK_SIZE) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load data in chunks of 10,000 rows or generate sample data if files don't exist."""
    try:
        if not os.path.exists(SUSPECTS_FILE):
            raise DataLoadError(f"Suspects file not found: {SUSPECTS_FILE}")
        suspects = load_large_csv(SUSPECTS_FILE, chunksize=chunksize)
        validate_dataframe(suspects, ["suspect_id", "name"], "suspects")
        
        if not os.path.exists(CALLS_FILE):
            raise DataLoadError(f"Calls file not found: {CALLS_FILE}")
        calls = load_large_csv(CALLS_FILE, chunksize=chunksize)
        validate_dataframe(calls, ["from", "to", "duration"], "call_logs")
        
        if not os.path.exists(TRANSACTIONS_FILE):
            raise DataLoadError(f"Transactions file not found: {TRANSACTIONS_FILE}")
        transactions = load_large_csv(TRANSACTIONS_FILE, chunksize=chunksize)
        validate_dataframe(transactions, ["from", "to", "amount"], "transactions")
        
        logger.info(f"Data loaded in chunks of {chunksize} - Suspects: {len(suspects)}, Calls: {len(calls)}, Transactions: {len(transactions)}")
        return suspects, calls, transactions
    except DataLoadError:
        logger.warning("Data files not found, generating sample data...")
        save_sample_data()
        return load_data()
