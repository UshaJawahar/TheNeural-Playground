#!/usr/bin/env python3
"""
Helper script to install spaCy and download the English model.
Run this script if you encounter spaCy model loading issues.
"""

import subprocess
import sys

def install_spacy():
    """Install spaCy and download English model"""
    print("🚀 Installing spaCy...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "spacy>=3.7.0"])
        print("✅ spaCy installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install spaCy: {e}")
        return False
    
    print("📥 Downloading spaCy English model...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        print("✅ English model downloaded successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to download English model: {e}")
        return False
    
    print("🧪 Testing spaCy installation...")
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        test_text = "Hello world! This is a test."
        doc = nlp(test_text)
        print(f"✅ spaCy test successful: processed '{test_text}' -> {len(doc)} tokens")
        return True
    except Exception as e:
        print(f"❌ spaCy test failed: {e}")
        return False

if __name__ == "__main__":
    print("🔧 spaCy Installation Helper")
    print("=" * 40)
    
    success = install_spacy()
    
    if success:
        print("\n🎉 spaCy installation completed successfully!")
        print("You can now run your training service.")
    else:
        print("\n💥 spaCy installation failed!")
        print("Please check the error messages above and try again.")
        sys.exit(1)
