from passlib.context import CryptContext
from fastapi import HTTPException
from jose import jwt
from app.utils.config import settings
from supabase import create_client, Client
from pinecone import Pinecone
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
import openai
import os
import mimetypes
from typing import Optional
import re
try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

def check_supabase_connection():
    print(f"Attempting to connect to Supabase: {settings.supabase_url}")
    try:
        # Try a simple select from files table
        response = supabase.table("files").select("id").limit(1).execute()
        print(f"Supabase connection test response: {response}")
        data = getattr(response, 'data', None)
        error = getattr(response, 'error', None)
        if error:
            print(f"Supabase connection error: {error}")
            raise Exception(f"Supabase connection error: {error}")
        print("Supabase connection successful! Data:", data)
    except Exception as e:
        print(f"Supabase connection failed: {e}")
        raise

# Run connection check at import
check_supabase_connection()

# Initialize Pinecone client and index
pc = Pinecone(api_key=settings.pinecone_api_key)
pinecone_index = pc.Index(settings.pinecone_index)

# Initialize OpenAI
openai.api_key = settings.openai_api_key

def register_user(email: str, password: str) -> dict:
    hashed_password = pwd_context.hash(password)
    response = supabase.table("users").insert({"email": email, "password": hashed_password}).execute()
    if response.status_code not in (200, 201):
        raise HTTPException(status_code=400, detail=str(response.data))
    user_id = response.data[0]["id"]
    return {"user_id": user_id, "email": email}

def authenticate_user(email: str, password: str) -> str:
    response = supabase.table("users").select("id, password").eq("email", email).single().execute()
    user = response.data
    if user and pwd_context.verify(password, user["password"]):
        return jwt.encode({"sub": str(user["id"])} , settings.jwt_secret, algorithm="HS256")
    raise HTTPException(status_code=401, detail="Invalid credentials")

def update_user(email: str) -> dict:
    print(f"Updating user with email: {email}")
    if not email or not isinstance(email, str):
        print("Invalid email provided to update_user.")
        raise HTTPException(status_code=400, detail="Invalid email.")
    try:
        response = supabase.table("users").update({"email": email}).eq("email", email).execute()
        print(f"Supabase update response: {response}")
        error = getattr(response, 'error', None)
        data = getattr(response, 'data', None)
        if error:
            print(f"Error updating user: {error}")
            raise HTTPException(status_code=400, detail=str(error))
        return {"status": "Updated"}
    except Exception as e:
        print(f"Exception in update_user: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user.")

# Helper: Upload file to Supabase Storage
def upload_to_supabase_storage(filename: str, content: bytes) -> str:
    bucket = "files"  # Ensure this bucket exists in Supabase
    print(f"Uploading to Supabase Storage: bucket={bucket}, filename={filename}, content_type={type(content)}")
    if not isinstance(content, (bytes, bytearray)):
        print(f"Invalid content type for upload: {type(content)}")
        raise HTTPException(status_code=400, detail="File content must be bytes.")
    res = supabase.storage.from_(bucket).upload(filename, content)
    print(f"Supabase storage upload response: {res}")
    # Check for error in UploadResponse (supabase-py returns an object, not a dict)
    if hasattr(res, 'error') and res.error:
        print(f"Supabase upload error: {res.error}")
        raise Exception(f"Supabase upload error: {res.error}")
    if hasattr(res, 'status_code') and res.status_code and res.status_code >= 400:
        print(f"Supabase upload failed with status code: {res.status_code}")
        raise Exception(f"Supabase upload failed with status code: {res.status_code}")
    return f"{bucket}/{filename}"

# Helper: Chunk file using LangChain
def chunk_file(content: str) -> list:
    print("[Chunking] Starting text chunking with RecursiveCharacterTextSplitter...")
    # Remove 'To-Do List' sections before chunking
    # This regex removes from 'To-Do List' (case-insensitive) to the next all-caps header or end of text
    content_cleaned = re.sub(r'To-Do List.*?(?=\n[A-Z][A-Za-z ]{2,}\n|$)', '', content, flags=re.IGNORECASE|re.DOTALL)
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(content_cleaned)
    print(f"[Chunking] Completed chunking: {len(chunks)} chunks created.")
    return chunks

