import { useState } from 'react';
import { ChevronRight, ChevronDown, Mail, Phone, Linkedin, Pencil, Trash2 } from 'lucide-react';
import type { Contact, UpdateContactDto } from '@/types/contact';
import { contactsApi } from '@/api/contacts';
import { Button, Input, Textarea, Modal } from '@/components/common';
import { useToast } from '@/contexts/ToastContext';
import { parseApiError } from '@/utils/errors';
import { normalizeUrl } from '@/utils/url';

interface ContactCardProps {
  contact: Contact;
  onUpdate: (updated: Contact) => void;
  onDelete: (id: number) => void;
}

export function ContactCard({ contact, onUpdate, onDelete }: ContactCardProps) {
  const { addToast } = useToast();

  // Expand / edit / delete state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(contact.name);
  const [editRole, setEditRole] = useState(contact.role || '');
  const [editEmail, setEditEmail] = useState(contact.email || '');
  const [editPhone, setEditPhone] = useState(contact.phone || '');
  const [editLinkedin, setEditLinkedin] = useState(contact.linkedin || '');
  const [editNotes, setEditNotes] = useState(contact.notes || '');

  const handleToggleExpand = () => {
    if (isEditing) return;
    setIsExpanded((prev) => !prev);
  };

  const handleStartEdit = () => {
    setEditName(contact.name);
    setEditRole(contact.role || '');
    setEditEmail(contact.email || '');
    setEditPhone(contact.phone || '');
    setEditLinkedin(contact.linkedin || '');
    setEditNotes(contact.notes || '');
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;

    setIsSaving(true);
    try {
      const data: UpdateContactDto = {
        name: editName.trim(),
        role: editRole.trim() || undefined,
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        linkedin: normalizeUrl(editLinkedin),
        notes: editNotes.trim() || undefined,
      };

      const updated = await contactsApi.update(contact.id, data);
      onUpdate(updated);
      setIsEditing(false);
      addToast('Contact updated');
    } catch (err) {
      addToast(parseApiError(err, 'Failed to update contact'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await contactsApi.delete(contact.id);
      onDelete(contact.id);
      addToast('Contact deleted');
    } catch {
      addToast('Failed to delete contact', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div className="rounded-[var(--radius-lg)] border border-transparent hover:border-border transition-colors">
      {/* Collapsed header row */}
      <div
        onClick={handleToggleExpand}
        className="flex items-center gap-3 p-2 rounded-[var(--radius-lg)] cursor-pointer hover:bg-surface-alt"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleExpand();
          }
        }}
      >
        {/* Avatar */}
        <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-medium text-sm">
            {contact.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text truncate">
            {contact.name}
          </p>
          {contact.role && (
            <p className="text-sm text-text-muted truncate">{contact.role}</p>
          )}
        </div>

        {/* Quick action icons */}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="text-text-placeholder hover:text-text-secondary flex-shrink-0"
            title={contact.phone}
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="w-4 h-4" />
          </a>
        )}
        {contact.email && (
          <a
            href={`mailto:${contact.email}`}
            className="text-text-placeholder hover:text-text-secondary flex-shrink-0"
            title={contact.email}
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="w-4 h-4" />
          </a>
        )}
        {contact.linkedin && (
          <a
            href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-placeholder hover:text-primary flex-shrink-0"
            title="LinkedIn"
            onClick={(e) => e.stopPropagation()}
          >
            <Linkedin className="w-4 h-4" />
          </a>
        )}

        {/* Expand chevron */}
        <ChevronIcon className="w-4 h-4 text-text-placeholder flex-shrink-0" />
      </div>

      {/* Expanded area */}
      {isExpanded && (
        <div className="px-2 pb-2">
          {isEditing ? (
            /* Edit form */
            <div className="space-y-3 pt-2 pl-13">
              <Input
                label="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Contact name"
                required
              />
              <Input
                label="Role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                placeholder="e.g., Recruiter"
              />
              <Input
                label="Email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <Input
                label="Phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              <Input
                label="LinkedIn"
                value={editLinkedin}
                onChange={(e) => setEditLinkedin(e.target.value)}
                placeholder="linkedin.com/in/..."
              />
              <Textarea
                label="Notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notes about this contact..."
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} loading={isSaving}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            /* Expanded view */
            <div className="pt-1 pl-13 space-y-2">
              {contact.notes && (
                <p className="text-sm text-text-muted whitespace-pre-wrap">
                  {contact.notes}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStartEdit}
                  icon={<Pencil className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-danger hover:bg-danger-light"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Contact"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong>{contact.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
