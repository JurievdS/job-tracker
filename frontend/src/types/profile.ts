/**
 * Work History Entry
 */
export interface WorkHistoryEntry {
  company: string;
  title: string;
  start: string;
  end: string | null;
  description?: string;
  highlights?: string[];
}

/**
 * Education Entry
 */
export interface EducationEntry {
  institution: string;
  degree: string;
  field?: string;
  start: string;
  end: string | null;
  grade?: string;
}

/**
 * Language Entry
 */
export interface LanguageEntry {
  language: string;
  proficiency: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

/**
 * User Profile
 */
export interface UserProfile {
  id: number;
  user_id: number;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  nationality: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  summary: string | null;
  work_history: WorkHistoryEntry[] | null;
  education: EducationEntry[] | null;
  skills: Record<string, string[]> | null;
  languages: LanguageEntry[] | null;
  base_currency: string | null;
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  updated_at: string | null;
}

/**
 * Update Profile DTO
 */
export interface UpdateProfileDto {
  full_name?: string;
  phone?: string;
  location?: string;
  nationality?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  summary?: string;
  work_history?: WorkHistoryEntry[];
  education?: EducationEntry[];
  skills?: Record<string, string[]>;
  languages?: LanguageEntry[];
  base_currency?: string;
  salary_expectation_min?: number;
  salary_expectation_max?: number;
}
