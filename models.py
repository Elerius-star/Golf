from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ProductModel(BaseModel):
    name: str
    price: str
    category: str
    description: Optional[str] = ""
    stock: Optional[int] = 0
    image_url: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Wireless Headphones",
                "price": "$99.99",
                "category": "Electronics",
                "description": "Noise-cancelling headphones",
                "stock": 50,
                "image_url": "/products/headphones.jpg"
            }
        }

class QueryRequest(BaseModel):
    query: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "show me electronics"
            }
        }

class ImageUpload(BaseModel):
    filename: str
    content_type: str
    size: int

class OCRResponse(BaseModel):
    extracted_text: str
    confidence: float
    processed_time: float
    image_size: Optional[Dict[str, int]] = None

class QueryResponse(BaseModel):
    response: str
    products: List[ProductModel] = []
    original_query: Optional[str] = None
    query_id: Optional[int] = None
    timestamp: Optional[str] = None
    processing_time: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Here are electronics products:",
                "products": [
                    {
                        "name": "Wireless Headphones",
                        "price": "$99.99",
                        "category": "Electronics"
                    }
                ],
                "original_query": "show electronics",
                "query_id": 1,
                "timestamp": "2024-01-21T10:30:00",
                "processing_time": 0.45
            }
        }

class HealthResponse(BaseModel):
    status: str
    database: bool
    ocr_engine: bool
    timestamp: str
    version: str = "1.0.0"