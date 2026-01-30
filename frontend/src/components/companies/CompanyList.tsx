import type { Company } from "@/types/company";

interface CompanyListProps {
    companies: Company[];
    onSelect: (company: Company) => void;
}

export function CompanyList({ companies, onSelect }: CompanyListProps) {
    return (
        <ul>
            {companies.map((company) => (
                <li key={company.id} onClick={() => onSelect(company)}>
                    {company.name}
                </li>
            ))}
        </ul>
    );
}