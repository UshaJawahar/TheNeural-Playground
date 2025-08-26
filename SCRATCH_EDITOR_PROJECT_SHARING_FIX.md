# Scratch Editor Project Sharing Issue - Fix Documentation

## Overview
This document outlines the fixes implemented for the Scratch Editor project sharing issue and the training service NLTK error.

## Issues Fixed

### 1. Scratch Editor Project Sharing Issue
**Problem**: When opening multiple Scratch editor instances with different `projectId` parameters, they were all showing the same project content due to `localStorage` sharing across tabs.

**Root Cause**: The ML extension was storing project data in browser `localStorage`, which is shared across tabs in the same origin, and was prioritizing `localStorage` over URL parameters.

**Solution**: Implemented aggressive `localStorage` clearing strategy:
- Clear `localStorage` before opening Scratch editor in the frontend
- Modified ML extension to prioritize URL parameters over `localStorage`
- Added URL change detection and automatic refresh in the ML extension
- Added `useEffect` hooks to clear `localStorage` on component lifecycle events

**Files Modified**:
- `frontend/app/projects/[userid]/[projectid]/make/page.tsx`
- `scratch-editor/packages/scratch-vm/src/extensions/scratch3_ml/index.js`

### 2. Training Service Text Preprocessing Issue
**Problem**: The training service was failing with NLTK `punkt_tab` resource not found errors during text preprocessing.

**Root Cause**: NLTK resource management issues and dependency on external data downloads.

**Solution**: Replaced NLTK with spaCy for more robust text preprocessing:
- **spaCy Advantages**:
  - More modern and reliable NLP library
  - Better tokenization and lemmatization
  - Built-in stop word detection
  - More consistent performance across environments
  - Better handling of edge cases

**Files Modified**:
- `backend/app/training_service.py` - Replaced NLTK with spaCy
- `backend/requirements.txt` - Updated dependencies
- `backend/install_spacy.py` - Added helper script for spaCy installation

## Technical Details

### Frontend Changes
- **Aggressive localStorage clearing**: Multiple `useEffect` hooks ensure `localStorage` is cleared at various points in the component lifecycle
- **Warning notice**: Added user notification about the project sharing issue
- **Debug page removal**: Removed the temporary debug page as requested

### ML Extension Changes
- **URL parameter priority**: Always prioritize URL parameters over `localStorage` values
- **Automatic refresh**: Monitor URL changes and automatically refresh when `sessionId` or `projectId` changes
- **Force refresh functions**: Added `forceRefreshForNewProject()` and `forceClearAllProjectData()` for manual troubleshooting
- **Public API**: Exposed refresh functions for console-based debugging

### Backend Changes
- **spaCy integration**: Replaced NLTK with spaCy for text preprocessing
- **Enhanced tokenization**: Better token filtering using spaCy's linguistic features
- **Automatic model download**: spaCy automatically downloads the English model if not available
- **Improved error handling**: Better debugging and error reporting

## Installation and Setup

### spaCy Installation
1. **Automatic**: The training service will automatically download spaCy and the English model on first run
2. **Manual**: Run the helper script if needed:
   ```bash
   cd backend
   python install_spacy.py
   ```

### Dependencies
- **Removed**: `nltk>=3.8.1`
- **Added**: `spacy>=3.7.0`

## Testing

### Project Sharing Fix
1. Create multiple projects
2. Open each project in Scratch editor
3. Verify each shows the correct project content
4. Test switching between projects without page refresh

### Training Fix
1. Submit examples to a project
2. Click "Train new machine learning model"
3. Verify training starts without errors
4. Check that the model completes successfully

## Benefits of spaCy over NLTK

1. **Reliability**: No dependency on external data downloads
2. **Performance**: Faster text processing
3. **Accuracy**: Better tokenization and lemmatization
4. **Maintenance**: More modern codebase with better support
5. **Consistency**: Predictable behavior across different environments

## Future Improvements

- Consider adding support for multiple languages
- Implement more advanced text preprocessing techniques
- Add text quality metrics and validation
- Consider using spaCy's built-in text classification capabilities

## Notes

- The debug page has been removed as requested
- All NLTK dependencies have been completely removed
- spaCy will automatically handle model downloads
- The training service now has better error handling and debugging 