import { Hammer } from 'lucide-react';

export default function CRMPlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-2xl text-[#205251]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[#4d6060]">{description}</p>}
      </div>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#8EBFBF] bg-white px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D6EAEA] text-[#205251]">
          <Hammer size={26} aria-hidden />
        </span>
        <div>
          <p className="font-medium text-[#205251]">Modul sedang disiapkan</p>
          <p className="mt-1 text-sm text-[#4d6060]">
            Fitur ini akan aktif pada tahap pembangunan berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
