# backend/projects/pipeline_identification/routes.py

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from .schemas import IdentificationCriteria, OpportunityResponse, UploadRequest
from .logic import (
    start_new_session,
    identify_opportunities,
    export_opportunities,
)

router = APIRouter()

@router.post("/pipeline-identifier/upload")
async def upload_pipeline_identifier_file(file: UploadFile = File(...)):
    """
    Receive and process the uploaded file for pipeline identification.
    """
    try:
        # For now, just confirm the file was received.
        return {"message": f"File '{file.filename}' received successfully for pipeline identification."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {e}")

@router.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """
    Upload the Excel file, store DataFrame in memory, return session_id
    """
    try:
        file_bytes = file.file.read()
        session_id = start_new_session(file_bytes)
        return {"session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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
        raise HTTPException(status_code=400, detail=str(e))

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
        raise HTTPException(status_code=400, detail=str(e))