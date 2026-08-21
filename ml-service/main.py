from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging
from kb import knowledge_base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Prenatal Risk Prediction ML Service", version="1.0.0")

class HealthData(BaseModel):
    user_id: str
    maternal_age: Optional[int] = None
    gestational_age: Optional[int] = None
    blood_pressure: Optional[str] = None
    blood_sugar: Optional[float] = None
    heart_rate: Optional[int] = None
    temperature: Optional[float] = None

class PredictionResponse(BaseModel):
    risk: str
    confidence: float
    model_version: str
    features_used: list[str]
    prediction_id: str

class ModelTrainingRequest(BaseModel):
    training_data: list[Dict[str, Any]]
    features: list[str]
    target_column: str

class KBChunk(BaseModel):
    id: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

class KBIngestRequest(BaseModel):
    chunks: List[KBChunk]
    replace: bool = False

class KBQueryRequest(BaseModel):
    text: str
    top_k: int = 4
    min_score: Optional[float] = None

# Global variables for model and scaler
model = None
scaler = None
model_version = "1.0.0"
feature_columns = [
    'maternal_age',
    'gestational_age', 
    'systolic_bp',
    'diastolic_bp',
    'blood_sugar',
    'heart_rate',
    'temperature'
]

def initialize_model():
    """Initialize or load the trained model"""
    global model, scaler
    
    try:
        # Try to load existing model
        if os.path.exists('model.joblib') and os.path.exists('scaler.joblib'):
            model = joblib.load('model.joblib')
            scaler = joblib.load('scaler.joblib')
            logger.info("Loaded existing model and scaler")
        else:
            # Create a new model with default parameters
            model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )
            scaler = StandardScaler()
            
            # Train with synthetic data for initial deployment
            train_with_synthetic_data()
            
            # Save the model
            joblib.dump(model, 'model.joblib')
            joblib.dump(scaler, 'scaler.joblib')
            logger.info("Created and saved new model with synthetic data")
            
    except Exception as e:
        logger.error(f"Error initializing model: {e}")
        raise

def train_with_synthetic_data():
    """Train model with synthetic prenatal data"""
    global model, scaler
    
    # Generate synthetic data
    np.random.seed(42)
    n_samples = 1000
    
    synthetic_data = {
        'maternal_age': np.random.normal(28, 5, n_samples),
        'gestational_age': np.random.uniform(0, 42, n_samples),
        'systolic_bp': np.random.normal(120, 15, n_samples),
        'diastolic_bp': np.random.normal(80, 10, n_samples),
        'blood_sugar': np.random.normal(95, 20, n_samples),
        'heart_rate': np.random.normal(75, 10, n_samples),
        'temperature': np.random.normal(98.6, 0.8, n_samples)
    }
    
    df = pd.DataFrame(synthetic_data)
    
    # Create risk labels based on medical heuristics
    risk_conditions = [
        (df['systolic_bp'] > 140) | (df['diastolic_bp'] > 90),  # Hypertension
        (df['blood_sugar'] > 120),  # High blood sugar
        (df['maternal_age'] < 18) | (df['maternal_age'] > 35),  # Age risk
        (df['gestational_age'] > 38) & (df['blood_sugar'] > 100),  # Late term with high sugar
    ]
    
    risk_scores = sum(risk_conditions)
    df['risk'] = np.where(risk_scores >= 2, 'High', 
                         np.where(risk_scores >= 1, 'Medium', 'Low'))
    
    # Prepare features
    X = df[feature_columns]
    y = df['risk']
    
    # Scale features
    X_scaled = scaler.fit_transform(X)
    
    # Train model
    model.fit(X_scaled, y)
    logger.info("Model trained with synthetic data")

