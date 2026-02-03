import { useState, useEffect, useMemo } from 'react';
import type { PositionWithCompany, CreatePositionDto, UpdatePositionDto } from '@/types/position';
import type { Company } from '@/types/company';
import { positionsApi } from '@/api/positions';
import { companiesApi } from '@/api/companies';
import { Button, Input, Textarea, Select, Modal, Form, Table } from '@/components/common';

export function PositionsPage() {
  // Positions list state
  const [positions, setPositions] = useState<PositionWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterCompanyId, setFilterCompanyId] = useState<string>('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionWithCompany | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formCompanyId, setFormCompanyId] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formSalaryMin, setFormSalaryMin] = useState('');
  const [formSalaryMax, setFormSalaryMax] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formJobUrl, setFormJobUrl] = useState('');

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [positionToDelete, setPositionToDelete] = useState<PositionWithCompany | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [positionsData, companiesData] = await Promise.all([
          positionsApi.list(),
          companiesApi.list(),
        ]);
        setPositions(positionsData);
        setCompanies(companiesData);
      } catch (err) {
        setError('Failed to fetch data');
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter positions by company
  const filteredPositions = useMemo(() => {
    if (!filterCompanyId) return positions;
    return positions.filter((p) => p.company_id === Number(filterCompanyId));
  }, [positions, filterCompanyId]);

  const companyOptions = useMemo(() => {
    return [
      { value: '', label: 'All Companies' },
      ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ];
  }, [companies]);

  const formCompanyOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a company...' },
      ...companies.map((c) => ({ value: String(c.id), label: c.name })),
    ];
  }, [companies]);

  const resetForm = () => {
    setFormCompanyId('');
    setFormTitle('');
    setFormSalaryMin('');
    setFormSalaryMax('');
    setFormRequirements('');
    setFormJobUrl('');
    setError(null);
  };

  const handleOpenAddModal = () => {
    setEditingPosition(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (position: PositionWithCompany) => {
    setEditingPosition(position);
    setFormCompanyId(position.company_id ? String(position.company_id) : '');
    setFormTitle(position.title);
    setFormSalaryMin(position.salary_min ? String(position.salary_min) : '');
    setFormSalaryMax(position.salary_max ? String(position.salary_max) : '');
    setFormRequirements(position.requirements || '');
    setFormJobUrl(position.job_url || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPosition(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCompanyId) {
      setError('Please select a company');
      return;
    }

    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingPosition) {
        // Update existing position
        const updateData: UpdatePositionDto = {
          company_id: Number(formCompanyId),
          title: formTitle.trim(),
          salary_min: formSalaryMin ? Number(formSalaryMin) : undefined,
          salary_max: formSalaryMax ? Number(formSalaryMax) : undefined,
          requirements: formRequirements.trim() || undefined,
          job_url: formJobUrl.trim() || undefined,
        };

        await positionsApi.update(editingPosition.id, updateData);

        // Refetch to get updated company_name
        const updatedPositions = await positionsApi.list();
        setPositions(updatedPositions);
      } else {
        // Create new position
        const createData: CreatePositionDto = {
          company_id: Number(formCompanyId),
          title: formTitle.trim(),
          salary_min: formSalaryMin ? Number(formSalaryMin) : undefined,
          salary_max: formSalaryMax ? Number(formSalaryMax) : undefined,
          requirements: formRequirements.trim() || undefined,
          job_url: formJobUrl.trim() || undefined,
        };

        await positionsApi.create(createData);

        // Refetch to get the new position with company_name
        const updatedPositions = await positionsApi.list();
        setPositions(updatedPositions);
      }

      handleCloseModal();
    } catch (err) {
      setError(editingPosition ? 'Failed to update position' : 'Failed to create position');
      console.error('Submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (position: PositionWithCompany, e: React.MouseEvent) => {
    e.stopPropagation();
    setPositionToDelete(position);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!positionToDelete) return;

    setIsSubmitting(true);
    try {
      await positionsApi.delete(positionToDelete.id);
      setPositions((prev) => prev.filter((p) => p.id !== positionToDelete.id));
      setIsDeleteModalOpen(false);
      setPositionToDelete(null);
    } catch (err) {
      setError('Failed to delete position');
      console.error('Delete error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSalary = (min: number | null, max: number | null): string => {
    if (!min && !max) return '-';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max!.toLocaleString()}`;
  };

  const columns = [
    {
      key: 'title' as const,
      header: 'Title',
      width: 'w-1/4',
    },
    {
      key: 'company_name' as const,
      header: 'Company',
      width: 'w-1/5',
    },
    {
      key: 'salary_min' as const,
      header: 'Salary Range',
      width: 'w-1/5',
      render: (_: number | null, row: PositionWithCompany) =>
        formatSalary(row.salary_min, row.salary_max),
    },
    {
      key: 'job_url' as const,
      header: 'Job URL',
      width: 'w-1/5',
      render: (value: string | null) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      width: 'w-24',
      render: (_: number, row: PositionWithCompany) => (
        <Button
          variant="danger"
          onClick={(e: React.MouseEvent) => handleDeleteClick(row, e)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Positions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage job positions across companies
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>+ Add Position</Button>
      </div>

      {/* Filter */}
      <div className="mb-4 max-w-xs">
        <Select
          label="Filter by Company"
          options={companyOptions}
          value={filterCompanyId}
          onChange={(e) => setFilterCompanyId(e.target.value)}
        />
      </div>

      {/* Error State */}
      {error && !isModalOpen && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Positions Table */}
      <div className="flex-1">
        <Table
          data={filteredPositions}
          columns={columns}
          onRowClick={handleOpenEditModal}
          loading={loading}
        />
        {!loading && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            {filteredPositions.length} of {positions.length} positions
          </div>
        )}
      </div>

      {/* Add/Edit Position Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPosition ? 'Edit Position' : 'Add Position'}
      >
        <Form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Select
              label="Company"
              options={formCompanyOptions}
              value={formCompanyId}
              onChange={(e) => setFormCompanyId(e.target.value)}
              required
            />

            <Input
              label="Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Salary Min"
                type="number"
                value={formSalaryMin}
                onChange={(e) => setFormSalaryMin(e.target.value)}
                placeholder="e.g., 80000"
              />
              <Input
                label="Salary Max"
                type="number"
                value={formSalaryMax}
                onChange={(e) => setFormSalaryMax(e.target.value)}
                placeholder="e.g., 120000"
              />
            </div>

            <Input
              label="Job URL"
              type="url"
              value={formJobUrl}
              onChange={(e) => setFormJobUrl(e.target.value)}
              placeholder="e.g., https://example.com/jobs/123"
            />

            <Textarea
              label="Requirements"
              value={formRequirements}
              onChange={(e) => setFormRequirements(e.target.value)}
              placeholder="List job requirements..."
              rows={4}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {editingPosition ? 'Save Changes' : 'Add Position'}
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Position"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the position{' '}
            <strong>{positionToDelete?.title}</strong> at{' '}
            <strong>{positionToDelete?.company_name}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone. Any applications linked to this position
            will also be affected.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
