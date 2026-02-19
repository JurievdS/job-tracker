import { useState, useEffect, useMemo } from 'react';
import { Plus, ArrowLeft, Search } from 'lucide-react';
import type { CompanyWithNotes } from '@/types/company';
import { CompanyDetail, CompanyList, AddCompanyPanel } from '@/components/companies';
import { companiesApi } from '@/api/companies';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Select, PageHeader } from '@/components/common';

type SortBy = 'name' | 'rating' | 'created_at';

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
  { value: 'created_at', label: 'Newest' },
];

export function CompaniesPage() {
  const { addToast } = useToast();

  // Company list state
  const [companies, setCompanies] = useState<CompanyWithNotes[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, sort, and selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithNotes | null>(null);

  // Add company modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const data = await companiesApi.list();
        setCompanies(data);
      } catch (err) {
        addToast('Failed to fetch companies', 'error');
        console.error('Failed to fetch companies', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Derive unique industries for filter
  const industryOptions = useMemo(() => {
    const industries = [...new Set(companies.map((c) => c.industry).filter(Boolean))] as string[];
    return [
      { value: '', label: 'All Industries' },
      ...industries.sort().map((i) => ({ value: i, label: i })),
    ];
  }, [companies]);

  // Filter + sort companies
  const filteredCompanies = useMemo(() => {
    let result = companies;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.location?.toLowerCase().includes(term) ||
          c.industry?.toLowerCase().includes(term)
      );
    }

    if (industryFilter) {
      result = result.filter((c) => c.industry === industryFilter);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.user_rating ?? 0) - (a.user_rating ?? 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [companies, searchTerm, industryFilter, sortBy]);

  const handleSelectCompany = (company: CompanyWithNotes) => {
    setSelectedCompany(company);
  };

  // Sync updates from CompanyDetail back to the list
  const handleCompanyUpdate = (updated: CompanyWithNotes) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    setSelectedCompany(updated);
  };

  // Remove deleted company from list and clear selection
  const handleCompanyDelete = (id: number) => {
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setSelectedCompany(null);
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Companies"
        subtitle="Browse and manage company information"
        action={
          <Button onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Company
          </Button>
        }
      />

      {/* Main Content - Split View (desktop) / Single View (mobile) */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel - Company List */}
        <div className={`w-80 flex-shrink-0 flex flex-col bg-surface-alt rounded-[var(--radius-lg)] p-4 max-md:w-full ${selectedCompany ? 'max-md:hidden' : ''}`}>
          {/* Search + Filters */}
          <div className="mb-4 space-y-2">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startElement={<Search className="w-4 h-4" />}
            />
            <div className="flex gap-2">
              {industryOptions.length > 2 && (
                <div className="flex-1 min-w-0">
                  <Select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    options={industryOptions}
                    aria-label="Filter by industry"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  options={SORT_OPTIONS}
                  aria-label="Sort companies"
                />
              </div>
            </div>
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
            <div className="mt-3 pt-3 border-t border-border text-xs text-text-muted text-center">
              {filteredCompanies.length} of {companies.length} companies
            </div>
          )}
        </div>

        {/* Right Panel - Company Detail */}
        <div className={`flex-1 min-w-0 overflow-y-auto ${!selectedCompany ? 'max-md:hidden' : ''}`}>
          {/* Mobile back button */}
          {selectedCompany && (
            <div className="md:hidden mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCompany(null)}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to list
              </Button>
            </div>
          )}
          <CompanyDetail
            company={selectedCompany}
            loading={loading && !selectedCompany}
            onCompanyUpdate={handleCompanyUpdate}
            onCompanyDelete={handleCompanyDelete}
            onAddCompany={() => setIsAddModalOpen(true)}
          />
        </div>
      </div>

      {/* Add Company Modal */}
      <AddCompanyPanel
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={(company) => {
          setCompanies((prev) => [company, ...prev]);
          setSelectedCompany(company);
        }}
      />
    </div>
  );
}
