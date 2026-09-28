from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3
import json
import os
from contextlib import contextmanager

# Import modular components
from database import DatabaseManager, Product, QueryHistory
from models import QueryRequest, QueryResponse, ProductModel

# Initialize FastAPI app
app = FastAPI(
    title="Product Query API",
    description="Backend API for text query interface with product search",
    version="1.0.0"
)

# Configure CORS - Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",  # Live Server default
        "http://localhost:5500",   # Alternative localhost
        "http://127.0.0.1:8000",   # Backend itself
        "http://localhost:3000",   # React/Vue dev servers
        "*"                        # Allow all during development
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize database manager
db_manager = DatabaseManager()

# API endpoints

@app.get("/")
async def root():
    """Root endpoint - API welcome message"""
    return {
        "message": "Product Query API",
        "version": "1.0.0",
        "endpoints": {
            "/docs": "API documentation",
            "/query": "POST - Submit text query",
            "/products": "GET - Get all products",
            "/products/search": "GET - Search products",
            "/history": "GET - Get query history",
            "/health": "GET - API health check"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for frontend monitoring"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": "connected" if db_manager.check_connection() else "disconnected"
    }

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """
    Process text queries and return matching products
    """
    try:
        # Log the query to history
        history_id = db_manager.log_query(
            query_text=request.query,
            response_count=0  # Will update after processing
        )
        
        # Normalize query for processing
        query_text = request.query.lower().strip()
        
        # Initialize response
        response_text = ""
        products = []
        
        # Define product categories and keywords
        categories = {
            "electronics": {
                "keywords": ["electronics", "electronic", "phone", "laptop", "computer", 
                           "headphones", "speaker", "camera", "tv", "television"],
                "response": "Here are some electronics we found for you:"
            },
            "books": {
                "keywords": ["book", "books", "novel", "textbook", "reading", "author"],
                "response": "Books that match your search:"
            },
            "clothing": {
                "keywords": ["clothes", "clothing", "shirt", "pants", "dress", "jacket"],
                "response": "Clothing items available:"
            },
            "home": {
                "keywords": ["home", "furniture", "kitchen", "bed", "table", "chair"],
                "response": "Home and furniture products:"
            }
        }
        
        # Check query against categories
        matched_category = None
        for category, data in categories.items():
            if any(keyword in query_text for keyword in data["keywords"]):
                matched_category = category
                response_text = data["response"]
                break
        
        if matched_category:
            # Get products from database
            products = db_manager.get_products_by_category(matched_category)
            
            if not products:
                # Fallback to sample products if database is empty
                products = get_sample_products(matched_category)
                response_text = f"We found these {matched_category} products:"
        else:
            # General search
            products = db_manager.search_products(query_text)
            if products:
                response_text = f"Found {len(products)} product(s) matching your query:"
            else:
                # Try fuzzy search
                all_products = db_manager.get_all_products()
                if not all_products:
                    all_products = get_sample_products("all")
                
                # Simple keyword matching
                matched_products = []
                for product in all_products:
                    if (any(word in product.name.lower() for word in query_text.split()) or
                        any(word in product.category.lower() for word in query_text.split())):
                        matched_products.append(product)
                
                if matched_products:
                    products = matched_products
                    response_text = f"Found {len(products)} related product(s):"
                else:
                    response_text = "Sorry, we couldn't find any matching products. Try searching for 'electronics', 'books', 'clothing', or 'home' items."
                    products = []
        
        # Update history with response count
        db_manager.update_query_response(history_id, len(products))
        
        # Convert products to dictionary format
        product_dicts = []
        for product in products:
            if hasattr(product, 'to_dict'):
                product_dicts.append(product.to_dict())
            else:
                product_dicts.append({
                    "name": product.name,
                    "price": product.price,
                    "category": product.category,
                    "description": getattr(product, 'description', ''),
                    "stock": getattr(product, 'stock', 0)
                })
        
        return QueryResponse(
            response=response_text,
            products=product_dicts,
            query_id=history_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        # Log the error
        print(f"Error processing query: {str(e)}")
        
        # Return a safe error response
        return QueryResponse(
            response="Sorry, there was an error processing your query. Please try again.",
            products=[],
            error=str(e)
        )

@app.get("/products")
async def get_all_products(category: Optional[str] = None):
    """Get all products, optionally filtered by category"""
    try:
        if category:
            products = db_manager.get_products_by_category(category.lower())
        else:
            products = db_manager.get_all_products()
        
        if not products:
            # Return sample products if database is empty
            products = get_sample_products(category if category else "all")
        
        product_dicts = []
        for product in products:
            if hasattr(product, 'to_dict'):
                product_dicts.append(product.to_dict())
            else:
                product_dicts.append({
                    "name": product.name,
                    "price": product.price,
                    "category": product.category,
                    "description": getattr(product, 'description', ''),
                    "stock": getattr(product, 'stock', 0)
                })
        
        return {
            "count": len(product_dicts),
            "products": product_dicts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/products/search")
async def search_products(query: str):
    """Search products by keyword"""
    try:
        products = db_manager.search_products(query.lower())
        
        if not products:
            # Try sample products
            all_samples = get_sample_products("all")
            matched_samples = [
                p for p in all_samples 
                if query.lower() in p.name.lower() or query.lower() in p.category.lower()
            ]
            products = matched_samples
        
        product_dicts = []
        for product in products:
            if hasattr(product, 'to_dict'):
                product_dicts.append(product.to_dict())
            else:
                product_dicts.append({
                    "name": product.name,
                    "price": product.price,
                    "category": product.category
                })
        
        return {
            "query": query,
            "count": len(product_dicts),
            "products": product_dicts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_query_history(limit: int = 10):
    """Get recent query history"""
    try:
        history = db_manager.get_query_history(limit)
        
        history_list = []
        for item in history:
            if hasattr(item, 'to_dict'):
                history_list.append(item.to_dict())
            else:
                history_list.append({
                    "id": item.id,
                    "query": item.query_text,
                    "timestamp": item.timestamp,
                    "response_count": item.response_count
                })
        
        return {
            "count": len(history_list),
            "history": history_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_sample_products(category: str = "all"):
    """Fallback sample products when database is empty"""
    
    all_products = [
        Product(
            name="Wireless Bluetooth Headphones",
            price="$99.99",
            category="Electronics",
            description="Noise-cancelling over-ear headphones",
            stock=50
        ),
        Product(
            name="Smartphone X12 Pro",
            price="$899.99",
            category="Electronics",
            description="Latest smartphone with 5G",
            stock=30
        ),
        Product(
            name="Laptop UltraBook Pro",
            price="$1299.99",
            category="Electronics",
            description="Lightweight laptop for professionals",
            stock=25
        ),
        Product(
            name="Python Programming Guide",
            price="$39.99",
            category="Books",
            description="Complete guide to Python programming",
            stock=100
        ),
        Product(
            name="Machine Learning Basics",
            price="$49.99",
            category="Books",
            description="Introduction to ML concepts",
            stock=75
        ),
        Product(
            name="Cotton T-Shirt",
            price="$19.99",
            category="Clothing",
            description="100% cotton comfortable t-shirt",
            stock=200
        ),
        Product(
            name="Denim Jeans",
            price="$59.99",
            category="Clothing",
            description="Classic blue denim jeans",
            stock=150
        ),
        Product(
            name="Leather Sofa",
            price="$799.99",
            category="Home",
            description="3-seater leather sofa",
            stock=15
        ),
        Product(
            name="Coffee Table",
            price="$149.99",
            category="Home",
            description="Modern wooden coffee table",
            stock=40
        ),
        Product(
            name="Smart Watch Series 5",
            price="$249.99",
            category="Electronics",
            description="Fitness tracking smartwatch",
            stock=60
        )
    ]
    
    if category == "all":
        return all_products
    else:
        return [p for p in all_products if p.category.lower() == category.lower()]

# Run the application
if __name__ == "__main__":
    import uvicorn
    
    # Create database tables if they don't exist
    db_manager.initialize_database()
    
    # Add some sample data
    db_manager.seed_sample_data()
    
    # Start the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Accessible from any IP
        port=8000,
        reload=True,      # Auto-reload on code changes
        log_level="info"
    )