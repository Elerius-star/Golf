from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os

# Initialize FastAPI app
app = FastAPI(title="Image Query API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class QueryRequest(BaseModel):
    query: str

class Product(BaseModel):
    name: str
    price: str
    category: str

class QueryResponse(BaseModel):
    response: str
    products: List[Product] = []

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running!"}

# Process query endpoint
@app.post("/query")
def process_query(request: QueryRequest):
    query = request.query.lower()
    
    if "electronic" in query or "electronics" in query:
        products = [
            {"name": "Wireless Headphones", "price": "$99.99", "category": "Electronics"},
            {"name": "Bluetooth Speaker", "price": "$49.99", "category": "Electronics"},
            {"name": "Smart Watch", "price": "$199.99", "category": "Electronics"}
        ]
        response = "Here are electronics products:"
    elif "book" in query or "books" in query:
        products = [
            {"name": "Python Programming", "price": "$39.99", "category": "Books"},
            {"name": "AI Basics", "price": "$29.99", "category": "Books"}
        ]
        response = "Here are books:"
    elif "clothing" in query or "clothes" in query:
        products = [
            {"name": "Cotton T-Shirt", "price": "$19.99", "category": "Clothing"},
            {"name": "Denim Jeans", "price": "$59.99", "category": "Clothing"}
        ]
        response = "Here are clothing items:"
    else:
        products = []
        response = f"Found results for: '{query}'"
    
    return {"response": response, "products": products}

# Image upload endpoint (simple version)
@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "message": "Image uploaded successfully (demo)"
    }

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Image Query API",
        "endpoints": {
            "/docs": "API documentation",
            "/health": "Health check",
            "/query": "Process text queries",
            "/upload": "Upload images"
        }
    }

# CRITICAL: This block starts the server
if __name__ == "__main__":
    print("🚀 Starting FastAPI server...")
    print("🌐 API will be available at: http://localhost:8000")
    print("📚 Documentation: http://localhost:8000/docs")
    print("Press Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",  # This tells uvicorn to run our app
        host="0.0.0.0",  # Listen on all network interfaces
        port=8000,       # Port 8000
        reload=True      # Auto-reload on code changes
    )