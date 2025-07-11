from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.db_service import save_file, list_files
from app.services.db_service import delete_file

router = APIRouter(prefix="/database", tags=["database"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    print(f"[TRACE] /database/upload endpoint called with file: {file.filename}")
    print(f"Received file upload request: {file.filename}")
    try:
        content = await file.read()
        result = save_file(file.filename, content)
        print(f"File saved: {result}")
        return result
    except Exception as e:
        print(f"Error during file upload: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/files")
async def get_files():
    print("Fetching file list from database")
    try:
        files = list_files()
        print(f"Files fetched: {files}")
        return files
    except Exception as e:
        print(f"Error fetching files: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.delete("/delete/{file_id}")
async def delete_file_endpoint(file_id: int):
    print(f"[TRACE] /database/delete endpoint called with file_id: {file_id}")
    try:
        result = delete_file(file_id)
        print(f"File deleted: {result}")
        return result
    except Exception as e:
        print(f"Error during file deletion: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})
