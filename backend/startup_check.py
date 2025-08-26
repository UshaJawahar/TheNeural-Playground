#!/usr/bin/env python3
"""
Startup check script to verify spaCy model availability.
This helps diagnose deployment issues.
"""

import sys
import time

def check_spacy():
    """Check if spaCy and the English model are available"""
    print("🔍 Checking spaCy installation...")
    
    try:
        import spacy
        print("✅ spaCy imported successfully")
    except ImportError as e:
        print(f"❌ spaCy import failed: {e}")
        return False
    
    print("🔍 Checking English model availability...")
    try:
        nlp = spacy.load("en_core_web_sm")
        print("✅ English model loaded successfully")
        
        # Test basic functionality
        test_text = "Hello world! This is a test."
        doc = nlp(test_text)
        print(f"✅ Model test successful: processed '{test_text}' -> {len(doc)} tokens")
        
        return True
    except OSError as e:
        print(f"❌ English model not found: {e}")
        print("📥 Try downloading with: python -m spacy download en_core_web_sm")
        return False
    except Exception as e:
        print(f"❌ Model test failed: {e}")
        return False

def check_dependencies():
    """Check other critical dependencies"""
    print("🔍 Checking other dependencies...")
    
    try:
        import sklearn
        print("✅ scikit-learn available")
    except ImportError as e:
        print(f"❌ scikit-learn not available: {e}")
        return False
    
    try:
        import numpy
        print("✅ numpy available")
    except ImportError as e:
        print(f"❌ numpy not available: {e}")
        return False
    
    try:
        import pandas
        print("✅ pandas available")
    except ImportError as e:
        print(f"❌ pandas not available: {e}")
        return False
    
    return True

def main():
    """Main startup check"""
    print("🚀 TheNeural Backend Startup Check")
    print("=" * 40)
    
    # Check dependencies
    deps_ok = check_dependencies()
    if not deps_ok:
        print("❌ Critical dependencies missing")
        sys.exit(1)
    
    # Check spaCy
    spacy_ok = check_spacy()
    if not spacy_ok:
        print("❌ spaCy model not available")
        sys.exit(1)
    
    print("\n✅ All startup checks passed!")
    print("🚀 Ready to start the service...")
    
    # Small delay to ensure everything is loaded
    print("⏳ Waiting 2 seconds for stability...")
    time.sleep(2)
    print("🎯 Startup check complete!")

if __name__ == "__main__":
    main()
