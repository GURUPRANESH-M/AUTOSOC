import os
import torch
from autosoc_ml.progression.models.markov import MarkovProgressionPredictor
from autosoc_ml.progression.features.builder import ProgressionFeatureBuilder

class ProgressionService:
    def __init__(self, model_path: str, vocab_path: str):
        self.builder = ProgressionFeatureBuilder(vocab_path)
        # Using the baseline Markov model for now, could be swapped for LSTM/Transformer
        self.model = MarkovProgressionPredictor()
        
        if os.path.exists(model_path):
            # For Markov, we might load a pickle, for PyTorch load state_dict
            pass
        else:
            # Fallback to untrained or empty
            pass

    def predict(self, incident_mappings: list) -> dict:
        sequence = self.builder.extract_sequence(incident_mappings)
        if not sequence:
            return []
            
        current_tech = sequence[-1]
        top_k = self.model.predict(current_tech, top_k=3)
        
        predictions = []
        for tech, prob in top_k:
            predictions.append({
                "technique_id": tech,
                "probability": float(prob),
                "score": float(prob) * 100
            })
            
        return {
            "predictions": predictions,
            "observed": sequence
        }
