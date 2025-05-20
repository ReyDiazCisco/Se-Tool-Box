# backend/projects/pipeline_identification/routes.py

from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from .schemas import IdentificationCriteria, OpportunityResponse, UploadRequest
from .logic import (
    start_new_session,
    get_columns,  # Make sure get_columns is imported
    identify_opportunities,  # Assume identify_opportunities can return all columns for session ID check
    get_unique_column_values,
    export_opportunities,
)
import uuid # Import uuid
import pandas as pd # Import pandas


from .logic import load_df_for_session
router = APIRouter()

@router.post("/upload")
async def upload_pipeline_identifier_file(file: UploadFile = File(...)):
    """
    Upload the Excel file, store DataFrame in memory, return session_id
    """
    try:
        # Read the file content asynchronously
        file_bytes = await file.read()
        session_id = start_new_session(file_bytes)
        return {"session_id": session_id}
    except Exception as e:
        # Log the error for debugging
        print(f"Error in upload_pipeline_identifier_file: {e}")
        raise HTTPException(status_code=400, detail=f"Error processing file: {e}")


@router.get("/columns/{file_id}")
def get_pipeline_identifier_columns(file_id: str):
    """
    Retrieve column information for a given file ID in pipeline identification.
    """
    try:
        columns = get_columns(file_id)
        return {"columns": columns}
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_pipeline_identifier_columns: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving columns: {e}")


@router.get("/columns/{session_id}/values")
def get_pipeline_identifier_column_values(
    session_id: str,
    column: str = Query(..., description="Column name to fetch values for")
):
    """
    Retrieve unique values for a specific column for a given session ID.
    """
    print(f"Received request for unique values for column: {column} for session: {session_id}")
    # Assume load_df_for_session is implemented elsewhere to load the DataFrame
    # for the given session_id.    # Load the DataFrame
    try:
        df = load_df_for_session(session_id)
        print(f"DataFrame columns: {df.columns.tolist()}")
        
        if column not in df.columns:
            raise HTTPException(status_code=404, detail=f"Column '{column}' not found")

        unique_vals = df[column].dropna().unique().tolist()
        return {"values": unique_vals}
    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_pipeline_identifier_column_values: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving column values: {e}") # Consider a more specific error for unexpected issues


@router.post("/identify")
def identify_potential_opportunities(criteria: IdentificationCriteria) -> OpportunityResponse:
    """
    Identify potential opportunities based on provided criteria
    """
    try:
        opportunities_df = identify_opportunities(criteria.session_id, criteria.criteria)
        # Select and rename columns according to the Opportunity schema
        opportunities = opportunities_df.rename(columns={
            "SAV Name": "sav_name",
            "Install Site GU Name": "install_site_gu_name",
            "Covered Line End Date": "covered_line_end_date",
            "Product Family": "product_family",
            # Add other relevant column renames here
        }).to_dict(orient="records") # Convert DataFrame rows to list of dictionaries
        return {"opportunities": opportunities}
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception as e:
        # Log the error for debugging
        print(f"Error in identify_potential_opportunities: {e}")
        raise HTTPException(status_code=400, detail=f"Error identifying opportunities: {e}")


@router.post("/export")
def export_potential_opportunities(criteria: IdentificationCriteria):
    """
    Export potential opportunities to an Excel file
    """
    try:
        opportunities_df = identify_opportunities(criteria.session_id, criteria.criteria)
        excel_bytes = export_opportunities(opportunities_df)
        return Response(content=excel_bytes, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=PotentialOpportunities.xlsx"})
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception as e:
        # Log the error for debugging
        print(f"Error in export_potential_opportunities: {e}")
        raise HTTPException(status_code=400, detail=f"Error exporting opportunities: {e}")