# Helper: Embed chunks and upload to Pinecone
def embed_and_store_chunks(chunks: list, file_id: int, file_path: str):
    print(f"[Embedding] Starting embedding of {len(chunks)} chunks using OpenAI embeddings...")
    embedder = OpenAIEmbeddings(openai_api_key=settings.openai_api_key)
    embeddings = embedder.embed_documents(chunks)
    print(f"[Embedding] Embedding complete. {len(embeddings)} embeddings generated.")
    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"file{file_id}_chunk{i}",
            "values": embedding,
            "metadata": {"file_id": file_id, "chunk_index": i, "text": chunk, "file_path": file_path}
        })
    print(f"[Pinecone] Uploading {len(vectors)} vectors to Pinecone index...")
    pinecone_index.upsert(vectors=vectors)
    print(f"[Pinecone] Successfully uploaded {len(vectors)} vectors to Pinecone.")

# Main save_file logic

def save_file(filename: str, content: bytes) -> dict:
    print(f"[TRACE] save_file called with filename={filename}, content type={type(content)}, content length={len(content) if hasattr(content, '__len__') else 'unknown'}")
    print(f"Uploading file to Supabase: {filename}")
    if not filename or not isinstance(filename, str):
        print("Invalid filename provided to save_file.")
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not isinstance(content, (bytes, bytearray)):
        print("Invalid content type provided to save_file.")
        raise HTTPException(status_code=400, detail="Invalid file content type.")
    # Step 0: Check for duplicate file name in Supabase DB
    print("[Step 0] Checking for duplicate file name in Supabase DB...")
    duplicate_check = supabase.table("files").select("id").eq("name", filename).execute()
    duplicate_data = getattr(duplicate_check, 'data', None)
    if duplicate_data and isinstance(duplicate_data, list) and len(duplicate_data) > 0:
        print(f"[Step 0] Duplicate file found: {filename}")
        raise HTTPException(status_code=400, detail=f"A file with the name '{filename}' already exists.")
    print(f"[Step 0] No duplicate found, proceeding with upload for: {filename}")
    # Step 1: Upload to Supabase Storage
    print("[Step 1] Uploading to Supabase Storage...")
    file_path = upload_to_supabase_storage(filename, content)
    print(f"[Step 1] File uploaded to storage: {file_path}")
    # Step 2: Extract text using python-docx only
    print("[Step 2] Extracting text from file using python-docx...")
    content_text: Optional[str] = None
    import io
    if DocxDocument:
        try:
            doc = DocxDocument(io.BytesIO(content))
            content_text = '\n'.join([p.text for p in doc.paragraphs])
            print(f"[Step 2] Extracted text from docx: {len(content_text)} characters")
        except Exception as e:
            print(f"[Step 2] Error extracting text from docx: {e}")
            content_text = ''
    else:
        print("[Step 2] python-docx is not installed. Cannot extract text from docx.")
        content_text = ''
    print(f"[Step 2] content_text value: '{content_text[:100] if content_text else content_text}' (truncated)")
    if not content_text:
        print("[Step 2] WARNING: No text extracted from file. The content column will be empty and chunking/embedding will be skipped.")
    # Step 3: Store file metadata in Supabase DB
    print("[Step 3] Storing file metadata in Supabase DB...")
    response = supabase.table("files").insert({"name": filename, "content": content_text or '', "supabase_path": file_path}).execute()
    print(f"[Step 3] Supabase insert response: {response}")
    error = getattr(response, 'error', None)
    data = getattr(response, 'data', None)
    if error:
        print(f"[Step 3] Error inserting file metadata: {error}")
        raise HTTPException(status_code=400, detail=str(error))
    if data is None:
        try:
            data = response.json()
        except Exception:
            data = None
    if data is None or not isinstance(data, list) or not data:
        print(f"[Step 3] No data returned from Supabase after insert. Data: {data}")
        raise HTTPException(status_code=400, detail="No data returned from Supabase after insert.")
    file_id = data[0].get("id")
    if file_id is None:
        print(f"[Step 3] No file_id in Supabase insert response: {data}")
        raise HTTPException(status_code=400, detail="No file_id returned from Supabase.")
    # Step 4: Chunk and embed only if text was extracted
    if content_text:
        try:
            print("[Step 4] Chunking file text...")
            chunks = chunk_file(content_text)
            print(f"[Step 4] Chunked into {len(chunks)} chunks.")
            print("[Step 5] Embedding and storing chunks in Pinecone...")
            embed_and_store_chunks(chunks, file_id, file_path)
            print(f"[Step 5] Successfully embedded and stored {len(chunks)} chunks in Pinecone.")
        except Exception as e:
            print(f"[Step 4/5] Error embedding/storing chunks: {e}")
    else:
        print("[Step 4] No text extracted, skipping chunking and embedding.")
    print(f"[Final] File processing complete for: {filename}")
    return {"file_id": file_id, "filename": filename, "status": "Uploaded", "supabase_path": file_path}

