import { useState, useCallback } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { applicationsApi } from '@/api/applications';
import type { Application, ApplicationStatus } from '@/types/application';

interface UseKanbanDragDropOptions {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  onError: (message: string) => void;
}

/**
 * useKanbanDragDrop - Custom hook for Kanban drag-and-drop logic
 *
 * Handles:
 * - Tracking the currently dragged item
 * - Optimistic UI updates on drop
 * - API calls to persist status changes
 * - Rollback on API errors
 */
export function useKanbanDragDrop({
  applications,
  setApplications,
  onError,
}: UseKanbanDragDropOptions) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      // If not dropped on a valid target, do nothing
      if (!over) return;

      const applicationId = active.id as number;
      const newStatus = over.id as ApplicationStatus;

      // Find the application being dragged
      const application = applications.find((app) => app.id === applicationId);
      if (!application) return;

      // If dropped on same status, do nothing
      if (application.status === newStatus) return;

      // Optimistic update: save previous state for potential rollback
      const previousApplications = [...applications];

      // Update UI immediately
      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      // Call API to persist the change
      setIsUpdating(true);
      try {
        await applicationsApi.updateStatus(applicationId, newStatus);
      } catch (error) {
        // Rollback on error
        setApplications(previousApplications);
        onError('Failed to update application status. Please try again.');
        console.error('Status update failed:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [applications, setApplications, onError]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Get the currently dragged application for the drag overlay
  const activeApplication = activeId
    ? applications.find((app) => app.id === activeId)
    : null;

  return {
    activeId,
    activeApplication,
    isUpdating,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
