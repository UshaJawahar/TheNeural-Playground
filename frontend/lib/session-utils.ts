// Utility functions for session ID masking and management

/**
 * Generate a short, user-friendly ID from a session ID
 * Uses the last 8 characters and converts to a more readable format
 */
export function generateMaskedId(sessionId: string): string {
  // Take last 8 characters and convert to base36 for shorter representation
  const suffix = sessionId.slice(-12);
  const hash = suffix.replace(/[^a-zA-Z0-9]/g, '');
  return hash.slice(-8).toLowerCase();
}

/**
 * Store the mapping between masked ID and real session ID
 */
export function storeMaskedIdMapping(maskedId: string, sessionId: string): void {
  try {
    localStorage.setItem(`neural_masked_${maskedId}`, sessionId);
    localStorage.setItem('neural_current_masked_id', maskedId);
  } catch (error) {
    console.error('Error storing masked ID mapping:', error);
  }
}

/**
 * Retrieve the real session ID from a masked ID
 */
export function getSessionIdFromMaskedId(maskedId: string): string | null {
  try {
    return localStorage.getItem(`neural_masked_${maskedId}`);
  } catch (error) {
    console.error('Error retrieving session ID from masked ID:', error);
    return null;
  }
}

/**
 * Get the current masked ID
 */
export function getCurrentMaskedId(): string | null {
  try {
    return localStorage.getItem('neural_current_masked_id');
  } catch (error) {
    console.error('Error getting current masked ID:', error);
    return null;
  }
}

/**
 * Clean up old masked ID mappings (optional, for cleanup)
 */
export function cleanupMaskedIdMappings(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('neural_masked_') && key !== `neural_masked_${getCurrentMaskedId()}`) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error cleaning up masked ID mappings:', error);
  }
}

/**
 * Check if a string looks like a masked ID (8 chars, alphanumeric)
 */
export function isMaskedId(id: string): boolean {
  return /^[a-z0-9]{8}$/.test(id);
}

/**
 * Check if a string looks like a full session ID
 */
export function isSessionId(id: string): boolean {
  return id.startsWith('session_') && id.length > 20;
}

// Project ID masking functions
/**
 * Generate a short, user-friendly ID from a project ID
 */
export function generateMaskedProjectId(projectId: string): string {
  // Take last 8 characters and convert to a more readable format
  const suffix = projectId.slice(-12);
  const hash = suffix.replace(/[^a-zA-Z0-9]/g, '');
  return `p${hash.slice(-7).toLowerCase()}`;
}

/**
 * Store the mapping between masked project ID and real project ID
 */
export function storeMaskedProjectIdMapping(maskedProjectId: string, projectId: string): void {
  try {
    localStorage.setItem(`neural_project_${maskedProjectId}`, projectId);
  } catch (error) {
    console.error('Error storing masked project ID mapping:', error);
  }
}

/**
 * Retrieve the real project ID from a masked project ID
 */
export function getProjectIdFromMaskedId(maskedProjectId: string): string | null {
  try {
    return localStorage.getItem(`neural_project_${maskedProjectId}`);
  } catch (error) {
    console.error('Error retrieving project ID from masked ID:', error);
    return null;
  }
}

/**
 * Check if a string looks like a masked project ID (starts with 'p' + 7 chars)
 */
export function isMaskedProjectId(id: string): boolean {
  return /^p[a-z0-9]{7}$/.test(id);
}

/**
 * Check if a string looks like a full project ID
 */
export function isProjectId(id: string): boolean {
  return id.length > 10 && (id.includes('project') || id.includes('proj'));
}

/**
 * Clean up old project ID mappings for a specific session
 */
export function cleanupProjectIdMappings(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('neural_project_')) {
        // Keep only recent mappings (optional cleanup logic)
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error cleaning up project ID mappings:', error);
  }
}
