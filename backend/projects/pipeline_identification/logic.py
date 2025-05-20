# backend/projects/pipeline_identification/logic.py

import pandas as pd
from io import BytesIO
from pathlib import Path
from typing import Dict, List, Union
import uuid
from datetime import date
import pyxlsb
from openpyxl import load_workbook

# In-memory store: { session_id: { "df": DataFrame } }
SESSION_DATA: Dict[str, Dict[str, pd.DataFrame]] = {}

REQUIRED_COLUMNS = [
    "Business Entity",
    "Sub Business Entity",
    "Product Family",
    "Product ID",
    "SAV Name",
] # Just an initial list, refine based on actual identification needs


def load_df_for_session(session_id: str) -> pd.DataFrame:
    """Load the uploaded CSV for this session into a DataFrame."""
    # NOTE: This assumes files are saved as CSVs in /tmp/uploads.
    # Adjust file extension and path based on your actual file handling logic.
    file_path = Path("/tmp/uploads") / f"{session_id}.csv"
    if not file_path.exists():
        raise FileNotFoundError(f"No upload found for session {session_id}")
    df = pd.read_csv(file_path)
    # strip whitespace from string columns
    df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)
    # Ensure column names are stripped as well
    df.columns = df.columns.str.strip()
    return df

def load_excel_to_memory(file_bytes: bytes) -> pd.DataFrame:
    """
    Reads the Excel from 'Powered by Cisco Ready' sheet into a DataFrame.
    Attempts to infer and convert data types (dates, numbers).
    Ensures required columns exist and converts all columns to strings, stripping whitespace.
    """
    try:
        # Attempt normal .xlsx
        df = pd.read_excel(BytesIO(file_bytes), sheet_name="Powered by Cisco Ready")
    except ValueError:
        # Possibly .xlsb
        df = pd.read_excel(BytesIO(file_bytes), sheet_name="Powered by Cisco Ready", engine="pyxlsb")

    # Check required columns
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Convert everything to string and strip whitespace
    df = df.astype(str)
    df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)

    return df



def start_new_session(file_bytes: bytes) -> str:
    """
    Load the DataFrame, store in SESSION_DATA, and return session_id.
    """
    df = load_excel_to_memory(file_bytes)
    df.columns = df.columns.str.strip()
    session_id = str(uuid.uuid4())
    print(df.columns)
    SESSION_DATA[session_id] = {"df": df}
    return session_id


def get_columns(session_id: str) -> List[str]:
    """
    Retrieves the dataframe for the given session_id and returns a list of its column names.
    """
    if session_id not in SESSION_DATA:
        raise KeyError("Session not found.")
    df = SESSION_DATA[session_id]["df"]
    return df.columns.tolist()


def get_unique_column_values(session_id: str, column_name: str) -> list:
    """
    Retrieve unique values for a specific column for a given session ID.
    """
    if session_id not in SESSION_DATA:
        raise KeyError("Session not found.")
    df = SESSION_DATA[session_id]["df"]

    # Currently not applying filters before getting unique values in pipeline identification
    # filtered_df = apply_filters_incremental(df, filters)
    filtered_df = df  # Use the whole DataFrame for now

    try:
        unique_vals = filtered_df[column_name].dropna().unique()
    except KeyError as e:
        print(f"KeyError in get_unique_column_values:")
        print(f"  Requested column_name: '{column_name}'")
        print(f"  Available columns: {list(df.columns)}")
        raise e # Re-raise the exception after printing

    unique_vals = sorted(unique_vals, key=lambda x: str(x))
    return list(unique_vals)


from .schemas import IdentificationCriteria, StringFilter, NumberFilter, DateFilter # Import the schema

def identify_opportunities(session_id: str, criteria: IdentificationCriteria) -> pd.DataFrame:
    """
    Given identification criteria, return a DataFrame of potential opportunities.
    """
    if session_id not in SESSION_DATA:
        raise KeyError("Session not found.")

    df = SESSION_DATA[session_id]["df"].copy() # Work on a copy to avoid modifying the original

    for column, filter_obj in criteria.criteria.items():
        if column not in df.columns:
            # Optionally log a warning or raise an error if a specified column doesn't exist
            continue # Skip filtering for non-existent columns

        if isinstance(filter_obj, StringFilter):
            if filter_obj.values:
                # Ensure column data is string for comparison
                df = df[df[column].astype(str).str.strip().isin([str(v).strip() for v in filter_obj.values])]

        elif isinstance(filter_obj, NumberFilter):
            # Ensure column data is numeric
            numeric_series = pd.to_numeric(df[column], errors='coerce')
            if filter_obj.min is not None:
                df = df[numeric_series >= filter_obj.min]
            if filter_obj.max is not None:
                df = df[numeric_series <= filter_obj.max]
            if filter_obj.values:
                df = df[numeric_series.isin(filter_obj.values)]

        elif isinstance(filter_obj, DateFilter):
            # Ensure column data is datetime/date
            date_series = pd.to_datetime(df[column], errors='coerce').dt.date
            if filter_obj.start_date is not None:
                df = df[date_series >= filter_obj.start_date]
            if filter_obj.end_date is not None:
                df = df[date_series <= filter_obj.end_date]

    return df

def export_opportunities(opportunities_df: pd.DataFrame) -> bytes:
    """
    Create and return bytes for an Excel file containing the opportunities DataFrame.
    """
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        opportunities_df.to_excel(writer, sheet_name="Potential Opportunities", index=False)
    return output.getvalue()
