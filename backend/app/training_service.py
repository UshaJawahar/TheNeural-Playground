import joblib
import pickle
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import numpy as np
from datetime import datetime, timezone
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer, PorterStemmer
from nltk.tokenize import word_tokenize

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

from .models import TextExample, TrainedModel


class EnhancedTextPreprocessor:
    """Enhanced text preprocessing for better feature extraction"""
    
    def __init__(self):
        self.lemmatizer = WordNetLemmatizer()
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        
        # Add custom stop words for better text classification
        custom_stops = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
        }
        self.stop_words.update(custom_stops)
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers (keep apostrophes for contractions)
        text = re.sub(r'[^a-zA-Z\s\']', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def tokenize_and_clean(self, text: str) -> List[str]:
        """Tokenize and clean text"""
        # Clean text first
        cleaned_text = self.clean_text(text)
        
        # Tokenize
        tokens = word_tokenize(cleaned_text)
        
        # Remove stop words and short tokens
        filtered_tokens = []
        for token in tokens:
            if len(token) > 2 and token.lower() not in self.stop_words:
                # Lemmatize the token
                lemmatized = self.lemmatizer.lemmatize(token.lower())
                # Stem the token
                stemmed = self.stemmer.stem(lemmatized)
                filtered_tokens.append(stemmed)
        
        return filtered_tokens
    
    def preprocess_text(self, text: str) -> str:
        """Preprocess text for vectorization"""
        tokens = self.tokenize_and_clean(text)
        return ' '.join(tokens)


class EnhancedLogisticRegressionTrainer:
    """Enhanced training service for logistic regression text classification"""
    
    def __init__(self):
        self.preprocessor = EnhancedTextPreprocessor()
        
        # Enhanced TF-IDF vectorizer with better parameters
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=5000,  # Increased features for better representation
            stop_words=None,  # We handle stop words in preprocessing
            ngram_range=(1, 3),  # Unigrams, bigrams, and trigrams
            min_df=2,  # Minimum document frequency (ignore very rare terms)
            max_df=0.9,  # Maximum document frequency (ignore very common terms)
            sublinear_tf=True,  # Apply sublinear tf scaling
            use_idf=True,  # Use inverse document frequency
            smooth_idf=True,  # Smooth idf weights
            norm='l2'  # L2 normalization
        )
        
        # Alternative: Count vectorizer with better features
        self.count_vectorizer = CountVectorizer(
            max_features=3000,
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.9,
            stop_words=None
        )
        
        # Enhanced logistic regression with better default parameters
        self.base_model = LogisticRegression(
            max_iter=2000,  # Increased iterations
            random_state=42,
            solver='liblinear',  # Good for small datasets
            warm_start=True,  # Enable warm start for better convergence
            class_weight='balanced'  # Handle class imbalance
        )
        
        # Create pipeline for better preprocessing
        self.pipeline = Pipeline([
            ('vectorizer', self.tfidf_vectorizer),
            ('classifier', self.base_model)
        ])
    
    def preprocess_data(self, examples: List[TextExample]) -> Tuple[List[str], List[str]]:
        """Extract and preprocess texts and labels from examples"""
        texts = []
        labels = []
        
        for example in examples:
            # Preprocess text
            processed_text = self.preprocessor.preprocess_text(example.text)
            if processed_text.strip():  # Only include non-empty processed texts
                texts.append(processed_text)
                labels.append(example.label)
        
        return texts, labels
    
    def validate_dataset(self, examples: List[TextExample]) -> Tuple[bool, str]:
        """Validate dataset for training"""
        if not examples:
            return False, "No examples provided"
        
        # Check minimum examples per label
        label_counts = {}
        for example in examples:
            label_counts[example.label] = label_counts.get(example.label, 0) + 1
        
        min_examples_per_label = 2  # Minimum required for training
        max_examples_per_label = 10000
        
        for label, count in label_counts.items():
            if count < min_examples_per_label:
                return False, f"Label '{label}' has only {count} examples. Minimum required is {min_examples_per_label}"
            if count > max_examples_per_label:
                return False, f"Label '{label}' has {count} examples. Maximum allowed is {max_examples_per_label}"
        
        return True, "Dataset is valid"
    
    def find_best_hyperparameters(self, X_train: List[str], y_train: List[str]) -> Dict[str, Any]:
        """Find optimal hyperparameters using grid search"""
        print("🔍 Finding optimal hyperparameters...")
        
        # Define parameter grid for TF-IDF
        tfidf_params = {
            'vectorizer__max_features': [3000, 5000, 7000],
            'vectorizer__ngram_range': [(1, 2), (1, 3)],
            'vectorizer__min_df': [1, 2],
            'vectorizer__max_df': [0.8, 0.9, 0.95]
        }
        
        # Define parameter grid for classifier
        classifier_params = {
            'classifier__C': [0.1, 1.0, 10.0, 100.0],
            'classifier__class_weight': ['balanced', None]
        }
        
        # Combine parameter grids
        param_grid = {**tfidf_params, **classifier_params}
        
        # Use 3-fold cross-validation for hyperparameter tuning
        grid_search = GridSearchCV(
            self.pipeline,
            param_grid,
            cv=3,
            scoring='accuracy',
            n_jobs=-1,  # Use all available cores
            verbose=1
        )
        
        # Fit grid search
        grid_search.fit(X_train, y_train)
        
        print(f"✅ Best parameters: {grid_search.best_params_}")
        print(f"✅ Best cross-validation score: {grid_search.best_score_:.4f}")
        
        return {
            'best_params': grid_search.best_params_,
            'best_score': grid_search.best_score_,
            'best_estimator': grid_search.best_estimator_
        }
    
    def train_model(self, examples: List[TextExample]) -> Dict[str, Any]:
        """Train enhanced logistic regression model"""
        # Validate dataset
        is_valid, message = self.validate_dataset(examples)
        if not is_valid:
            raise ValueError(message)
        
        print(f"🚀 Starting enhanced training with {len(examples)} examples...")
        
        # Preprocess data
        texts, labels = self.preprocess_data(examples)
        print(f"📝 Preprocessed {len(texts)} texts")
        
        # Calculate label distribution
        label_counts = {}
        for label in labels:
            label_counts[label] = label_counts.get(label, 0) + 1
        
        print(f"🏷️ Label distribution: {label_counts}")
        
        # Split data (80% train, 20% validation)
        min_examples_per_class = 2
        can_stratify = all(label_counts.get(label, 0) >= min_examples_per_class for label in set(labels))
        
        if can_stratify:
            X_train, X_val, y_train, y_val = train_test_split(
                texts, labels, test_size=0.2, random_state=42, stratify=labels
            )
        else:
            X_train, X_val, y_train, y_val = train_test_split(
                texts, labels, test_size=0.2, random_state=42
            )
        
        print(f"📊 Training set: {len(X_train)} examples, Validation set: {len(X_val)} examples")
        
        # Find best hyperparameters
        hyperparam_result = self.find_best_hyperparameters(X_train, y_train)
        best_pipeline = hyperparam_result['best_estimator']
        
        # Train final model with best parameters
        print("🎯 Training final model with best parameters...")
        best_pipeline.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = best_pipeline.predict(X_val)
        accuracy = accuracy_score(y_val, y_pred)
        
        # Cross-validation score
        cv_scores = cross_val_score(best_pipeline, X_train, y_train, cv=5, scoring='accuracy')
        cv_accuracy = cv_scores.mean()
        cv_std = cv_scores.std()
        
        # Detailed evaluation
        classification_rep = classification_report(y_val, y_pred, output_dict=True)
        confusion_mat = confusion_matrix(y_val, y_pred)
        
        # Get feature importance (top words for each class)
        vectorizer = best_pipeline.named_steps['vectorizer']
        classifier = best_pipeline.named_steps['classifier']
        feature_names = vectorizer.get_feature_names_out()
        feature_importance = self._get_enhanced_feature_importance(feature_names, classifier)
        
        # Get unique labels
        unique_labels = sorted(list(set(labels)))
        
        # Calculate per-class accuracy
        per_class_accuracy = {}
        for label in unique_labels:
            if label in classification_rep:
                per_class_accuracy[label] = round(classification_rep[label]['precision'] * 100, 2)
        
        print(f"✅ Training completed!")
        print(f"📈 Validation Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"🔄 Cross-Validation Accuracy: {cv_accuracy:.4f} ± {cv_std:.4f}")
        
        return {
            'accuracy': round(accuracy * 100, 2),
            'cv_accuracy': round(cv_accuracy * 100, 2),
            'cv_std': round(cv_std * 100, 2),
            'labels': unique_labels,
            'label_counts': label_counts,
            'per_class_accuracy': per_class_accuracy,
            'feature_importance': feature_importance,
            'confusion_matrix': confusion_mat.tolist(),
            'classification_report': classification_rep,
            'best_hyperparameters': hyperparam_result['best_params'],
            'training_examples': len(X_train),
            'validation_examples': len(X_val),
            'total_examples': len(examples)
        }
    
    def _get_enhanced_feature_importance(self, feature_names: np.ndarray, classifier: LogisticRegression) -> Dict[str, List[Dict[str, Any]]]:
        """Get enhanced feature importance for each class"""
        feature_importance = {}
        
        # Get coefficients for each class
        for i, class_name in enumerate(classifier.classes_):
            coefficients = classifier.coef_[i]
            
            # Create feature-importance pairs
            feature_imp_pairs = []
            for j, coef in enumerate(coefficients):
                if abs(coef) > 0.01:  # Only include significant features
                    feature_imp_pairs.append({
                        'feature': feature_names[j],
                        'importance': float(coef),
                        'abs_importance': float(abs(coef))
                    })
            
            # Sort by absolute importance
            feature_imp_pairs.sort(key=lambda x: x['abs_importance'], reverse=True)
            
            # Take top 20 features per class
            feature_importance[class_name] = feature_imp_pairs[:20]
        
        return feature_importance
    
    def save_model(self, model_path: str) -> str:
        """Save trained model and vectorizer"""
        model_data = {
            'vectorizer': self.tfidf_vectorizer, # Save the best vectorizer
            'model': self.base_model, # Save the best model
            'trained_at': datetime.now(timezone.utc).isoformat()
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        return model_path
    
    def save_model_to_gcs(self, bucket, gcs_path: str) -> str:
        """Save trained model directly to GCS"""
        model_data = {
            'vectorizer': self.tfidf_vectorizer, # Save the best vectorizer
            'model': self.base_model, # Save the best model
            'trained_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Serialize model data
        model_bytes = pickle.dumps(model_data)
        
        # Upload to GCS
        blob = bucket.blob(gcs_path)
        blob.upload_from_string(model_bytes, content_type='application/octet-stream')
        
        return gcs_path
    
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
    
    def predict_from_gcs(self, text: str, bucket, gcs_path: str) -> Dict[str, Any]:
        """Make prediction using model stored in GCS"""
        try:
            # Download model from GCS
            blob = bucket.blob(gcs_path)
            model_bytes = blob.download_as_bytes()
            
            # Deserialize model data
            model_data = pickle.loads(model_bytes)
            
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
            
        except Exception as e:
            raise Exception(f"Failed to load model from GCS: {str(e)}")


# Global trainer instance
trainer = EnhancedLogisticRegressionTrainer()
