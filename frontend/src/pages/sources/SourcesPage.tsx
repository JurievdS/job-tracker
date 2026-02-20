import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Source } from '@/types/source';
import { sourcesApi } from '@/api/sources';
import { SourceCard, SourcePanel } from '@/components/sources';
import { Button, Input, EmptyState, Skeleton, PageHeader } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';

export function SourcesPage() {
  const { addToast } = useToast();

  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Panel state (create / edit)
  const [panelMode, setPanelMode] = useState<'create' | 'edit' | null>(null);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  useEffect(() => {
    const fetchSources = async () => {
      try {
        const data = await sourcesApi.list();
        setSources(data);
      } catch {
        addToast('Failed to fetch sources', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSources();
  }, []);

  const filteredSources = useMemo(() => {
    if (!searchQuery.trim()) return sources;
    const q = searchQuery.toLowerCase();
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.region?.toLowerCase().includes(q)
    );
  }, [sources, searchQuery]);

  const handleOpenAdd = () => {
    setPanelMode('create');
    setEditingSource(null);
  };

  const handleEdit = (source: Source) => {
    setPanelMode('edit');
    setEditingSource(source);
  };

  const handleClosePanel = () => {
    setPanelMode(null);
    setEditingSource(null);
  };

  const handleSourceSaved = (saved: Source) => {
    if (panelMode === 'create') {
      setSources((prev) => [...prev, saved]);
    } else {
      setSources((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    }
  };

  const handleSourceUpdated = (updated: Source) => {
    setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSourceDeleted = (id: number) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Sources"
        subtitle="Job boards, recruiters, and other application sources"
        action={
          <Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>
            Add Source
          </Button>
        }
      />

      {/* Search */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources by name, category, or region..."
            startElement={<Search className="w-4 h-4" />}
            aria-label="Search sources"
          />
        </div>
      </div>

      {/* Source List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-4">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredSources.length === 0 ? (
        <EmptyState
          title="No sources found"
          description={searchQuery ? 'Try a different search term' : 'Add sources to track where you find jobs'}
          action={
            searchQuery
              ? { label: 'Clear Search', onClick: () => setSearchQuery('') }
              : { label: 'Add Source', onClick: handleOpenAdd }
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={handleEdit}
              onUpdate={handleSourceUpdated}
              onDelete={handleSourceDeleted}
            />
          ))}
          <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted text-center">
            {filteredSources.length} of {sources.length} source{sources.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Add/Edit Source Panel */}
      <SourcePanel
        isOpen={panelMode !== null}
        mode={panelMode || 'create'}
        source={editingSource}
        onClose={handleClosePanel}
        onSaved={handleSourceSaved}
      />
    </div>
  );
}
