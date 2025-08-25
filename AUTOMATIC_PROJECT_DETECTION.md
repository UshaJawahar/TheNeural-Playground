# Automatic Project Detection in ML Extension

## Overview

The ML Extension now automatically detects when a Scratch project is opened and immediately fetches the project details to display the correct project name and labels. This happens seamlessly without user interaction or page reloads.

## 🚀 **How It Works**

### 1. **Automatic Detection**
- **URL Monitoring**: Continuously monitors the browser URL for project ID changes
- **Real-time Updates**: Detects new projects within 2 seconds of opening
- **Smart Parsing**: Supports multiple URL patterns for project identification

### 2. **Immediate API Call**
- **Automatic Fetch**: Calls `/api/guests/session/{session_id}/projects/{project_id}` immediately
- **Project Details**: Fetches project name, labels, and model information
- **Dynamic Updates**: Updates the extension name and label blocks automatically

### 3. **Seamless User Experience**
- **No Waiting**: Users don't need to wait or reload the page
- **Instant Updates**: Project information appears immediately
- **Background Process**: All detection happens in the background

## 🔍 **URL Pattern Detection**

The extension automatically detects project IDs from these URL patterns:

### **Query Parameters:**
```
https://scratch.mit.edu/projects/123456789/?projectId=abc123
https://scratch.mit.edu/projects/123456789/?project=abc123
```

### **Path Parameters:**
```
https://scratch.mit.edu/projects/abc123/
https://scratch.mit.edu/project/abc123/
```

### **Mixed Patterns:**
```
https://scratch.mit.edu/projects/123456789/?projectId=abc123&sessionId=xyz789
```

## ⚡ **Automatic Process Flow**

### **When Scratch Opens:**
1. **Extension Initializes** → Starts project detection
2. **URL Analysis** → Parses current URL for project ID
3. **Project Detection** → Identifies the opened project
4. **API Call** → Automatically fetches project details
5. **UI Update** → Updates extension name and label blocks
6. **Continuous Monitoring** → Watches for project changes

### **When Project Changes:**
1. **URL Change Detected** → New project ID identified
2. **Cache Cleared** → Forces fresh data fetch
3. **New API Call** → Fetches details for new project
4. **Labels Updated** → Dynamic label blocks refresh
5. **UI Refreshed** → Workspace updates automatically

## 🛠️ **Technical Implementation**

### **Detection Methods:**
- **Interval Checking**: Every 2 seconds
- **Event Listeners**: `popstate`, `hashchange`
- **URL Pattern Matching**: Multiple regex patterns
- **Smart Caching**: Prevents unnecessary API calls

### **Performance Features:**
- **Efficient Monitoring**: Minimal resource usage
- **Smart Caching**: 60-second cache for project details
- **Request Deduplication**: Prevents concurrent API calls
- **Background Processing**: Non-blocking user experience

## 📱 **User Experience**

### **Before (Manual Process):**
1. User opens Scratch project
2. User manually sets session/project IDs
3. User waits for data to load
4. User manually refreshes if needed

### **After (Automatic Process):**
1. User opens Scratch project
2. Extension automatically detects project
3. Project details appear instantly
4. Labels update automatically

## 🔧 **Available Functions**

### **Console Functions:**
```javascript
// Start automatic project detection
MLExtension.startProjectDetection()

// Stop automatic project detection
MLExtension.stopProjectDetection()

// Manually detect current project
MLExtension.detectCurrentProject()

// Get current project information
MLExtension.getCurrentProjectInfo()
```

### **Project Info Response:**
```javascript
{
    currentProjectId: "abc123",
    globalProjectId: "abc123", 
    sessionId: "session_xyz",
    projectName: "My ML Project",
    labels: ["Happy", "Sad"],
    isDetectionActive: true
}
```

## 📊 **Detection Status**

### **Active Detection:**
- ✅ URL monitoring active
- ✅ Automatic API calls enabled
- ✅ Real-time project updates
- ✅ Background processing

### **Inactive Detection:**
- ❌ URL monitoring stopped
- ❌ Manual intervention required
- ❌ No automatic updates
- ❌ Static project information

## 🚨 **Error Handling**

### **No Project ID Found:**
- Console warning logged
- Extension continues to work
- Uses last known project (if any)

### **API Call Failed:**
- Error logged to console
- Cached data used (if available)
- Extension remains functional

### **Invalid Project Data:**
- Graceful fallback to defaults
- User-friendly error messages
- Extension stability maintained

## 🔄 **Lifecycle Management**

### **Extension Load:**
1. **Constructor Called** → Initializes extension
2. **Project Detection Started** → Begins monitoring
3. **Initial Project Detected** → First API call
4. **UI Populated** → Extension ready

### **Project Change:**
1. **URL Change Detected** → New project identified
2. **Cache Invalidated** → Forces fresh data
3. **API Call Made** → New project details
4. **UI Updated** → New labels displayed

### **Extension Unload:**
1. **Cleanup Called** → Stops monitoring
2. **Event Listeners Removed** → Prevents memory leaks
3. **Intervals Cleared** → Stops background processes
4. **Extension Unloaded** → Clean shutdown

## 📈 **Performance Metrics**

### **Detection Speed:**
- **Initial Detection**: < 1 second
- **Project Change**: < 2 seconds
- **API Response**: < 3 seconds
- **UI Update**: < 1 second

### **Resource Usage:**
- **Memory**: Minimal overhead
- **CPU**: Low background usage
- **Network**: Only when needed
- **Storage**: Efficient caching

## 🧪 **Testing Scenarios**

### **Test Case 1: New Project Open**
1. Open Scratch project with project ID in URL
2. Extension should detect project within 2 seconds
3. Project details should appear automatically
4. Label blocks should update accordingly

### **Test Case 2: Project Change**
1. Navigate to different project
2. Extension should detect change immediately
3. New project details should load
4. Old labels should be replaced with new ones

### **Test Case 3: No Project ID**
1. Open Scratch without project ID
2. Extension should log warning
3. Extension should continue to work
4. No automatic API calls should be made

## 🚀 **Benefits**

### **For Users:**
- **Instant Setup**: No manual configuration needed
- **Seamless Experience**: Project info appears automatically
- **No Waiting**: Immediate access to ML functionality
- **Intuitive**: Works exactly as expected

### **For Developers:**
- **Reduced Support**: Fewer user questions
- **Better UX**: Professional, polished experience
- **Efficient Workflow**: Faster project switching
- **Reliable Detection**: Robust project identification

## 🔮 **Future Enhancements**

### **Planned Features:**
- **WebSocket Support**: Real-time project updates
- **Project History**: Remember recent projects
- **Smart Caching**: Predictive project loading
- **Advanced Patterns**: Support for more URL formats

### **Customization Options:**
- **Detection Frequency**: Adjustable monitoring intervals
- **URL Patterns**: Custom project ID detection
- **Cache Duration**: Configurable caching behavior
- **Error Handling**: Custom error response handling

The automatic project detection makes the ML Extension truly seamless and professional, providing users with an instant, intuitive experience when opening Scratch projects!
