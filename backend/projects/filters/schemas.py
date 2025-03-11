# backend/projects/filters/schemas.py

from pydantic import BaseModel
from typing import Dict, List, Union
from typing_extensions import Literal  # or `from typing import Literal` in Python 3.8+

class UniqueValuesRequest(BaseModel):
    """
    For /uniqueValues:
    {
      "session_id": "...",
      "column": "Product ID",
      "filters": {
        "Business Entity": [...],
        "Sub Business Entity": [...],
        ...
      }
    }
    """
    session_id: str
    column: str
    filters: Dict[str, List[Union[str, int, float]]]

class FinalizeRequest(BaseModel):
    """
    For /finalize and /export:
    {
      "session_id": "...",
      "filtersA": {
         "Business Entity": [...],
         "Product Family": [...],
         ...
      },
      "filtersB": {
         "Business Entity": [...],
         "Product Family": [...],
         ...
      },
      "logic_type": "difference" | "intersection" | "only_a" | "only_b" | "union"
    }
    """
    session_id: str
    filtersA: Dict[str, List[Union[str, int, float]]]
    filtersB: Dict[str, List[Union[str, int, float]]]
    logic_type: Literal[
        "difference",
        "intersection",
        "only_a",
        "only_b",
        "union"
    ] = "difference"
