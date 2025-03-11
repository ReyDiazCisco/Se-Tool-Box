# backend/projects/filters/logic.py

import pandas as pd
from io import BytesIO
from typing import Dict, List, Union
import uuid

import pyxlsb
from openpyxl import load_workbook

# In-memory store: { session_id: { "df": DataFrame } }
SESSION_DATA = {}

REQUIRED_COLUMNS = [
    "Business Entity",
    "Sub Business Entity",
    "Asset Type",
    "Product Type",
    "Product Family",
    "Product ID",
    "SAV Name",
    "Product Description",
]

def load_excel_to_memory(file_bytes: bytes) -> pd.DataFrame:
    """
    Reads the Excel from 'Powered by Cisco Ready' sheet into a DataFrame.
    Ensures columns are strings and strips whitespace.
    """
    try:
        # Attempt normal .xlsx
        df = pd.read_excel(file_bytes, sheet_name="Powered by Cisco Ready")
    except ValueError:
        # Possibly .xlsb
        df = pd.read_excel(file_bytes, sheet_name="Powered by Cisco Ready", engine="pyxlsb")

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
    session_id = str(uuid.uuid4())
    SESSION_DATA[session_id] = {"df": df}
    return session_id

def apply_filters_incremental(
    df: pd.DataFrame,
    filters: Dict[str, List[Union[str, int, float]]]
) -> pd.DataFrame:
    """
    For each col->list_of_values, keep rows where df[col] is in that list.
    Convert filters to string to match the DataFrame's string columns.
    """
    result = df.copy()
    for col, vals in filters.items():
        if vals:
            str_vals = [str(v).strip() for v in vals]
            result = result[result[col].isin(str_vals)]
    return result

def get_unique_values_for_column(
    session_id: str,
    column: str,
    filters: Dict[str, List[Union[str, int, float]]]
) -> List[str]:
    """
    Given partial filters, return unique sorted values of 'column'.
    """
    if session_id not in SESSION_DATA:
        raise KeyError("Session not found.")
    df = SESSION_DATA[session_id]["df"]

    filtered_df = apply_filters_incremental(df, filters)
    unique_vals = filtered_df[column].dropna().unique()
    unique_vals = sorted(unique_vals, key=lambda x: str(x))
    return list(unique_vals)

def finalize_filter(
    session_id: str,
    filtersA: Dict[str, List[Union[str,int,float]]],
    filtersB: Dict[str, List[Union[str,int,float]]],
    logic_type: str = "difference"
) -> pd.DataFrame:
    """
    Combine 'filtersA' (Set A) and 'filtersB' (Set B) according to logic_type:
      - difference   (A but not B)
      - intersection (A and B)
      - only_a       (just A, ignore B)
      - only_b       (just B, ignore A)
      - union        (A or B)
    """
    if session_id not in SESSION_DATA:
        raise ValueError("Session not found.")

    df = SESSION_DATA[session_id]["df"]

    # 1) Build dfA and dfB
    dfA = apply_filters_incremental(df, filtersA)
    dfB = apply_filters_incremental(df, filtersB)

    if logic_type == "difference":
        # A but not B
        sav_B = set(dfB["SAV Name"].unique())
        final_df = dfA[~dfA["SAV Name"].isin(sav_B)]

    elif logic_type == "intersection":
        # A and B
        sav_A = set(dfA["SAV Name"].unique())
        sav_B = set(dfB["SAV Name"].unique())
        overlap_sav = sav_A.intersection(sav_B)
        final_df = df[df["SAV Name"].isin(overlap_sav)]

    elif logic_type == "only_a":
        # Just A
        final_df = dfA

    elif logic_type == "only_b":
        # Just B
        final_df = dfB

    elif logic_type == "union":
        # A or B
        sav_A = set(dfA["SAV Name"].unique())
        sav_B = set(dfB["SAV Name"].unique())
        union_sav = sav_A.union(sav_B)
        final_df = df[df["SAV Name"].isin(union_sav)]

    else:
        raise ValueError(f"Unknown logic_type: {logic_type}")

    return final_df

def export_excel(
    session_id: str,
    filtersA: Dict[str, List[Union[str,int,float]]],
    filtersB: Dict[str, List[Union[str,int,float]]],
    logic_type: str = "difference"
) -> bytes:
    """
    1) Re-run finalize_filter
    2) Create multiple sheets: Summary, SetA_SKUs, SetB_in_A, Full Report, Pivot
    3) Return .xlsx bytes
    """
    if session_id not in SESSION_DATA:
        raise ValueError("Session not found.")

    df = SESSION_DATA[session_id]["df"]
    final_df = finalize_filter(session_id, filtersA, filtersB, logic_type)

    # Build summary rows
    summary_rows = []
    summary_rows.append(["Set A Filters", "Values"])
    for col, vals in filtersA.items():
        summary_rows.append([col, ", ".join(map(str, vals))])
    summary_rows.append([])

    summary_rows.append(["Set B Filters", "Values"])
    for col, vals in filtersB.items():
        summary_rows.append([col, ", ".join(map(str, vals))])
    summary_rows.append([])

    summary_rows.append(["Logic Type", logic_type])
    summary_rows.append([])

    # Final SAV Names
    sav_names = final_df["SAV Name"].dropna().unique() if not final_df.empty else []
    summary_rows.append(["Final SAV Names", ""])
    for name in sav_names:
        summary_rows.append([name, ""])

    summary_df = pd.DataFrame(summary_rows)

    # For reference: dfA and dfB
    dfA = apply_filters_incremental(df, filtersA)
    dfB = apply_filters_incremental(df, filtersB)

    # Overlap in SAV Name for demonstration (Set B items in A)
    sav_B = set(dfB["SAV Name"].unique())
    B_in_A_df = dfA[dfA["SAV Name"].isin(sav_B)]

    full_report_df = df.copy()

    # Optional pivot
    pivot_df = pd.DataFrame([])
    if not final_df.empty:
        if "Product Family" in final_df.columns and "Product Type" in final_df.columns:
            pivot_df = final_df.pivot_table(
                index="Product Family",
                columns="Product Type",
                values="SAV Name",
                aggfunc=pd.Series.nunique,
                fill_value=0
            ).reset_index()

    # Write sheets to an in-memory Excel
    from io import BytesIO
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        summary_df.to_excel(writer, sheet_name="Summary", header=False, index=False)
        dfA.to_excel(writer, sheet_name="SetA_SKUs", index=False)
        B_in_A_df.to_excel(writer, sheet_name="SetB_in_A", index=False)
        full_report_df.to_excel(writer, sheet_name="Full Report", index=False)
        if not pivot_df.empty:
            pivot_df.to_excel(writer, sheet_name="Pivot Summary", index=False)

    return output.getvalue()
