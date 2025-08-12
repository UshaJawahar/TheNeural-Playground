import joblib
import pickle
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import numpy as np
from datetime import datetime, timezone

from .models import TextExample, TrainedModel


class LogisticRegressionTrainer:
    """Training service for logistic regression text classification"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,  # Limit features for small datasets
            stop_words='english',
            ngram_range=(1, 2),  # Unigrams and bigrams
            min_df=1,  # Minimum document frequency
            max_df=0.95  # Maximum document frequency
        )
        self.model = LogisticRegression(
            max_iter=1000,
            random_state=42,
            solver='liblinear'  # Good for small datasets
        )
    
    def preprocess_data(self, examples: List[TextExample]) -> Tuple[List[str], List[str]]:
        """Extract texts and labels from examples"""
        texts = [example.text for example in examples]
        labels = [example.label for example in examples]
        return texts, labels
    
    def validate_dataset(self, examples: List[TextExample]) -> Tuple[bool, str]:
        """Validate dataset meets requirements"""
        if len(examples) < 10:
            return False, "Need at least 10 examples total"
        
        # Count examples per label
        label_counts = {}
        for example in examples:
            label_counts[example.label] = label_counts.get(example.label, 0) + 1
        
        # Check minimum examples per label
        min_examples_per_label = 3
        for label, count in label_counts.items():
            if count < min_examples_per_label:
                return False, f"Label '{label}' needs at least {min_examples_per_label} examples (has {count})"
        
        # Check maximum examples per label
        max_examples_per_label = 50
        for label, count in label_counts.items():
            if count > max_examples_per_label:
                return False, f"Label '{label}' has too many examples ({count}), maximum is {max_examples_per_label}"
        
        return True, "Dataset is valid"
    
    def train_model(self, examples: List[TextExample]) -> Dict[str, Any]:
        """Train logistic regression model"""
        # Validate dataset
        is_valid, message = self.validate_dataset(examples)
        if not is_valid:
            raise ValueError(message)
        
        # Preprocess data
        texts, labels = self.preprocess_data(examples)
        
        # Split data (80% train, 20% validation)
        X_train, X_val, y_train, y_val = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )
        
        # Vectorize text data
        X_train_vectors = self.vectorizer.fit_transform(X_train)
        X_val_vectors = self.vectorizer.transform(X_val)
        
        # Train model
        self.model.fit(X_train_vectors, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_val_vectors)
        accuracy = accuracy_score(y_val, y_pred)
        
        # Get feature importance (top words for each class)
        feature_names = self.vectorizer.get_feature_names_out()
        feature_importance = self._get_feature_importance(feature_names)
        
        # Get unique labels
        unique_labels = sorted(list(set(labels)))
        
        return {
            'accuracy': round(accuracy * 100, 2),
            'labels': unique_labels,
            'feature_importance': feature_importance,
            'training_examples': len(X_train),
            'validation_examples': len(X_val),
            'total_features': len(feature_names)
        }
    
    def _get_feature_importance(self, feature_names: np.ndarray) -> Dict[str, List[str]]:
        """Get top important words for each class"""
        feature_importance = {}
        
        for i, class_name in enumerate(self.model.classes_):
            # Get coefficients for this class
            coefficients = self.model.coef_[i]
            
            # Get top 10 features (words) for this class
            top_indices = np.argsort(coefficients)[-10:][::-1]
            top_words = [feature_names[idx] for idx in top_indices]
            
            feature_importance[class_name] = top_words
        
        return feature_importance
    
    def save_model(self, model_path: str) -> str:
        """Save trained model and vectorizer"""
        model_data = {
            'vectorizer': self.vectorizer,
            'model': self.model,
            'trained_at': datetime.now(timezone.utc).isoformat()
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        return model_path
    
    def predict(self, text: str, model_path: str) -> Dict[str, Any]:
        """Make prediction using saved model"""
        # Load model
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        vectorizer = model_data['vectorizer']
        model = model_data['model']
        
        # Vectorize input text
        text_vector = vectorizer.transform([text])
        
        # Make prediction
        prediction = model.predict(text_vector)[0]
        probabilities = model.predict_proba(text_vector)[0]
        
        # Get confidence and alternatives
        confidence = max(probabilities) * 100
        alternatives = []
        
        for i, (label, prob) in enumerate(zip(model.classes_, probabilities)):
            if label != prediction:
                alternatives.append({
                    'label': label,
                    'confidence': round(prob * 100, 2)
                })
        
        # Sort alternatives by confidence
        alternatives.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'label': prediction,
            'confidence': round(confidence, 2),
            'alternatives': alternatives[:2]  # Top 2 alternatives
        }


# Global trainer instance
trainer = LogisticRegressionTrainer()
