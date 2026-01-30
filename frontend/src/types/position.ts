export interface Position {
    id: number;
    title: string;
    location?: string;
    type?: string;
    description?: string;
    requirements?: string;
    notes?: string;
    company_id: number;
    created_at: string;
    updated_at: string;
}

export interface CreatePositionDto {
    title: string;
    location?: string;
    type?: string;
    description?: string;
    requirements?: string;
    notes?: string;
    company_id: number;
}

export interface UpdatePositionDto {
    title?: string;
    location?: string;
    type?: string;
    description?: string;
    requirements?: string;
    notes?: string;
    company_id?: number;
}