# ML Extension API Call Optimization

## Problem Identified

The ML Extension was making **excessive and redundant API calls** to the same endpoints, causing:

- Unnecessary network traffic
- Poor user experience with potential lag
- Increased server load
- Browser performance issues

## Root Causes

1. **5-Second Timer Loop**: A `setInterval` was running every 5 seconds and calling `fetchProjectName()`
2. **Multiple Initialization Calls**: The extension called `fetchProjectName()` multiple times during initialization
3. **Redundant API Calls**: The same project name was fetched repeatedly even when it hadn't changed
4. **No Caching/Throttling**: No mechanism to prevent duplicate requests for the same data

## Solutions Implemented

### 1. **Smart Caching System**
- **30-second cache duration** for project names
- **Minimum 10-second interval** between API requests
- Prevents duplicate requests for the same data

### 2. **Request Deduplication**
- Tracks if a request is already in progress
- Skips duplicate requests while one is active
- Uses `isFetchingProjectName` flag to prevent concurrent calls

### 3. **Optimized Periodic Checks**
- Reduced frequency from **every 5 seconds** to **every 30 seconds**
- Only makes API calls when cache is expired AND minimum interval has passed
- Smart logic to skip unnecessary checks

### 4. **Conditional Initialization**
- Only fetches from API if no valid project name exists
- Prioritizes localStorage (fast) over API calls (slow)
- Prevents unnecessary initial API calls

## New Functions Available

### Cache Management
```javascript
// Clear the API cache
MLExtension.clearCache()

// Get detailed cache status
MLExtension.getCacheStatus()
```

### Cache Status Information
The `getCacheStatus()` function returns:
- `lastFetch`: Timestamp of last API call
- `timeSinceLastFetch`: Time since last fetch in milliseconds
- `cacheValid`: Whether cache is still valid
- `canFetch`: Whether enough time has passed for next fetch
- `cacheDuration`: Cache duration (30 seconds)
- `minFetchInterval`: Minimum interval between fetches (10 seconds)
- `isCurrentlyFetching`: Whether a request is currently active
- `cachedResult`: Last cached result

## Performance Improvements

### Before Optimization
- **API calls every 5 seconds** regardless of data changes
- **Multiple concurrent requests** possible
- **No caching** - always fetched fresh data
- **Redundant calls** during initialization

### After Optimization
- **API calls every 30 seconds maximum** (only when needed)
- **No duplicate requests** - prevents concurrent calls
- **30-second caching** - reuses data when valid
- **Smart initialization** - only fetches when necessary

## Expected Results

1. **Reduced API calls** from ~12 per minute to ~2 per minute (83% reduction)
2. **Better performance** - fewer network requests
3. **Improved user experience** - less lag and faster loading
4. **Reduced server load** - fewer unnecessary requests
5. **Better browser performance** - fewer concurrent requests

## Monitoring and Debugging

### Check Cache Status
```javascript
// In browser console
MLExtension.getCacheStatus()
```

### Clear Cache if Needed
```javascript
// Force clear cache and allow immediate fetch
MLExtension.clearCache()
```

### Force Update (Bypasses Cache)
```javascript
// Force fetch from API (ignores cache)
MLExtension.forceUpdateProjectName()
```

## Configuration

The optimization uses these constants (can be adjusted in the code):
- `PROJECT_NAME_CACHE_DURATION`: 30000ms (30 seconds)
- `MIN_FETCH_INTERVAL`: 10000ms (10 seconds)
- Periodic check interval: 30000ms (30 seconds)

## Best Practices

1. **Don't manually call `fetchProjectName()`** unless necessary
2. **Use `MLExtension.forceUpdateProjectName()`** for manual updates
3. **Monitor cache status** using `getCacheStatus()` for debugging
4. **Clear cache** only when you need fresh data immediately

## Troubleshooting

### If API calls are still frequent:
1. Check cache status: `MLExtension.getCacheStatus()`
2. Verify no other code is calling `fetchProjectName()` directly
3. Check if the extension is being reinitialized multiple times

### If project name is not updating:
1. Use `MLExtension.forceUpdateProjectName()` to bypass cache
2. Check cache status to see if it's working correctly
3. Verify session and project IDs are set correctly