def list_files() -> list:
    print("Querying files from Supabase database...")
    response = supabase.table("files").select("id, name, supabase_path").execute()
    print(f"Supabase select response: {response}")
    error = getattr(response, 'error', None)
    data = getattr(response, 'data', None)
    if error:
        print(f"Error fetching files: {error}")
        raise HTTPException(status_code=400, detail=str(error))
    if data is None:
        try:
            data = response.json()
        except Exception:
            data = None
    # Only raise if data is None, not if it's an empty list
    if data is None:
        print("No data returned from Supabase (data is None)")
        raise HTTPException(status_code=400, detail="No data returned from Supabase")
    if not isinstance(data, list):
        print(f"Unexpected data type from Supabase: {type(data)}")
        raise HTTPException(status_code=500, detail="Unexpected data type from Supabase")
    print(f"Files returned: {data}")
    return data

def delete_file(file_id: int) -> dict:
    print(f"[Delete] Starting deletion process for file_id: {file_id}")
    # 1. Fetch file metadata
    response = supabase.table("files").select("name, supabase_path").eq("id", file_id).single().execute()
    error = getattr(response, 'error', None)
    data = getattr(response, 'data', None)
    if error or not data:
        print(f"[Delete] File not found or error: {error}")
        raise HTTPException(status_code=404, detail="File not found.")
    filename = data["name"]
    supabase_path = data["supabase_path"]
    print(f"[Delete] File metadata: name={filename}, supabase_path={supabase_path}")
    # 2. Delete from Supabase Storage
    try:
        bucket = "files"
        print(f"[Delete] Deleting file from Supabase Storage: {supabase_path}")
        res = supabase.storage.from_(bucket).remove(supabase_path)
        print(f"[Delete] Supabase Storage remove response: {res}")
    except Exception as e:
        print(f"[Delete] Error deleting from Supabase Storage: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file from storage.")
    # 3. Delete all associated vectors from Pinecone
    try:
        print(f"[Delete] Deleting vectors from Pinecone for file_id: {file_id}")
        # Find all vector IDs for this file
        # We assume vector IDs are in the format file{file_id}_chunk{i}
        # Pinecone does not support wildcards, so we fetch all IDs and filter
        index_stats = pinecone_index.describe_index_stats()
        all_ids = []
        for ns, stats in index_stats["namespaces"].items():
            all_ids.extend(stats.get("vector_count", 0))
        # Instead, we will try to delete by prefix (if supported) or by generating IDs
        # For now, let's try deleting up to 1000 chunks
        vector_ids = [f"file{file_id}_chunk{i}" for i in range(1000)]
        pinecone_index.delete(ids=vector_ids)
        print(f"[Delete] Requested deletion of up to 1000 vectors for file_id: {file_id}")
    except Exception as e:
        print(f"[Delete] Error deleting vectors from Pinecone: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete vectors from Pinecone.")
    # 4. Delete metadata row from files table
    try:
        print(f"[Delete] Deleting metadata row from files table for file_id: {file_id}")
        del_response = supabase.table("files").delete().eq("id", file_id).execute()
        print(f"[Delete] Supabase DB delete response: {del_response}")
    except Exception as e:
        print(f"[Delete] Error deleting metadata row: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file metadata.")
    print(f"[Delete] File deletion complete for file_id: {file_id}")
    return {"status": "deleted", "file_id": file_id, "filename": filename}