def preprocess_input(data: HealthData) -> tuple:
    """Preprocess input data for prediction"""
    try:
        # Parse blood pressure
        systolic_bp = None
        diastolic_bp = None
        
        if data.blood_pressure:
            try:
                systolic_bp, diastolic_bp = map(int, data.blood_pressure.split('/'))
            except ValueError:
                logger.warning(f"Invalid blood pressure format: {data.blood_pressure}")
        
        # Create feature array
        features = [
            data.maternal_age or 28,  # Default values if missing
            data.gestational_age or 20,
            systolic_bp or 120,
            diastolic_bp or 80,
            data.blood_sugar or 95,
            data.heart_rate or 75,
            data.temperature or 98.6
        ]
        
        # Convert to a DataFrame with the same column names used at
        # training time, so the scaler doesn't warn about missing feature
        # names on every prediction request.
        features_df = pd.DataFrame([features], columns=feature_columns)

        # Scale features
        features_scaled = scaler.transform(features_df)
        
        return features_scaled, [col for col, val in zip(feature_columns, features) if val is not None]
        
    except Exception as e:
        logger.error(f"Error preprocessing input: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    initialize_model()

@app.get("/")
async def root():
    return {
        "message": "Prenatal Risk Prediction ML Service",
        "version": model_version,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "model_version": model_version
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(data: HealthData):
    """Predict pregnancy risk based on health data"""
    try:
        if model is None or scaler is None:
            raise HTTPException(status_code=500, detail="Model not initialized")
        
        # Preprocess input
        features_scaled, features_used = preprocess_input(data)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        # Get confidence for predicted class
        class_names = model.classes_
        predicted_index = np.where(class_names == prediction)[0][0]
        confidence = float(probabilities[predicted_index])
        
        # Generate prediction ID
        import uuid
        prediction_id = str(uuid.uuid4())
        
        logger.info(f"Prediction made for user {data.user_id}: {prediction} with confidence {confidence:.2f}")
        
        return PredictionResponse(
            risk=prediction,
            confidence=confidence,
            model_version=model_version,
            features_used=features_used,
            prediction_id=prediction_id
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/retrain")
async def retrain_model(request: ModelTrainingRequest):
    """Retrain the model with new data"""
    try:
        # Convert training data to DataFrame
        df = pd.DataFrame(request.training_data)
        
        # Validate required columns
        required_columns = request.features + [request.target_column]
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing columns: {missing_columns}"
            )
        
        # Prepare features and target
        X = df[request.features]
        y = df[request.target_column]
        
        # Scale features
        X_scaled = scaler.fit_transform(X)
        
        # Retrain model
        model.fit(X_scaled, y)
        
        # Save updated model
        joblib.dump(model, 'model.joblib')
        joblib.dump(scaler, 'scaler.joblib')
        
        # Update model version
        global model_version
        model_version = f"1.{len(os.listdir('.'))}"  # Simple versioning
        
        logger.info(f"Model retrained with {len(df)} samples")
        
        return {
            "message": "Model retrained successfully",
            "samples_used": len(df),
            "features": request.features,
            "model_version": model_version
        }
        
    except Exception as e:
        logger.error(f"Retraining error: {e}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Get information about the current model"""
    if model is None:
        raise HTTPException(status_code=500, detail="Model not initialized")
    
    return {
        "model_type": type(model).__name__,
        "model_version": model_version,
        "feature_columns": feature_columns,
        "n_estimators": getattr(model, 'n_estimators', None),
        "max_depth": getattr(model, 'max_depth', None),
        "classes": model.classes_.tolist() if hasattr(model, 'classes_') else None
    }

# --- Knowledge base (Twi assistant's CustomGPT.ai replacement) ---
#
# Free, self-hosted retrieval: TF-IDF + cosine similarity over ingested
# chunks, no external API, no downloaded model weights. See kb.py for the
# implementation and backend/src/services/ragService.js for the caller.

INGEST_TOKEN = os.environ.get("KB_INGEST_TOKEN")

def _check_ingest_token(x_ingest_token: Optional[str]):
    if INGEST_TOKEN and x_ingest_token != INGEST_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Ingest-Token header")

@app.post("/kb/ingest")
async def kb_ingest(request: KBIngestRequest, x_ingest_token: Optional[str] = Header(None)):
    """Add or replace chunks in the knowledge base and re-fit the index."""
    _check_ingest_token(x_ingest_token)
    try:
        chunks = [c.model_dump() for c in request.chunks]
        total = knowledge_base.ingest(chunks, replace=request.replace)
        return {"message": "Knowledge base updated", "chunk_count": total}
    except Exception as e:
        logger.error(f"KB ingest error: {e}")
        raise HTTPException(status_code=500, detail=f"Ingest failed: {str(e)}")

@app.post("/kb/query")
async def kb_query(request: KBQueryRequest):
    """Return the top matching chunks for a query, for the Node backend to
    ground a Groq completion with."""
    try:
        kwargs = {"top_k": request.top_k}
        if request.min_score is not None:
            kwargs["min_score"] = request.min_score
        results = knowledge_base.query(request.text, **kwargs)
        return {"results": results}
    except Exception as e:
        logger.error(f"KB query error: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.get("/kb/status")
async def kb_status():
    return knowledge_base.status()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
