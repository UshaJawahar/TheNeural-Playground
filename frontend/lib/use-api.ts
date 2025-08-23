import { useState, useCallback } from 'react';
import { apiService, ApiResponse } from './api-service';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T = any>(
  apiMethod: (...args: any[]) => Promise<ApiResponse<T>>,
  initialData: T | null = null
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await apiMethod(...args);
        
        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          });
        } else {
          setState({
            data: null,
            loading: false,
            error: response.error || 'Unknown error occurred',
          });
        }
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    },
    [apiMethod]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useProjects(userId?: string) {
  return useApi(
    (id?: string) => apiService.getProjects(id || userId),
    []
  );
}

export function useProject(projectId: string) {
  return useApi(
    () => apiService.getProject(projectId),
    null
  );
}

export function useCreateProject() {
  return useApi(
    (projectData: any) => apiService.createProject(projectData),
    null
  );
}

export function useUpdateProject() {
  return useApi(
    (projectId: string, projectData: any) => apiService.updateProject(projectId, projectData),
    null
  );
}

export function useDeleteProject() {
  return useApi(
    (projectId: string) => apiService.deleteProject(projectId),
    null
  );
}

export function useTeachers() {
  return useApi(
    () => apiService.getTeachers(),
    []
  );
}

export function useStudents(teacherId?: string, classroomId?: string) {
  return useApi(
    (tId?: string, cId?: string) => apiService.getStudents(tId || teacherId, cId || classroomId),
    []
  );
}

export function useClassrooms(teacherId?: string) {
  return useApi(
    (id?: string) => apiService.getClassrooms(id || teacherId),
    []
  );
}

export function useDemoProjects(category?: string, difficulty?: string) {
  return useApi(
    (cat?: string, diff?: string) => apiService.getDemoProjects(cat || category, diff || difficulty),
    []
  );
}

export function useTraining() {
  return useApi(
    (projectId: string, config: any) => apiService.startTraining(projectId, config),
    null
  );
}

export function useTrainingStatus(projectId: string) {
  return useApi(
    () => apiService.getTrainingStatus(projectId),
    null
  );
}

export function useFileUpload() {
  return useApi(
    (projectId: string, file: File) => apiService.uploadTrainingData(projectId, file),
    null
  );
}

// Guest Project Hooks
export function useGuestProjects(sessionId: string, limit?: number, offset?: number, status?: string, type?: string, search?: string) {
  return useApi(
    (sId?: string, l?: number, o?: number, s?: string, t?: string, srch?: string) => 
      apiService.getGuestProjects(sId || sessionId, l || limit, o || offset, s || status, t || type, srch || search),
    []
  );
}

export function useGuestProject(sessionId: string, projectId: string) {
  return useApi(
    () => apiService.getGuestProject(sessionId, projectId),
    null
  );
}

export function useCreateGuestProject() {
  return useApi(
    (sessionId: string, projectData: any) => apiService.createGuestProject(sessionId, projectData),
    null
  );
}

export function useUpdateGuestProject() {
  return useApi(
    (sessionId: string, projectId: string, projectData: any) => apiService.updateGuestProject(sessionId, projectId, projectData),
    null
  );
}

export function useDeleteGuestProject() {
  return useApi(
    (sessionId: string, projectId: string) => apiService.deleteGuestProject(sessionId, projectId),
    null
  );
}

export function useGuestTraining() {
  return useApi(
    (sessionId: string, projectId: string, config: any) => apiService.startGuestTraining(sessionId, projectId, config),
    null
  );
}

export function useGuestTrainingStatus(sessionId: string, projectId: string) {
  return useApi(
    () => apiService.getGuestTrainingStatus(sessionId, projectId),
    null
  );
}

export function useGuestPrediction() {
  return useApi(
    (sessionId: string, projectId: string, input: any) => apiService.getGuestPrediction(sessionId, projectId, input),
    null
  );
}

export function useUploadGuestExamples() {
  return useApi(
    (sessionId: string, projectId: string, examples: any[]) => apiService.uploadGuestExamples(sessionId, projectId, examples),
    null
  );
}
