import { useState, useEffect, useRef } from 'react';
import { Plus, Check } from 'lucide-react';
import { tagsApi, type Tag } from '@/api/tags';
import { applicationsApi } from '@/api/applications';
import type { ApplicationTag } from '@/types/application';

const TAG_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

interface TagPickerProps {
  /** Application to manage tags for */
  applicationId: number;
  /** Tags currently on this application */
  currentTags: ApplicationTag[];
  /** Called when tags change (after API call succeeds) */
  onTagsChange: (tags: ApplicationTag[]) => void;
}

/**
 * TagPicker - Dropdown for adding/removing/creating tags on an application
 *
 * Renders a "+" button that opens a dropdown with all user tags as checkboxes.
 * Includes a "Create new tag" row with name input and color picker.
 */
export function TagPicker({
  applicationId,
  currentTags,
  onTagsChange,
}: TagPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create new tag state
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[5]); // default blue
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all tags when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      tagsApi.list()
        .then(setAllTags)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setNewTagName('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentTagIds = new Set(currentTags.map((t) => t.id));

  const handleToggleTag = async (tag: Tag) => {
    const isSelected = currentTagIds.has(tag.id);
    let newTags: ApplicationTag[];

    if (isSelected) {
      newTags = currentTags.filter((t) => t.id !== tag.id);
    } else {
      newTags = [...currentTags, { id: tag.id, name: tag.name, color: tag.color }];
    }

    // Optimistically update
    onTagsChange(newTags);

    try {
      await applicationsApi.setTags(applicationId, newTags.map((t) => t.id));
    } catch {
      // Revert on failure
      onTagsChange(currentTags);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    setIsCreating(true);
    try {
      const created = await tagsApi.create({ name, color: newTagColor });
      // Add to allTags list
      setAllTags((prev) => [...prev, { ...created, application_count: 0 }]);
      // Auto-assign to this application
      const newTags = [...currentTags, { id: created.id, name: created.name, color: created.color }];
      await applicationsApi.setTags(applicationId, newTags.map((t) => t.id));
      onTagsChange(newTags);
      setNewTagName('');
    } catch {
      // Silently fail — tag creation error or assignment error
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-0.5 rounded-full text-text-placeholder hover:text-text-secondary hover:bg-surface-alt transition-colors"
        aria-label="Manage tags"
      >
        <Plus className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg overflow-hidden">
          {/* Tag list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {isLoading ? (
              <p className="px-3 py-2 text-xs text-text-muted">Loading...</p>
            ) : allTags.length === 0 ? (
              <p className="px-3 py-2 text-xs text-text-muted">No tags yet</p>
            ) : (
              allTags.map((tag) => {
                const isSelected = currentTagIds.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-surface-alt transition-colors"
                  >
                    {/* Color dot */}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color || 'var(--color-text-muted)' }}
                    />
                    <span className="flex-1 truncate text-text">{tag.name}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Create new tag */}
          <div className="border-t border-border px-3 py-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                placeholder="New tag name..."
                className="flex-1 min-w-0 text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-border bg-surface text-text placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-border-focus"
                disabled={isCreating}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreating}
                className="text-xs font-medium text-primary hover:text-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
            {/* Color preset picker */}
            <div className="flex items-center gap-1">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    newTagColor === c ? 'ring-2 ring-offset-1 ring-border-focus scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
