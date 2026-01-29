import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper Function: Format Tanggal Indonesia (dd/mm/yyyy)
const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  // 'id-ID' memaksa format Indonesia (dd/mm/yyyy)
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit', // Gunakan 'long' jika ingin "Januari", '2-digit' jika ingin "01"
    year: 'numeric'
  });
};
