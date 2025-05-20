# backend/projects/pipeline_identification/logic.py

import pandas as pd
from io import BytesIO
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


def load_excel_to_memory(file_bytes: bytes) -> pd.DataFrame:
    """
    Reads the Excel from 'Powered by Cisco Ready' sheet into a DataFrame.
    Attempts to infer and convert data types (dates, numbers).
    Ensures required columns exist and converts other columns to strings, stripping whitespace.
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

    # Attempt to convert common date and numeric columns
    date_cols = ["Covered Line Start Date", "Covered Line End Date", "Ship Date", "Last Renewal Date", "End of Software Maintenance Date", "End-of-Life Announcement Date", "End of Routine Failure Analysis Date", "Last Date of Support", "Warranty End Date"] # Add other potential date columns
    numeric_cols = ["Product List Price $", "Default Service List Price $", "Existing Coverage Level List Price $", "Item Quantity"] # Add other potential numeric columns

    for col in date_cols:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.date # Convert to date objects, coerce errors to NaT

    for col in numeric_cols:
         if col in df.columns:
            # Attempt conversion, coerce errors to NaN
            df[col] = pd.to_numeric(df[col], errors='coerce')

    # Convert remaining columns (not explicitly handled) to string and strip whitespace
    for col in df.columns:
        if col not in date_cols and col not in numeric_cols:
            df[col] = df[col].astype(str).str.strip()

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
