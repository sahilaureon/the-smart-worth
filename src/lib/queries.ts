import { useQuery } from '@tanstack/react-query';
import { fetchApi } from './api';

/**
 * Hook to fetch all courses accessible to the current user.
 */
export function useEnrolledCourses(userId: string | undefined) {
  return useQuery({
    queryKey: ['enrolled-courses', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const response = await fetchApi(`/enrolled-courses/${userId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!userId,
    retry: 2,
  });
}

/**
 * Hook to fetch common user stats with caching.
 */
export function useUserDashboardStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      if (!userId) return { referralCount: 0, enrollmentCount: 0 };
      try {
        const response = await fetchApi(`/user-stats/${userId}`);
        if (!response.ok) return { referralCount: 0, enrollmentCount: 0 };
        const data = await response.json();
        return data || { referralCount: 0, enrollmentCount: 0 };
      } catch {
        return { referralCount: 0, enrollmentCount: 0 };
      }
    },
    enabled: !!userId,
    retry: 2,
  });
}

/**
 * Hook to fetch a specific course.
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;
      try {
        const response = await fetchApi(`/courses/${courseId}`);
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    enabled: !!courseId,
    retry: 2,
  });
}

/**
 * Hook to fetch completed lessons for a specific course.
 */
export function useLessonCompletions(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-completions', userId, courseId],
    queryFn: async () => {
      if (!userId || !courseId) return [];
      try {
        const response = await fetchApi(`/lesson-completions?userId=${userId}&courseId=${courseId}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.map((d: any) => d.lesson_id) : [];
      } catch {
        return [];
      }
    },
    enabled: !!userId && !!courseId,
    retry: 2,
  });
}
