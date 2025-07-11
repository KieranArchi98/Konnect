from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix='/database', tags=['database'])

@router.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    return {'filename': file.filename, 'status': 'Uploaded'}

@router.get('/files')
async def list_files():
    return [{'id': '789', 'name': 'sample.txt'}]
