import { useState, useEffect } from 'react';
import type { Source, SourceCategory } from '@/types/source';
import { SOURCE_CATEGORIES } from '@/types/source';
import { sourcesApi } from '@/api/sources';
import { Button, Input, Textarea, Select, Modal, CollapsibleSection, Alert } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';

interface SourcePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (source: Source) => void;
  mode: 'create' | 'edit';
  source?: Source | null;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select a category...' },
  ...SOURCE_CATEGORIES,
];

export function SourcePanel({ isOpen, onClose, onSaved, mode, source }: SourcePanelProps) {
  const { addToast } = useToast();
  const isCreate = mode === 'create';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync fields when source changes (edit mode)
  useEffect(() => {
    if (source && mode === 'edit') {
      setName(source.name);
      setCategory(source.category || '');
      setUrl(source.url || '');
      setRegion(source.region || '');
      setDescription(source.description || '');
    } else {
      setName('');
      setCategory('');
      setUrl('');
      setRegion('');
      setDescription('');
    }
    setError(null);
  }, [source, mode, isOpen]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Source name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        url: normalizeUrl(url),
        category: (category || undefined) as SourceCategory | undefined,
        region: region.trim() || undefined,
        description: description.trim() || undefined,
      };

      let saved: Source;
      if (isCreate) {
        saved = await sourcesApi.create(payload);
        addToast('Source created');
      } else {
        saved = await sourcesApi.update(source!.id, payload);
        addToast('Source updated');
      }

      onSaved(saved);
      handleClose();
    } catch (err) {
      const msg = parseApiError(err, isCreate ? 'Failed to create source' : 'Failed to update source');
      setError(msg);
      // Don't toast for 409 conflicts since the inline error is sufficient
      if (!(err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status === 409)) {
        addToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isCreate ? 'Add Source' : 'Edit Source'}>
      <form onSubmit={handleSubmit} className="space-y-1">
        {error && (
          <Alert variant="danger">{error}</Alert>
        )}

        <CollapsibleSection title="Essentials" defaultOpen>
          <div className="space-y-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., LinkedIn Jobs"
              required
            />
            <Select
              label="Category"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Details" defaultOpen={!isCreate && !!(url || region || description)}>
          <div className="space-y-3">
            <Input
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs"
            />
            <Input
              label="Region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., global, EU, NL"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this source..."
              rows={3}
            />
          </div>
        </CollapsibleSection>

        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <div className="ml-auto">
            <Button type="submit" loading={isSubmitting}>
              {isCreate ? 'Add Source' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
