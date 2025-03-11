# backend/core/routes.py
from fastapi import APIRouter
import sys
import psutil
import os
import multipart


router = APIRouter()

@router.get("/shutdown")
async def shutdown():
    """
    Gracefully shuts down the server by calling sys.exit(0).
    Also kills any child processes if needed.
    """
    this_process = psutil.Process(os.getpid())
    for child in this_process.children(recursive=True):
        print(f"Killing child process: {child.pid}")
        child.kill()

    print("Calling sys.exit(0) in /shutdown")
    sys.exit(0)
