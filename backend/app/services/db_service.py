from passlib.context import CryptContext
from fastapi import HTTPException
from jose import jwt
from app.utils.config import settings
from supabase import create_client, Client
from pinecone import Pinecone as PineconeClient
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangChainPinecone
import openai
import os
import mimetypes
import io
from typing import Optional
import re
from app.utils.datetime_utils import convert_datetime_to_string
try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

def check_supabase_connection():
    """Check Supabase connection without blocking server startup"""
    print(f"Attempting to connect to Supabase: {settings.supabase_url}")
    try:
        # Try a simple select from files table
        response = supabase.table("files").select("id").limit(1).execute()
        print(f"Supabase connection test response: {response}")
        data = getattr(response, 'data', None)
        error = getattr(response, 'error', None)
        if error:
            print(f"⚠️  WARNING: Supabase connection error: {error}")
            print("⚠️  Server will start but database operations may fail")
            return False
        print("✓ Supabase connection successful! Data:", data)
        return True
    except Exception as e:
        print(f"⚠️  WARNING: Supabase connection failed: {e}")
        print("⚠️  Server will start but database operations may fail")
        return False

# Initialize Pinecone client and index (non-blocking)
pc = None
pinecone_index = None

def initialize_pinecone():
    """Initialize Pinecone without blocking server startup"""
    global pc, pinecone_index
    try:
        pc = PineconeClient(api_key=settings.pinecone_api_key)
        pinecone_index = pc.Index(settings.pinecone_index)
        print("✓ Pinecone initialized successfully")
        return True
    except Exception as e:
        print(f"⚠️  WARNING: Pinecone initialization failed: {e}")
        print("⚠️  Server will start but vector operations may fail")
        return False

# Run connection checks at import (non-blocking)
check_supabase_connection()
initialize_pinecone()

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
    if pinecone_index is None:
        print("⚠️  WARNING: Pinecone is not initialized. Skipping embedding and storage.")
        return
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
def save_file(filename: str, content: bytes, user_id: str = None) -> dict:
    print(f"[TRACE] save_file called with filename={filename}, content type={type(content)}, content length={len(content) if hasattr(content, '__len__') else 'unknown'}, user_id={user_id}")
    print(f"Uploading file to Supabase: {filename}")
    if not filename or not isinstance(filename, str):
        print("Invalid filename provided to save_file.")
        raise HTTPException(status_code=400, detail="Invalid filename.")
    if not isinstance(content, (bytes, bytearray)):
        print("Invalid content type provided to save_file.")
        raise HTTPException(status_code=400, detail="Invalid file content type.")
    
    # Step 0: Check for duplicate file name in Supabase DB for this user
    print("[Step 0] Checking for duplicate file name in Supabase DB...")
    duplicate_query = supabase.table("files").select("id").eq("name", filename)
    if user_id:
        duplicate_query = duplicate_query.eq("user_id", user_id)
    duplicate_check = duplicate_query.execute()
    duplicate_data = getattr(duplicate_check, 'data', None)
    if duplicate_data and isinstance(duplicate_data, list) and len(duplicate_data) > 0:
        print(f"[Step 0] Duplicate file found: {filename}")
        raise HTTPException(status_code=400, detail=f"A file with the name '{filename}' already exists.")
    print(f"[Step 0] No duplicate found, proceeding with upload for: {filename}")
    
    # Step 1: Upload original file to Supabase Storage
    print("[Step 1] Uploading original file to Supabase Storage...")
    original_file_path = upload_to_supabase_storage(filename, content)
    print(f"[Step 1] Original file uploaded to storage: {original_file_path}")
    
    # Step 2: Extract text using python-docx only
    print("[Step 2] Extracting text from file using python-docx...")
    content_text: Optional[str] = None
    if DocxDocument:
        try:
            doc = DocxDocument(io.BytesIO(content))
            content_text = '\n'.join([p.text for p in doc.paragraphs])
            # Clean the text to handle emoji and special characters
            if content_text:
                # Remove or replace problematic characters
                content_text = content_text.encode('utf-8', errors='ignore').decode('utf-8')
                # Remove emoji characters that might cause issues
                content_text = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF]', '', content_text)
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
    file_data = {
        "name": filename, 
        "content": content_text or '', 
        "supabase_path": original_file_path
    }
    
    # Add user_id if provided
    if user_id:
        file_data["user_id"] = user_id
    
    response = supabase.table("files").insert(file_data).execute()
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
            embed_and_store_chunks(chunks, file_id, original_file_path)
            print(f"[Step 5] Successfully embedded and stored {len(chunks)} chunks in Pinecone.")
        except Exception as e:
            print(f"[Step 4/5] Error embedding/storing chunks: {e}")
    else:
        print("[Step 4] No text extracted, skipping chunking and embedding.")
    
    print(f"[Final] File processing complete for: {filename}")
    return {
        "file_id": file_id, 
        "filename": filename, 
        "status": "Uploaded", 
        "supabase_path": original_file_path
    }

