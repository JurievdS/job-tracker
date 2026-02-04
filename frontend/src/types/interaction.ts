export type InteractionType = 'email' | 'phone_call' | 'in_person' | 'video_call' | 'other';

export interface Interaction {
  id: number;
  application_id: number | null;
  contact_id: number | null;
  interaction_type: string;
  interaction_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface InteractionWithDetails extends Interaction {
  contact_name: string | null;
  position_title: string;
  company_name: string;
}

export interface CreateInteractionDto {
  application_id: number;
  interaction_type: InteractionType;
  interaction_date: string;
  contact_id?: number;
  notes?: string;
}

export interface UpdateInteractionDto {
  application_id?: number;
  interaction_type?: InteractionType;
  interaction_date?: string;
  contact_id?: number;
  notes?: string;
}

export const INTERACTION_TYPES: { value: InteractionType; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'in_person', label: 'In Person' },
  { value: 'video_call', label: 'Video Call' },
  { value: 'other', label: 'Other' },
];
