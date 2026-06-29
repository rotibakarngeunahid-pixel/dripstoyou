import { Hammer } from 'lucide-react';

export default function CRMPlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="crm-page mx-auto max-w-xl">
      <div className="crm-page-header">
        <div>
          <h2 className="crm-page-title">{title}</h2>
          {description && <p className="crm-page-subtitle">{description}</p>}
        </div>
      </div>
      <div className="crm-empty-state flex flex-col items-center gap-4">
        <span className="crm-empty-icon">
          <Hammer size={26} aria-hidden />
        </span>
        <div>
          <p className="font-medium text-[#174846]">Modul sedang disiapkan</p>
          <p className="mt-1 text-sm text-[#60727a]">
            Fitur ini akan aktif pada tahap pembangunan berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