def list_files(user_id: str = None) -> list:
    print(f"Querying files from Supabase database for user_id: {user_id}")
    try:
        # Build query with user filter if provided - try without created_at first
        query = supabase.table("files").select("id, name, supabase_path")
        if user_id:
            query = query.eq("user_id", user_id)
        
        response = query.execute()
    except Exception as e:
        print(f"Error fetching files: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
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
    print(f"Files returned for user {user_id}: {data}")
    return convert_datetime_to_string(data)

def delete_file(file_id: int, user_id: str = None) -> dict:
    print(f"[Delete] Starting deletion process for file_id: {file_id}, user_id: {user_id}")
    
    # 1. Fetch file metadata
    query = supabase.table("files").select("name, supabase_path, user_id").eq("id", file_id).single()
    response = query.execute()
    error = getattr(response, 'error', None)
    data = getattr(response, 'data', None)
    if error or not data:
        print(f"[Delete] File not found or error: {error}")
        raise HTTPException(status_code=404, detail="File not found.")
    
    filename = data["name"]
    supabase_path = data["supabase_path"]
    file_user_id = data.get("user_id")
    
    # Verify user ownership if user_id is provided
    if user_id and file_user_id and file_user_id != user_id:
        print(f"[Delete] Access denied: file belongs to user {file_user_id}, but user {user_id} is trying to delete it")
        raise HTTPException(status_code=403, detail="Access denied: You can only delete your own files.")
    
    print(f"[Delete] File metadata: name={filename}, supabase_path={supabase_path}, user_id={file_user_id}")
    
    # 2. Delete original file from Supabase Storage
    try:
        bucket = "files"
        print(f"[Delete] Deleting original file from Supabase Storage: {supabase_path}")
        res = supabase.storage.from_(bucket).remove(supabase_path)
        print(f"[Delete] Original file Supabase Storage remove response: {res}")
    except Exception as e:
        print(f"[Delete] Error deleting original file from Supabase Storage: {e}")
        # Continue with deletion even if storage deletion fails
    
    # 3. Delete all associated vectors from Pinecone
    if pinecone_index is None:
        print(f"[Delete] WARNING: Pinecone is not initialized. Skipping vector deletion for file_id: {file_id}")
    else:
        try:
            print(f"[Delete] Deleting vectors from Pinecone for file_id: {file_id}")
            
            # Get all vector IDs for this file using metadata filter
            # Pinecone allows filtering by metadata, so we can find all vectors for this file
            try:
                # Try to delete vectors using metadata filter
                pinecone_index.delete(
                    filter={"file_id": str(file_id)}
                )
                print(f"[Delete] Successfully deleted vectors using metadata filter for file_id: {file_id}")
            except Exception as metadata_error:
                print(f"[Delete] Metadata filter deletion failed, trying alternative method: {metadata_error}")
                
                # Fallback: Try to delete vectors using ID pattern
                # Generate possible vector IDs based on the file_id
                vector_ids = []
                for i in range(1000):  # Assume max 1000 chunks per file
                    vector_ids.append(f"file{file_id}_chunk{i}")
                
                try:
                    pinecone_index.delete(ids=vector_ids)
                    print(f"[Delete] Successfully deleted vectors using ID pattern for file_id: {file_id}")
                except Exception as id_error:
                    print(f"[Delete] ID pattern deletion also failed: {id_error}")
                    # Continue with deletion even if Pinecone deletion fails
                    print(f"[Delete] Warning: Pinecone vectors may not have been deleted for file_id: {file_id}")
                    
        except Exception as e:
            print(f"[Delete] Error deleting vectors from Pinecone: {e}")
            # Continue with deletion even if Pinecone deletion fails
            print(f"[Delete] Warning: Pinecone vectors may not have been deleted for file_id: {file_id}")
    
    # 4. Delete metadata row from files table
    try:
        print(f"[Delete] Deleting metadata row from files table for file_id: {file_id}")
        del_response = supabase.table("files").delete().eq("id", file_id).execute()
        print(f"[Delete] Supabase DB delete response: {del_response}")
        
        error = getattr(del_response, 'error', None)
        if error:
            print(f"[Delete] Error in Supabase DB delete response: {error}")
            raise HTTPException(status_code=500, detail="Failed to delete file metadata from database.")
            
    except Exception as e:
        print(f"[Delete] Error deleting metadata row: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete file metadata.")
    
    print(f"[Delete] File deletion complete for file_id: {file_id}")
    return {
        "status": "deleted", 
        "file_id": file_id, 
        "filename": filename
    }
