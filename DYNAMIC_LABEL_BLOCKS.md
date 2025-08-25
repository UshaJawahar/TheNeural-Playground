# Dynamic Label Blocks in ML Extension

## Overview

The ML Extension now supports **dynamic label blocks** that are automatically generated based on the labels returned by your API. When your API returns labels like `["Cat", "Dog"]`, the extension will automatically create 2 label blocks. If it returns 3 labels, it will create 3 blocks, and so on.

## How It Works

### 1. **API Response Structure**
Your API endpoint `/api/guests/session/{session_id}/projects/{project_id}` should return:

```json
{
  "success": true,
  "data": {
    "model": {
      "labels": ["Cat", "Dog"]
    }
  }
}
```

### 2. **Automatic Block Generation**
The extension automatically:
- Fetches project details from your API
- Extracts the `labels` array
- Creates one block for each label
- Places them in the Scratch workspace

### 3. **Dynamic Block Creation**
- **2 labels** → 2 label blocks (e.g., "Cat", "Dog")
- **3 labels** → 3 label blocks (e.g., "Happy", "Sad", "Neutral")
- **5 labels** → 5 label blocks
- **No labels** → No label blocks

## Example Output

Based on your API response with `["Cat", "Dog"]`, the extension will create:

```
┌─────────────┐
│ ML          │
├─────────────┤
│ recognise text [TEXT] (label)     │
│ recognise text [TEXT] (confidence) │
│ add training data [TEXT] [LABEL]   │
│ train new machine learning model   │
│ is the machine learning model [STATUS] │
│ get training examples               │
├─────────────┤
│ set session [SESSION_ID] and project [PROJECT_ID] │
│ get current session and project IDs │
│ clear stored data                   │
├─────────────┤
│ Cat         │  ← Dynamic label block
│ Dog         │  ← Dynamic label block
└─────────────┘
```

## Technical Implementation

### Block Structure
Each dynamic label block has:
- **Opcode**: `label_0`, `label_1`, `label_2`, etc.
- **Type**: Reporter block (returns a value)
- **Text**: The actual label text (e.g., "Cat", "Dog")
- **Functionality**: Returns the label value when executed

### Caching System
- **Project details cache**: 1 minute duration
- **Labels stored in localStorage** for persistence
- **Automatic refresh** when project details change
- **Smart fetching** to prevent unnecessary API calls

## Available Functions

### Console Functions
```javascript
// Get label by index (0-based)
MLExtension.getLabelByIndex(0)  // Returns "Cat"
MLExtension.getLabelByIndex(1)  // Returns "Dog"

// Get all labels as comma-separated string
MLExtension.getAllLabels()      // Returns "Cat, Dog"

// Check if a specific label exists
MLExtension.hasLabel("Cat")     // Returns true
MLExtension.hasLabel("Bird")    // Returns false

// Get count of available labels
MLExtension.getLabelCount()     // Returns 2

// Refresh labels from API
MLExtension.refreshProjectLabels()
```

### Block Functions
The dynamic label blocks automatically call the `getLabelValue()` method, which:
1. Extracts the block index from the opcode
2. Returns the corresponding label from the `projectLabels` array
3. Handles error cases gracefully

## Configuration

### Cache Durations
- **Project details**: 60 seconds (1 minute)
- **Project name**: 30 seconds
- **Minimum fetch interval**: 10 seconds

### Automatic Updates
- Labels are fetched when the extension initializes
- Labels are refreshed every 60 seconds (when cache expires)
- UI automatically refreshes when new labels are detected

## Usage Examples

### 1. **Basic Label Usage**
```javascript
// In Scratch, you can use the label blocks directly
// The "Cat" block will return "Cat"
// The "Dog" block will return "Dog"
```

### 2. **Programmatic Access**
```javascript
// Get the first label
const firstLabel = MLExtension.getLabelByIndex(0);

// Check if a label exists
if (MLExtension.hasLabel("Cat")) {
    console.log("Cat label is available");
}

// Get all labels
const allLabels = MLExtension.getAllLabels();
```

### 3. **Force Refresh Labels**
```javascript
// Force refresh labels from API
MLExtension.refreshProjectLabels().then(result => {
    if (result.success) {
        console.log("Labels refreshed:", result.labels);
    }
});
```

## Error Handling

### No Labels Available
- If no labels are found, no label blocks are created
- The extension gracefully handles missing label data
- Console warnings are logged for debugging

### API Errors
- Failed API calls don't break the extension
- Cached labels continue to work
- Error messages are logged to console

### Invalid Label Data
- Malformed label arrays are handled gracefully
- Empty arrays result in no label blocks
- Non-string labels are filtered out

## Best Practices

### 1. **Label Naming**
- Use clear, descriptive labels
- Avoid special characters that might cause issues
- Keep labels reasonably short

### 2. **API Response**
- Always include the `labels` array in your API response
- Ensure labels are strings
- Handle cases where labels might be empty

### 3. **Performance**
- Don't manually call `refreshProjectLabels()` frequently
- Let the automatic caching system work
- Use `MLExtension.getCacheStatus()` to monitor performance

## Troubleshooting

### Labels Not Appearing
1. Check if your API is returning the correct structure
2. Verify session and project IDs are set
3. Check console for error messages
4. Use `MLExtension.refreshProjectLabels()` to force refresh

### Wrong Labels
1. Check your API response structure
2. Verify the `labels` array contains the expected values
3. Clear cache with `MLExtension.clearCache()`
4. Refresh labels manually

### Performance Issues
1. Check cache status: `MLExtension.getCacheStatus()`
2. Monitor API call frequency in console
3. Adjust cache durations if needed
4. Ensure no manual API calls are being made

## Future Enhancements

### Planned Features
- **Label validation**: Ensure labels meet certain criteria
- **Custom label formatting**: Support for different label styles
- **Label categories**: Group labels by type or function
- **Real-time updates**: WebSocket support for live label updates

### Customization Options
- **Label block colors**: Customize appearance per label
- **Label descriptions**: Add tooltips to label blocks
- **Label ordering**: Custom sort order for labels
- **Label filtering**: Show/hide specific labels
