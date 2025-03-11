# backend/projects/filters/routes.py

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import Response
from .schemas import UniqueValuesRequest, FinalizeRequest
from .logic import (
    start_new_session,
    get_unique_values_for_column,
    finalize_filter,
    export_excel,
)

router = APIRouter()

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

@router.post("/uniqueValues")
def get_next_column_values(request_data: UniqueValuesRequest):
    """
    Return unique values for a column, given partial filters so far
    """
    try:
        values = get_unique_values_for_column(
            request_data.session_id,
            request_data.column,
            request_data.filters
        )
        return {"values": values}
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/finalize")
def finalize_selection(request_data: FinalizeRequest):
    """
    Finalize filter using filtersA, filtersB, and logic_type
    Return final SAV Names
    """
    try:
        final_df = finalize_filter(
            request_data.session_id,
            request_data.filtersA,
            request_data.filtersB,
            request_data.logic_type
        )
        sav_names = final_df["SAV Name"].dropna().unique().tolist() if not final_df.empty else []
        return {"savNames": sav_names}
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/export")
def export_filtered_excel(request_data: FinalizeRequest):
    """
    Similar to finalize, but returns an Excel file
    """
    try:
        excel_bytes = export_excel(
            request_data.session_id,
            request_data.filtersA,
            request_data.filtersB,
            request_data.logic_type
        )
        return Response(
            content=excel_bytes,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": "attachment; filename=FilteredResult.xlsx"
            },
        )
    except KeyError:
        raise HTTPException(status_code=404, detail="Session not found.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
