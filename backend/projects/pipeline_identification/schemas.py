# backend/projects/pipeline_identification/schemas.py

from pydantic import BaseModel
from typing import Dict, List, Union, Optional
from datetime import date

class UploadRequest(BaseModel):
    """
    Schema for file upload request.
    Although the file is sent as form-data,
    a schema can be useful for documentation or potential future JSON uploads.
    """
    # In a typical file upload, the file itself is not in the JSON body,
    # but rather sent as multipart/form-data.
    # This schema primarily serves for documentation.
    pass # File will be handled via File = UploadFile(...) in the route

class StringFilter(BaseModel):
    values: List[str] = []  # List of exact string values to match
    # Add other potential string filtering options here (e.g., contains, starts_with, ends_with)

class NumberFilter(BaseModel):
    min: Optional[Union[int, float]] = None  # Minimum value for range filtering
    max: Optional[Union[int, float]] = None  # Maximum value for range filtering
    values: List[Union[int, float]] = [] # List of exact numerical values to match

class DateFilter(BaseModel):
    start_date: Optional[date] = None  # Start date for range filtering
    end_date: Optional[date] = None    # End date for range filtering
    # Add other potential date filtering options here (e.g., specific dates)

class IdentificationCriteria(BaseModel):
    """
    Schema for defining pipeline identification criteria.
    A dictionary where keys are column names and values are the filter criteria.
    The type of filter depends on the data type of the column.
    """
    criteria: Dict[str, Union[StringFilter, NumberFilter, DateFilter]] = {}
    # Add other potential top-level criteria here (e.g., logic for combining filters)

class Opportunity(BaseModel):
    """
    Schema for representing an identified opportunity.
    Defines the fields to be returned for each opportunity.
    """
    sav_name: str
    install_site_gu_name: Optional[str] = None
    covered_line_end_date: Optional[date] = None
    product_family: Optional[str] = None
    # Add other relevant fields here

class OpportunityResponse(BaseModel):
    """
    Schema for the response containing identified opportunities.
    A list of Opportunity models.
    """
    opportunities: List[Opportunity]

class ExportRequest(BaseModel):
    """
    Schema for requesting an export of identified opportunities.
    Includes the session_id and the criteria used.
    """
    session_id: str
    criteria: IdentificationCriteria # Include criteria for consistent export
