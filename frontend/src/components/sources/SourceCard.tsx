import { useState } from 'react';
import { ChevronDown, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import type { Source, UserSourceNotes, SetUserSourceNotesDto } from '@/types/source';
import { SOURCE_CATEGORIES } from '@/types/source';
import { sourcesApi } from '@/api/sources';
import { Button, Input, Badge, Modal, StarRating } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';

interface SourceCardProps {
  source: Source;
  onEdit: (source: Source) => void;
  onUpdate: (updated: Source) => void;
  onDelete: (id: number) => void;
}

export function SourceCard({ source, onEdit, onUpdate, onDelete }: SourceCardProps) {
  const { addToast } = useToast();

  // Expand state
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasFetchedNotes, setHasFetchedNotes] = useState(false);

  // User notes state
  const [userNotes, setUserNotes] = useState<UserSourceNotes | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesForm, setNotesForm] = useState<SetUserSourceNotesDto>({});

  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const categoryLabel = source.category
    ? SOURCE_CATEGORIES.find((c) => c.value === source.category)?.label || source.category
    : null;

  const displayUrl = (url: string) =>
    url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const notes = await sourcesApi.getUserNotes(source.id);
      setUserNotes(notes);
      setNotesForm({
        notes: notes?.notes || '',
        rating: notes?.rating || undefined,
      });
    } catch {
      setUserNotes(null);
      setNotesForm({});
    } finally {
      setLoadingNotes(false);
      setHasFetchedNotes(true);
    }
  };

  const handleToggleExpand = () => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);
    if (willExpand && !hasFetchedNotes) {
      fetchNotes();
    }
  };

  const handleRatingChange = async (rating: number | null) => {
    const prevForm = { ...notesForm };
    const prevNotes = userNotes;

    // Optimistic update
    setNotesForm((f) => ({ ...f, rating: rating ?? undefined }));

    try {
      const saved = await sourcesApi.setUserNotes(source.id, {
        ...notesForm,
        rating: rating ?? undefined,
      });
      setUserNotes(saved);
    } catch {
      // Rollback
      setNotesForm(prevForm);
      setUserNotes(prevNotes);
      addToast('Failed to save rating', 'error');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const saved = await sourcesApi.setUserNotes(source.id, notesForm);
      setUserNotes(saved);
      addToast('Notes saved');
    } catch {
      addToast('Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteNotes = async () => {
    try {
      await sourcesApi.deleteUserNotes(source.id);
      setUserNotes(null);
      setNotesForm({});
      addToast('Notes removed');
    } catch {
      addToast('Failed to remove notes', 'error');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await sourcesApi.delete(source.id);
      onDelete(source.id);
      addToast('Source deleted');
    } catch {
      addToast('Failed to delete source', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border">
      {/* Card Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-alt rounded-t-[var(--radius-lg)]"
        onClick={handleToggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleExpand();
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text">{source.name}</span>
            {categoryLabel && <Badge variant="default">{categoryLabel}</Badge>}
            {source.region && (
              <span className="text-xs text-text-muted">{source.region}</span>
            )}
          </div>
          {source.description && (
            <p className="text-sm text-text-muted mt-1 truncate">
              {source.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-xs text-text-placeholder" title="Usage count">
            {source.usage_count} uses
          </span>
          {userNotes?.rating && (
            <StarRating value={userNotes.rating} size="sm" />
          )}
          <ChevronDown
            className={`w-5 h-5 text-text-placeholder transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Expanded Area */}
      {isExpanded && (
        <div className="border-t border-border p-4">
          {/* URL */}
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-3"
              onClick={(e) => e.stopPropagation()}
            >
              {displayUrl(source.url)}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          )}

          {/* User Notes Section */}
          <h3 className="text-sm font-medium text-text mb-3">
            Your Notes & Rating
          </h3>

          {loadingNotes ? (
            <p className="text-sm text-text-muted">Loading notes...</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Rating
                </label>
                <StarRating
                  value={notesForm.rating ?? null}
                  onChange={handleRatingChange}
                />
              </div>
              <Input
                label="Personal Notes"
                value={notesForm.notes || ''}
                onChange={(e) => setNotesForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Your experience with this source..."
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(source)}
                  icon={<Pencil className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Delete
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  {userNotes && (
                    <Button variant="danger" size="sm" onClick={handleDeleteNotes}>
                      Remove Notes
                    </Button>
                  )}
                  <Button size="sm" loading={savingNotes} onClick={handleSaveNotes}>
                    Save Notes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Source"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete <strong className="text-text">{source.name}</strong>?
            This source will be removed from listings but existing applications will keep their reference.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              Delete Source
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
