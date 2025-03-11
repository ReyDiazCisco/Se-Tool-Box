# backend/main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import multipart

from core.routes import router as core_router
from projects.filters.routes import router as filters_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount your routers
app.include_router(core_router, tags=["core"])
app.include_router(filters_router, prefix="/filters", tags=["filters"])

@app.get("/")
def read_root():
    # Return a dict with a "Hello" key, since the frontend uses data.Hello
    return {"Hello": "Welcome to the SE ToolBox!"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, workers=1)
    