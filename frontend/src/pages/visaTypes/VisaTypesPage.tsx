import { useState, useEffect } from 'react';
import type {
  VisaType,
  CreateVisaTypeDto,
  VisaRequirement,
  CreateVisaRequirementDto,
} from '@/types/visaType';
import { REQUIREMENT_TYPES } from '@/types/visaType';
import { visaTypesApi } from '@/api/visaTypes';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';
import { formatDate } from '@/utils/date';
import { Plus, Pencil, Trash2, ChevronDown, X, Search } from 'lucide-react';
import { Button, Input, Select, Modal, Form, EmptyState, DateInput, PageHeader, Alert, Skeleton, Tooltip } from '@/components/common';

export function VisaTypesPage() {
  const { addToast } = useToast();

  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter
  const [countryFilter, setCountryFilter] = useState('');

  // Expanded visa type (shows requirements)
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<Record<number, VisaRequirement[]>>({});
  const [loadingRequirements, setLoadingRequirements] = useState<number | null>(null);

  // Add/Edit visa type modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVisaType, setEditingVisaType] = useState<VisaType | null>(null);
  const [form, setForm] = useState<CreateVisaTypeDto>({
    country_code: '',
    name: '',
    valid_from: '',
  });

  // Add requirement inline form
  const [showAddRequirement, setShowAddRequirement] = useState(false);
  const [addingRequirement, setAddingRequirement] = useState(false);
  const [reqForm, setReqForm] = useState<Omit<CreateVisaRequirementDto, 'visa_type_id'>>({
    requirement_type: 'salary_min',
  });

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [visaTypeToDelete, setVisaTypeToDelete] = useState<VisaType | null>(null);

  const fetchVisaTypes = async () => {
    try {
      const data = await visaTypesApi.list(countryFilter || undefined);
      setVisaTypes(data);
    } catch (err) {
      addToast('Failed to fetch visa types', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisaTypes();
  }, [countryFilter]);

  const fetchRequirements = async (visaTypeId: number) => {
    setLoadingRequirements(visaTypeId);
    try {
      const data = await visaTypesApi.listRequirements(visaTypeId);
      setRequirements((prev) => ({ ...prev, [visaTypeId]: data }));
    } catch (err) {
      console.error('Failed to fetch requirements', err);
    } finally {
      setLoadingRequirements(null);
    }
  };

  const handleToggleExpand = (visaType: VisaType) => {
    if (expandedId === visaType.id) {
      setExpandedId(null);
      setShowAddRequirement(false);
    } else {
      setExpandedId(visaType.id);
      setShowAddRequirement(false);
      if (!requirements[visaType.id]) {
        fetchRequirements(visaType.id);
      }
    }
  };

  // Visa type CRUD
  const resetForm = () => {
    setForm({ country_code: '', name: '', valid_from: '' });
    setEditingVisaType(null);
    setFormError(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (vt: VisaType) => {
    setEditingVisaType(vt);
    setForm({
      country_code: vt.country_code,
      name: vt.name,
      description: vt.description || undefined,
      source_url: vt.source_url || undefined,
      valid_from: vt.valid_from,
      valid_until: vt.valid_until || undefined,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmitVisaType = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = { ...form, source_url: normalizeUrl(form.source_url || '') };
      if (editingVisaType) {
        const updated = await visaTypesApi.update(editingVisaType.id, payload);
        setVisaTypes((prev) => prev.map((vt) => (vt.id === editingVisaType.id ? updated : vt)));
        addToast('Visa type updated', 'success');
      } else {
        const created = await visaTypesApi.create(payload);
        setVisaTypes((prev) => [...prev, created]);
        addToast('Visa type created', 'success');
      }
      handleCloseModal();
    } catch (err) {
      setFormError(parseApiError(err, 'Failed to save visa type'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (vt: VisaType) => {
    setVisaTypeToDelete(vt);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!visaTypeToDelete) return;
    setIsSubmitting(true);
    try {
      await visaTypesApi.delete(visaTypeToDelete.id);
      setVisaTypes((prev) => prev.filter((vt) => vt.id !== visaTypeToDelete.id));
      if (expandedId === visaTypeToDelete.id) setExpandedId(null);
      setDeleteModalOpen(false);
      setVisaTypeToDelete(null);
      addToast('Visa type deleted', 'success');
    } catch (err) {
      addToast('Failed to delete visa type', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Requirement CRUD
  const resetReqForm = () => {
    setReqForm({ requirement_type: 'salary_min' });
    setShowAddRequirement(false);
  };

  const handleAddRequirement = async () => {
    if (!expandedId) return;
    setAddingRequirement(true);
    try {
      const created = await visaTypesApi.createRequirement(expandedId, {
        ...reqForm,
        visa_type_id: expandedId,
      });
      setRequirements((prev) => ({
        ...prev,
        [expandedId]: [...(prev[expandedId] || []), created],
      }));
      addToast('Requirement added', 'success');
      resetReqForm();
    } catch (err) {
      addToast(parseApiError(err, 'Failed to add requirement'), 'error');
    } finally {
      setAddingRequirement(false);
    }
  };

  const handleDeleteRequirement = async (reqId: number, visaTypeId: number) => {
    try {
      await visaTypesApi.deleteRequirement(reqId);
      setRequirements((prev) => ({
        ...prev,
        [visaTypeId]: (prev[visaTypeId] || []).filter((r) => r.id !== reqId),
      }));
      addToast('Requirement deleted', 'success');
    } catch {
      addToast('Failed to delete requirement', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader
          title="Visa Types"
          subtitle="Reference data for visa types and their requirements"
        />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border p-4">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Visa Types"
        subtitle="Reference data for visa types and their requirements"
        action={<Button onClick={handleOpenAdd} icon={<Plus className="w-4 h-4" />}>Add Visa Type</Button>}
      />

      {/* Country Filter */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Input
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value.toUpperCase())}
            placeholder="Filter by country code (e.g., NLD)"
            startElement={<Search className="w-4 h-4" />}
            aria-label="Filter by country code"
          />
        </div>
      </div>

      {/* Visa Types List */}
      {visaTypes.length === 0 ? (
        <EmptyState
          title="No visa types found"
          description={countryFilter ? `No visa types for country "${countryFilter}"` : 'Add visa types to build your reference library'}
          action={
            countryFilter
              ? { label: 'Clear Filter', onClick: () => setCountryFilter('') }
              : { label: 'Add Visa Type', onClick: handleOpenAdd }
          }
        />
      ) : (
        <div className="space-y-3">
          {visaTypes.map((vt) => (
            <div
              key={vt.id}
              className="bg-surface rounded-[var(--radius-lg)] shadow-sm border border-border"
            >
              {/* Visa Type Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-alt rounded-t-[var(--radius-lg)]"
                onClick={() => handleToggleExpand(vt)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggleExpand(vt);
                  }
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">{vt.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light text-primary">
                      {vt.country_code}
                    </span>
                    {vt.valid_until && new Date(vt.valid_until) < new Date() && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-danger-light text-danger-text">
                        Expired
                      </span>
                    )}
                  </div>
                  {vt.description && (
                    <p className="text-sm text-text-muted mt-1 truncate">
                      {vt.description}
                    </p>
                  )}
                  <div className="text-xs text-text-placeholder mt-1">
                    Valid from {formatDate(vt.valid_from)}
                    {vt.valid_until && ` to ${formatDate(vt.valid_until)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Tooltip content="Edit">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleOpenEdit(vt); }}
                      aria-label="Edit"
                      className="text-text-placeholder hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Delete">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteClick(vt); }}
                      aria-label="Delete"
                      className="text-text-placeholder hover:text-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Tooltip>
                  <ChevronDown
                    className={`w-5 h-5 text-text-placeholder transition-transform ${expandedId === vt.id ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Expanded Requirements Section */}
              {expandedId === vt.id && (
                <div className="border-t border-border p-4">
                  {vt.source_url && (
                    <p className="text-sm text-primary mb-3">
                      <a href={vt.source_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View official source
                      </a>
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-text">Requirements</h3>
                    {!showAddRequirement && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => { resetReqForm(); setShowAddRequirement(true); }}
                        icon={<Plus className="w-4 h-4" />}
                      >
                        Add Requirement
                      </Button>
                    )}
                  </div>

                  {loadingRequirements === vt.id ? (
                    <p className="text-sm text-text-muted">Loading requirements...</p>
                  ) : (requirements[vt.id] || []).length === 0 ? (
                    <p className="text-sm text-text-muted">No requirements defined yet.</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {(requirements[vt.id] || []).map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-2 bg-surface-alt rounded-[var(--radius-md)] text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-text-secondary">
                                {REQUIREMENT_TYPES.find((t) => t.value === req.requirement_type)?.label || req.requirement_type}
                              </span>
                              {req.condition_label && (
                                <span className="font-medium text-text">
                                  {req.condition_label}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-muted mt-0.5">
                              {req.min_value != null && (
                                <span>
                                  Min: {req.currency && `${req.currency} `}{req.min_value.toLocaleString()}
                                  {req.period && ` / ${req.period}`}
                                </span>
                              )}
                              {req.description && (
                                <span className={req.min_value != null ? 'ml-2' : ''}>
                                  {req.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <Tooltip content="Delete">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequirement(req.id, vt.id)}
                              aria-label="Delete requirement"
                              className="text-text-placeholder hover:text-danger ml-2"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Requirement Form */}
                  {showAddRequirement && (
                    <div className="border border-border rounded-[var(--radius-md)] p-3 mt-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Select
                          label="Requirement Type"
                          options={REQUIREMENT_TYPES}
                          value={reqForm.requirement_type}
                          onChange={(e) => setReqForm((f) => ({ ...f, requirement_type: e.target.value as any }))}
                        />
                        <Input
                          label="Condition Label"
                          value={reqForm.condition_label || ''}
                          onChange={(e) => setReqForm((f) => ({ ...f, condition_label: e.target.value }))}
                          placeholder="e.g., Highly Skilled Migrant"
                        />
                        <Input
                          label="Minimum Value"
                          type="number"
                          value={reqForm.min_value?.toString() || ''}
                          onChange={(e) => setReqForm((f) => ({ ...f, min_value: e.target.value ? Number(e.target.value) : undefined }))}
                          placeholder="e.g., 46107"
                        />
                        <Input
                          label="Currency"
                          value={reqForm.currency || ''}
                          onChange={(e) => setReqForm((f) => ({ ...f, currency: e.target.value }))}
                          placeholder="e.g., EUR"
                        />
                        <Input
                          label="Period"
                          value={reqForm.period || ''}
                          onChange={(e) => setReqForm((f) => ({ ...f, period: e.target.value }))}
                          placeholder="e.g., annual"
                        />
                        <Input
                          label="Description"
                          value={reqForm.description || ''}
                          onChange={(e) => setReqForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Additional details..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" size="sm" onClick={resetReqForm}>
                          Cancel
                        </Button>
                        <Button type="button" size="sm" loading={addingRequirement} onClick={handleAddRequirement}>
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Visa Type Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVisaType ? 'Edit Visa Type' : 'Add Visa Type'}
        size="lg"
      >
        <Form onSubmit={handleSubmitVisaType}>
          <div className="space-y-4">
            {formError && (
              <Alert variant="danger">{formError}</Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Country Code (ISO alpha-3)"
                value={form.country_code}
                onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value.toUpperCase() }))}
                placeholder="NLD"
                maxLength={3}
                required
              />
              <Input
                label="Visa Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Highly Skilled Migrant"
                required
              />
            </div>

            <Input
              label="Description"
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the visa type"
            />

            <Input
              label="Source URL"
              value={form.source_url || ''}
              onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
              placeholder="https://ind.nl/..."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                label="Valid From"
                value={form.valid_from}
                onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                required
              />
              <DateInput
                label="Valid Until (optional)"
                value={form.valid_until || ''}
                onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value || undefined }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingVisaType ? 'Update' : 'Add Visa Type'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Visa Type"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this visa type? This will also delete all associated requirements.
          </p>
          {visaTypeToDelete && (
            <div className="bg-surface-alt p-3 rounded-[var(--radius-md)] text-sm">
              <p className="font-medium text-text">{visaTypeToDelete.name}</p>
              <p className="text-text-muted mt-1">
                {visaTypeToDelete.country_code}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={isSubmitting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
