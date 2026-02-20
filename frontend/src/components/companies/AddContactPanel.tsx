import { useState } from 'react';
import type { Contact } from '@/types/contact';
import { contactsApi } from '@/api/contacts';
import { Button, Input, Textarea, Modal, CollapsibleSection } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';

interface AddContactPanelProps {
  companyId: number;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (contact: Contact) => void;
}

export function AddContactPanel({ companyId, isOpen, onClose, onCreated }: AddContactPanelProps) {
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setLinkedin('');
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Contact name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newContact = await contactsApi.create({
        name: name.trim(),
        company_id: companyId,
        role: role.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedin: normalizeUrl(linkedin),
        notes: notes.trim() || undefined,
      });

      onCreated(newContact);
      addToast('Contact added');
      handleClose();
    } catch (err) {
      const msg = parseApiError(err, 'Failed to add contact');
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Contact">
      <form onSubmit={handleSubmit} className="space-y-1">
        {error && (
          <div className="bg-danger-light text-danger-text p-3 rounded-[var(--radius-md)] text-sm">
            {error}
          </div>
        )}

        <CollapsibleSection title="Essentials" defaultOpen>
          <div className="space-y-3">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith"
              required
            />
            <Input
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Recruiter"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Contact Info">
          <div className="space-y-3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., john@company.com"
            />
            <Input
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., +1 (555) 123-4567"
            />
            <Input
              label="LinkedIn"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="e.g., linkedin.com/in/johnsmith"
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Notes">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this contact..."
            rows={3}
          />
        </CollapsibleSection>

        <div className="flex items-center gap-2 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <div className="ml-auto">
            <Button type="submit" loading={isSubmitting}>
              Add Contact
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
