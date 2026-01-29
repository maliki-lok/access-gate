import { useState } from "react";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SuratTugasGeneratorProps {
  litmasId: number;
  onSuccess?: () => void;
}

export const SuratTugasGenerator = ({ litmasId, onSuccess }: SuratTugasGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateDocument = async () => {
    setLoading(true);
    try {
      // 1. Ambil Data (Query AMAN: Hanya ambil nama & nip yang pasti ada)
      const { data, error } = await supabase
        .from("litmas")
        .select(`
          *,
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas),
          petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip)
        `)
        .eq("id_litmas", litmasId)
        .single();

      if (error) {
        console.error("Supabase Query Error:", error);
        throw new Error(error.message);
      }
      
      if (!data) throw new Error("Data litmas tidak ditemukan");
      
      const litmas = data as any;
      const pk = litmas.petugas_pk;
      const klien = litmas.klien;

      // 2. Load Template
      const response = await fetch("/templates/surat_tugas_template.docx");
      if (!response.ok) throw new Error("Template tidak ditemukan di folder public/templates/");
      
      const content = await response.arrayBuffer();
      const zip = new PizZip(content);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

      // 3. Mapping Data (Gunakan Default untuk Jabatan/Pangkat)
      doc.render({
        nomor_surat: `WP.10.PAS.PAS.8.PK.06.01-${litmas.id_litmas}`,
        nomor_surat_lapas: litmas.nomor_surat_permintaan || "-",
        tgl_surat_lapas: litmas.tanggal_surat_permintaan ? new Date(litmas.tanggal_surat_permintaan).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-",
        
        nama_klien: klien?.nama_klien || "Tanpa Nama",
        no_reg: klien?.nomor_register_lapas || "-",
        
        // Data Petugas
        nama_pk: pk?.nama || "...",
        nip_pk: pk?.nip || "...",
        
        // HARDCODE DEFAULT (Agar tidak error karena kolom DB belum ada)
        jabatan_pk: "Pembimbing Kemasyarakatan", 
        pangkat_pk: "-", 
        
        nama_penjamin: litmas.nama_penjamin || "Keluarga Klien", 
        alamat_penjamin: litmas.alamat_penjamin || "Sesuai Data Klien",
        
        tanggal_ini: new Date().toLocaleDateString("id-ID", { dateStyle: "long" }),
        kepala_bapas: "Sri Susilarti", 
      });

      // 4. Download
      const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `Surat_Tugas_${klien?.nama_klien || 'Litmas'}.docx`);
      toast({ title: "Berhasil", description: "Surat Tugas berhasil diunduh" });
      
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error("Generate Error:", error);
      toast({ variant: "destructive", title: "Gagal Generate", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={generateDocument} disabled={loading} variant="outline" size="sm" className="w-full h-9 text-xs gap-2 font-medium shadow-sm">
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
      Download Surat
    </Button>
  );
};