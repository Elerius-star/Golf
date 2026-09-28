import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import io
import os
import time
from typing import Optional, Tuple, Dict, Any
import numpy as np

class OCRProcessor:
    def __init__(self):
        # Check if Tesseract is installed
        try:
            pytesseract.get_tesseract_version()
            self.tesseract_available = True
        except:
            self.tesseract_available = False
            print("Warning: Tesseract OCR not installed. Install from: https://github.com/UB-Mannheim/tesseract/wiki")
        
        # Configure Tesseract path for Windows (if needed)
        if os.name == 'nt' and self.tesseract_available:
            # Common Tesseract installation paths on Windows
            possible_paths = [
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    break
    
    def is_available(self) -> bool:
        """Check if OCR engine is available"""
        return self.tesseract_available
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        # Convert to grayscale
        if image.mode != 'L':
            image = image.convert('L')
        
        # Increase contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2)
        
        # Sharpen image
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2)
        
        # Remove noise
        image = image.filter(ImageFilter.MedianFilter(size=3))
        
        # Threshold to binary
        image = image.point(lambda x: 0 if x < 140 else 255)
        
        return image
    
    def extract_text(self, image_data: bytes, preprocess: bool = True) -> Dict[str, Any]:
        """Extract text from image using OCR"""
        if not self.tesseract_available:
            return {
                "extracted_text": "",
                "confidence": 0.0,
                "error": "OCR engine not available",
                "processed": False
            }
        
        start_time = time.time()
        
        try:
            # Open image
            image = Image.open(io.BytesIO(image_data))
            
            # Store original size
            original_size = image.size
            
            # Preprocess if requested
            if preprocess:
                image = self.preprocess_image(image)
            
            # Configure Tesseract parameters for handwriting
            custom_config = r'--oem 3 --psm 6'
            
            # Extract text with confidence
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT, config=custom_config)
            
            # Combine text with reasonable confidence
            extracted_text = []
            confidence_sum = 0
            confidence_count = 0
            
            for i in range(len(data['text'])):
                text = data['text'][i].strip()
                conf = float(data['conf'][i])
                
                if text and conf > 20:  # Minimum confidence threshold
                    extracted_text.append(text)
                    confidence_sum += conf
                    confidence_count += 1
            
            # Calculate average confidence
            avg_confidence = confidence_sum / max(confidence_count, 1)
            
            # Join text
            final_text = ' '.join(extracted_text)
            
            processing_time = time.time() - start_time
            
            return {
                "extracted_text": final_text,
                "confidence": round(avg_confidence, 2),
                "processed": True,
                "processing_time": round(processing_time, 3),
                "image_size": {
                    "width": original_size[0],
                    "height": original_size[1]
                },
                "word_count": len(extracted_text)
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            return {
                "extracted_text": "",
                "confidence": 0.0,
                "error": str(e),
                "processed": False,
                "processing_time": round(processing_time, 3)
            }
    
    def extract_text_from_file(self, file_path: str, preprocess: bool = True) -> Dict[str, Any]:
        """Extract text from image file"""
        try:
            with open(file_path, 'rb') as f:
                image_data = f.read()
            return self.extract_text(image_data, preprocess)
        except Exception as e:
            return {
                "extracted_text": "",
                "confidence": 0.0,
                "error": str(e),
                "processed": False
            }