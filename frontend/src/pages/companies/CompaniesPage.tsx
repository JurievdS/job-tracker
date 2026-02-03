import { useState, useEffect, useMemo } from 'react';
import type { Company } from '@/types/company';
import { CompanyDetail, CompanyList } from '@/components/companies';
import { companiesApi } from '@/api/companies';
import { Button, Input, Modal, Form } from '@/components/common';

export function CompaniesPage() {
  // Company list state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Add company modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await companiesApi.list();
        setCompanies(data);
      } catch (err) {
        setError('Failed to fetch companies');
        console.error('Failed to fetch companies', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Filter companies by search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm.trim()) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.location?.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleAddCompany = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setNewCompanyName('');
    setNewCompanyWebsite('');
    setNewCompanyLocation('');
    setError(null);
  };

  const handleSubmitNewCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCompanyName.trim()) {
      setError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newCompany = await companiesApi.create({
        name: newCompanyName.trim(),
        website: newCompanyWebsite.trim() || undefined,
        location: newCompanyLocation.trim() || undefined,
      });

      // Add to list and select it
      setCompanies((prev) => [newCompany, ...prev]);
      setSelectedCompany(newCompany);
      handleCloseModal();
    } catch (err: unknown) {
      // Handle 409 Conflict (similar company already exists)
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 409) {
          setError(axiosError.response.data?.error || 'A similar company already exists');
        } else {
          setError('Failed to create company');
        }
      } else {
        setError('Failed to create company');
      }
      console.error('Failed to create company', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse and manage company information
          </p>
        </div>
        <Button onClick={handleAddCompany}>+ Add Company</Button>
      </div>

      {/* Error State */}
      {error && !isAddModalOpen && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Main Content - Split View */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Company List */}
        <div className="w-80 flex-shrink-0 flex flex-col bg-gray-50 rounded-lg p-4">
          {/* Search */}
          <div className="mb-4">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto -mx-2">
            <CompanyList
              companies={filteredCompanies}
              selectedId={selectedCompany?.id ?? null}
              onSelect={handleSelectCompany}
              loading={loading}
            />
          </div>

          {/* Count */}
          {!loading && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 text-center">
              {filteredCompanies.length} of {companies.length} companies
            </div>
          )}
        </div>

        {/* Right Panel - Company Detail */}
        <div className="flex-1 min-w-0">
          <CompanyDetail
            company={selectedCompany}
            loading={loading && !selectedCompany}
          />
        </div>
      </div>

      {/* Add Company Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        title="Add Company"
      >
        <Form onSubmit={handleSubmitNewCompany}>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Input
              label="Company Name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="e.g., Google"
              required
            />

            <Input
              label="Website"
              value={newCompanyWebsite}
              onChange={(e) => setNewCompanyWebsite(e.target.value)}
              placeholder="e.g., https://google.com"
            />

            <Input
              label="Location"
              value={newCompanyLocation}
              onChange={(e) => setNewCompanyLocation(e.target.value)}
              placeholder="e.g., Mountain View, CA"
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
                Add Company
              </Button>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
