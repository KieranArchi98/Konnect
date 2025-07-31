from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from app.services.db_service import save_file, list_files
from app.services.db_service import delete_file
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/database", tags=["database"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    print(f"[TRACE] /database/upload endpoint called with file: {file.filename}")
    print(f"Received file upload request: {file.filename}")
    try:
        content = await file.read()
        # Get current user for user_id
        current_user = await get_current_user(request) if request else None
        user_id = current_user.get('id') if current_user else None
        
        result = save_file(file.filename, content, user_id)
        print(f"File saved: {result}")
        return result
    except Exception as e:
        print(f"Error during file upload: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.get("/files")
async def get_files(request: Request):
    print("Fetching file list from database")
    try:
        # Get current user
        current_user = await get_current_user(request)
        user_id = current_user.get('id')
        
        if not user_id:
            print("No user ID found, returning empty list")
            return []
        
        print(f"Filtering files for user_id: {user_id}")
        files = list_files(user_id)
        print(f"Files fetched for user {user_id}: {files}")
        return files
    except Exception as e:
        print(f"Error fetching files: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@router.delete("/delete/{file_id}")
async def delete_file_endpoint(file_id: int, request: Request):
    print(f"[TRACE] /database/delete endpoint called with file_id: {file_id}")
    try:
        # Get current user to verify ownership
        current_user = await get_current_user(request)
        user_id = current_user.get('id')
        
        if not user_id:
            return JSONResponse(status_code=401, content={"detail": "Authentication required"})
        
        result = delete_file(file_id, user_id)
        print(f"File deleted: {result}")
        return result
    except Exception as e:
        print(f"Error during file deletion: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})
