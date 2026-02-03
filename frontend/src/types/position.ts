export interface Position {
  id: number;
  company_id: number | null;
  title: string;
  salary_min: number | null;
  salary_max: number | null;
  requirements: string | null;
  job_url: string | null;
  created_at: string;
}

export interface PositionWithCompany extends Position {
  company_name: string;
}

export interface CreatePositionDto {
  company_id: number;
  title: string;
  salary_min?: number;
  salary_max?: number;
  requirements?: string;
  job_url?: string;
}

export interface UpdatePositionDto {
  company_id?: number;
  title?: string;
  salary_min?: number;
  salary_max?: number;
  requirements?: string;
  job_url?: string;
}
