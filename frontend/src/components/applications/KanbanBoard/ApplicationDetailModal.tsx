import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Textarea,
  Select,
  DateInput,
  StatusBadge,
} from '@/components/common';
import { applicationsApi } from '@/api/applications';
import {
  APPLICATION_STATUSES,
  type Application,
  type ApplicationStatus,
} from '@/types/application';

interface ApplicationDetailModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Application) => void;
  onDelete: (id: number) => void;
}

/**
 * ApplicationDetailModal - View and edit application details
 *
 * Features:
 * - View mode: displays all application details
 * - Edit mode: form to update status, date, notes
 * - Delete with confirmation
 */
export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ApplicationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState<ApplicationStatus>('bookmarked');
  const [dateApplied, setDateApplied] = useState('');
  const [notes, setNotes] = useState('');

  // Reset form when application changes
  useEffect(() => {
    if (application) {
      setStatus(application.status);
      setDateApplied(application.date_applied || '');
      setNotes(application.notes || '');
      setIsEditing(false);
      setError(null);
    }
  }, [application]);

  if (!application) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await applicationsApi.update(application.id, {
        status,
        date_applied: dateApplied || undefined,
        notes: notes || undefined,
      });
      // Merge with existing data since API might not return joined fields
      onUpdate({
        ...application,
        ...updated,
        status,
        date_applied: dateApplied || undefined,
        notes: notes || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save changes. Please try again.');
      console.error('Failed to update application:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this application?')) return;

    setIsDeleting(true);
    setError(null);
    try {
      await applicationsApi.delete(application.id);
      onDelete(application.id);
      onClose();
    } catch (err) {
      setError('Failed to delete application. Please try again.');
      console.error('Failed to delete application:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Application Details" size="lg">
      <div className="space-y-4">
        {/* Error display */}
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Header info (always read-only) */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-900">
            {application.company_name}
          </h3>
          <p className="text-gray-600">{application.position_title}</p>
        </div>

        {isEditing ? (
          /* Edit mode */
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              options={APPLICATION_STATUSES}
            />

            <DateInput
              label="Date Applied"
              value={dateApplied}
              onChange={(e) => setDateApplied(e.target.value)}
              showRelative
            />

            <Textarea
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={4}
            />

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  // Reset to original values
                  setStatus(application.status);
                  setDateApplied(application.date_applied || '');
                  setNotes(application.notes || '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSaving}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          /* View mode */
          <>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 block mb-1">Status</span>
                <StatusBadge status={application.status} />
              </div>

              <div>
                <span className="text-sm text-gray-500 block mb-1">Date Applied</span>
                <p className="text-gray-900">
                  {application.date_applied
                    ? new Date(application.date_applied).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not set'}
                </p>
              </div>

              <div>
                <span className="text-sm text-gray-500 block mb-1">Notes</span>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {application.notes || 'No notes'}
                </p>
              </div>

              <div className="text-xs text-gray-400 pt-4 border-t space-y-1">
                <p>
                  Created: {new Date(application.created_at).toLocaleString()}
                </p>
                <p>
                  Updated: {new Date(application.updated_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="danger"
                onClick={handleDelete}
                loading={isDeleting}
              >
                Delete
              </Button>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
