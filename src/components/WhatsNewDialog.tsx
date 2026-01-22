import { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, ClipboardList, LogOut, Sparkles, UserCheck } from 'lucide-react';

// Kunci unik untuk versi ini.
// Ubah string ini (misal ke 'v1.1') jika Anda ingin memunculkan popup lagi di update berikutnya.
const VERSION_KEY = "monalisa_whats_new_v1.0"; 

export function WhatsNewDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Cek apakah user sudah pernah melihat pesan versi ini di browser ini
    const hasSeen = localStorage.getItem(VERSION_KEY);
    
    // 2. Jika BELUM pernah melihat (!hasSeen), baru tampilkan popup
    if (!hasSeen) {
        // Beri delay sedikit agar animasi loading halaman selesai dulu
        const timer = setTimeout(() => setIsOpen(true), 1000);
        return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // 3. Simpan tanda bahwa user sudah membaca pesan ini
    // Sehingga saat refresh atau klik dashboard lagi, popup tidak muncul
    localStorage.setItem(VERSION_KEY, "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
             <div className="p-2 bg-primary/10 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
             </div>
             <DialogTitle className="text-xl">Apa yang Baru?</DialogTitle>
          </div>
          <DialogDescription>
            Selamat datang kembali! Berikut adalah fitur terbaru sistem MONALISA Versi 1.0.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            
            {/* Fitur 1: Operator */}
            <div className="flex gap-4">
               <div className="mt-1 bg-green-100 p-2 rounded-full h-fit">
                 <ClipboardList className="w-5 h-5 text-green-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                    Registrasi Terintegrasi
                    <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">Mayor</Badge>
                 </h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Operator kini dapat menginput data Klien, Penjamin, dan Litmas dalam satu halaman terpadu. Dilengkapi fitur <strong>Edit Data</strong>, auto-hitung usia, dan pemisahan akses otomatis (Anak/Dewasa).
                 </p>
               </div>
            </div>

            {/* Fitur 2: Integrasi PK (BARU DITAMBAHKAN) */}
            <div className="flex gap-4">
               <div className="mt-1 bg-blue-100 p-2 rounded-full h-fit">
                 <UserCheck className="w-5 h-5 text-blue-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900">Sinkronisasi Otomatis PK</h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Berkas Litmas yang sudah diinput di registrasi akan <strong>secara otomatis muncul</strong> di dashboard tugas Pembimbing Kemasyarakatan (PK) terkait.
                 </p>
               </div>
            </div>

            {/* Fitur 3: Kasie */}
            <div className="flex gap-4">
               <div className="mt-1 bg-indigo-100 p-2 rounded-full h-fit">
                 <Shield className="w-5 h-5 text-indigo-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900">Dashboard Supervisi Kasie</h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Kepala Seksi kini memiliki akses penuh untuk memantau seluruh berkas Litmas di seksinya tanpa batasan PK.
                 </p>
               </div>
            </div>

            {/* Fitur 4: UX/Security */}
            <div className="flex gap-4">
               <div className="mt-1 bg-red-100 p-2 rounded-full h-fit">
                 <LogOut className="w-5 h-5 text-red-600" />
               </div>
               <div className="space-y-1">
                 <h4 className="font-semibold text-slate-900">Keamanan & Logout</h4>
                 <p className="text-sm text-slate-500 text-justify">
                    Penambahan konfirmasi keamanan saat akan keluar aplikasi (Logout) untuk mencegah penutupan sesi yang tidak disengaja.
                 </p>
               </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Saya Mengerti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}