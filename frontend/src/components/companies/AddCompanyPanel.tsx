import { useState } from 'react';
import type { CompanyWithNotes } from '@/types/company';
import { companiesApi } from '@/api/companies';
import { Button, Input, Modal, CollapsibleSection } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';

interface AddCompanyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (company: CompanyWithNotes) => void;
}

export function AddCompanyPanel({ isOpen, onClose, onCreated }: AddCompanyPanelProps) {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setIndustry('');
    setWebsite('');
    setLocation('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Company name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newCompany = await companiesApi.create({
        name: name.trim(),
        website: normalizeUrl(website),
        location: location.trim() || undefined,
        industry: industry.trim() || undefined,
      });

      const companyWithNotes: CompanyWithNotes = {
        ...newCompany,
        user_notes: null,
        user_rating: null,
      };

      onCreated(companyWithNotes);
      addToast('Company created');
      handleClose();
    } catch (err) {
      const msg = parseApiError(err, 'Failed to create company');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Company">
      <form onSubmit={handleSubmit} className="space-y-1">
        {error && (
          <div className="bg-danger-light text-danger-text p-3 rounded-[var(--radius-md)] text-sm">
            {error}
          </div>
        )}

        <CollapsibleSection title="Essentials" defaultOpen>
          <div className="space-y-3">
            <Input
              label="Company Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Google"
              required
            />
            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Technology, Finance, Healthcare"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Details">
          <div className="space-y-3">
            <Input
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., google.com"
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Mountain View, CA"
            />
          </div>
        </CollapsibleSection>

        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <div className="ml-auto">
            <Button type="submit" loading={isSubmitting}>
              Add Company
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
