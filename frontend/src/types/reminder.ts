export interface Reminder {
  id: number;
  application_id: number | null;
  reminder_date: string | null;
  message: string | null;
  completed: boolean | null;
  created_at: string;
}

export interface ReminderWithDetails extends Reminder {
  position_title: string;
  company_name: string;
}

export interface CreateReminderDto {
  application_id: number;
  reminder_date: string;
  message: string;
}
