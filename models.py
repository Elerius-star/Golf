from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProductModel(BaseModel):
    """Product data model for API responses"""
    name: str
    price: str
    category: str
    description: Optional[str] = ""
    stock: Optional[int] = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Wireless Headphones",
                "price": "$99.99",
                "category": "Electronics",
                "description": "Noise-cancelling headphones",
                "stock": 50
            }
        }

class QueryRequest(BaseModel):
    """Request model for text queries"""
    query: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "query": "Show me electronics products"
            }
        }

class QueryResponse(BaseModel):
    """Response model for query results"""
    response: str
    products: List[ProductModel] = []
    query_id: Optional[int] = None
    timestamp: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Here are some electronics we found:",
                "products": [
                    {
                        "name": "Wireless Headphones",
                        "price": "$99.99",
                        "category": "Electronics"
                    }
                ],
                "query_id": 1,
                "timestamp": "2024-01-15T10:30:00"
            }
        }