import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Gavel, 
  FileText, 
  Save, 
  Users,
  CalendarDays,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Tipe data sederhana untuk state dropdown
type PetugasPK = { id: string; nama: string; nip: string };
type UPT = { id_upt: number; nama_upt: string };

const JENIS_LITMAS = [
  "Integrasi PB", "Integrasi CB", "Integrasi CMB", "Asimilasi", "Perawatan Tahanan"
];

const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];

export default function OperatorRegistrasiTest() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("klien_perkara");
  const [loading, setLoading] = useState(false);
  
  // State untuk Data Referensi (Dropdown)
  const [listPK, setListPK] = useState<PetugasPK[]>([]);
  const [listUPT, setListUPT] = useState<UPT[]>([]);

  // State Kunci: ID Klien yang baru disimpan
  // Ini digunakan untuk menghubungkan form Penjamin & Litmas ke Klien yang benar
  const [currentKlienId, setCurrentKlienId] = useState<number | null>(null);

  // --- 1. FETCH REFERENCE DATA ON MOUNT ---
  useEffect(() => {
    const fetchData = async () => {
      // Ambil data PK
      const { data: pkData } = await supabase.from('petugas_pk').select('id, nama, nip');
      if (pkData) setListPK(pkData);

      // Ambil data UPT (Asumsi tabel upt ada, jika belum ada bisa hardcode/skip)
      const { data: uptData } = await supabase.from('upt').select('id_upt, nama_upt');
      if (uptData) setListUPT(uptData);
    };
    fetchData();
  }, []);

  // --- HANDLER: SIMPAN DATA KLIEN & PERKARA ---
  const handleSaveKlienPerkara = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      // 1. Insert ke Tabel Klien
      const { data: klienData, error: klienError } = await supabase
        .from('klien')
        .insert({
            nama_klien: formData.get('nama_klien'),
            nomor_register_lapas: formData.get('nomor_register_lapas'),
            jenis_kelamin: formData.get('jenis_kelamin'),
            agama: formData.get('agama'),
            tempat_lahir: formData.get('tempat_lahir'),
            tanggal_lahir: formData.get('tanggal_lahir'), // Pastikan format YYYY-MM-DD dari input type="date"
            alamat: formData.get('alamat'),
            // Tambahkan field lain sesuai kolom database Anda
        })
        .select('id_klien') // Minta return ID
        .single();

      if (klienError) throw new Error(`Gagal simpan Klien: ${klienError.message}`);
      
      const newKlienId = klienData.id_klien;
      setCurrentKlienId(newKlienId); // Simpan ID di state untuk tab selanjutnya

      // 2. Insert ke Tabel Perkara (jika Litmas belum ada, kita buat Dummy/Null dulu atau relasikan nanti)
      // Catatan: Di SQL Anda, Perkara butuh id_litmas. Namun di alur ini, Klien didaftarkan dulu sebelum Litmas.
      // Skenario A: Jika Perkara wajib nempel ke Litmas, maka data perkara ini disimpan di state dulu atau insert litmas dummy.
      // Skenario B (Modifikasi): Kita asumsikan Perkara bisa berdiri sendiri atau kita buat Litmas Draft.
      // Untuk solusi ini, kita simpan data perkara di "LocalStorage/State" atau kita asumsikan User akan mengisi Litmas segera.
      
      // SEMENTARA: Kita simpan data perkara ke LocalStorage agar bisa di-submit bersamaan dengan Litmas, 
      // KARENA di SQL Anda: "perkara" references "litmas". Jadi Litmas harus dibuat dulu.
      // TAPI User Interface meminta Klien & Perkara di Tab 1.
      
      // SOLUSI PRAKTIS: Tab 1 hanya simpan KLIEN. Data Perkara kita simpan di state sementara untuk di-push saat Tab 3 (Litmas) dibuat.
      // Atau kita ubah flow: Tab 1 -> Simpan Klien. Tab 3 (Litmas) -> Simpan Litmas -> Baru Simpan Perkara.
      
      // Agar UI tidak berubah, saya akan simpan data perkara ke State sementara:
      sessionStorage.setItem('temp_perkara_data', JSON.stringify(Object.fromEntries(formData)));

      toast({
        title: "Data Klien Tersimpan",
        description: "Silakan lanjut ke tab Penjamin atau Litmas. ID Klien: " + newKlienId,
      });

      // Pindah otomatis ke tab selanjutnya
      setActiveTab("penjamin");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: SIMPAN PENJAMIN ---
  const handleSavePenjamin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentKlienId) {
      toast({ variant: "destructive", title: "Belum ada Klien", description: "Simpan data Klien terlebih dahulu di Tab 1." });
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase.from('penjamin').insert({
        id_klien: currentKlienId, // Foreign Key
        nama_penjamin: formData.get('nama_penjamin'),
        hubungan_klien: formData.get('hubungan_klien'),
        nomor_telepon: formData.get('nomor_telepon'),
        pekerjaan: formData.get('pekerjaan'),
        usia: Number(formData.get('usia')),
        alamat: formData.get('alamat'),
      });

      if (error) throw error;

      toast({ title: "Berhasil", description: "Data Penjamin berhasil disimpan." });
      setActiveTab("litmas");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: SIMPAN LITMAS (DAN PERKARA) ---
  const handleSaveLitmas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentKlienId) {
      toast({ variant: "destructive", title: "Belum ada Klien", description: "Simpan data Klien terlebih dahulu." });
      return;
    }
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const tempDataPerkara = JSON.parse(sessionStorage.getItem('temp_perkara_data') || '{}');

    try {
      // 1. Insert Litmas
      const { data: litmasData, error: litmasError } = await supabase.from('litmas').insert({
        id_klien: currentKlienId,
        id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null,
        jenis_litmas: formData.get('jenis_litmas'),
        nomor_surat_permintaan: formData.get('nomor_surat_permintaan'),
        tanggal_surat_permintaan: formData.get('tanggal_surat_permintaan'),
        tanggal_diterima_bapas: formData.get('tanggal_diterima_bapas'),
        nomor_surat_masuk: formData.get('nomor_surat_masuk'), // No Agenda
        nama_pk: formData.get('nama_pk'), // UUID PK
      }).select('id_litmas').single();

      if (litmasError) throw new Error(`Litmas Error: ${litmasError.message}`);

      const newLitmasId = litmasData.id_litmas;

      // 2. Insert Perkara (Menggunakan data dari Tab 1 yang disimpan sementara + ID Litmas baru)
      // Cek apakah ada data perkara yang diinput di Tab 1
      if (tempDataPerkara.pasal || tempDataPerkara.nomor_putusan) {
        const { error: perkaraError } = await supabase.from('perkara').insert({
          id_litmas: newLitmasId, // Relasi ke Litmas
          pasal: tempDataPerkara.pasal,
          tindak_pidana: tempDataPerkara.tindak_pidana,
          nomor_putusan: tempDataPerkara.nomor_putusan,
          vonis_pidana: tempDataPerkara.vonis_pidana,
          denda: tempDataPerkara.denda ? Number(tempDataPerkara.denda) : 0,
          tanggal_mulai_ditahan: tempDataPerkara.tanggal_mulai_ditahan,
          tanggal_ekspirasi: tempDataPerkara.tanggal_ekspirasi,
          // Tambahkan field perhitungan tanggal lain...
        });
        if (perkaraError) throw new Error(`Perkara Error: ${perkaraError.message}`);
      }

      toast({ title: "Selesai!", description: "Registrasi Litmas & Perkara berhasil." });
      
      // Reset Flow
      sessionStorage.removeItem('temp_perkara_data');
      setCurrentKlienId(null);
      setActiveTab("klien_perkara"); // Kembali ke awal untuk input baru
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENTS ---

  const FormKlienPerkara = () => (
    <form onSubmit={handleSaveKlienPerkara} className="space-y-8">
      {/* Hidden inputs untuk menyimpan state perkara jika perlu, atau gunakan input langsung */}
      
      {/* BAGIAN A: DATA PRIBADI */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">1. Data Pribadi Klien</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input name="nama_klien" required placeholder="Nama Klien" />
            </div>
            <div className="grid gap-2">
              <Label>No. Register Lapas</Label>
              <Input name="nomor_register_lapas" required placeholder="Contoh: BI.123/..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label>Jenis Kelamin</Label>
                <Select name="jenis_kelamin" required>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
               </div>
               <div className="grid gap-2">
                <Label>Agama</Label>
                <Select name="agama">
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    {AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tempat Lahir</Label>
                <Input name="tempat_lahir" />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Lahir</Label>
                <Input name="tanggal_lahir" type="date" required />
              </div>
             </div>
             <div className="grid gap-2">
              <Label>Alamat Lengkap</Label>
              <Textarea name="alamat" placeholder="Jalan, RT/RW, Kelurahan..." className="h-[88px]" />
             </div>
          </div>
        </div>
      </div>

      {/* BAGIAN B: DATA PERKARA UTAMA */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <Gavel className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-lg">2. Data Perkara Utama</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>Pasal Kejahatan</Label>
            <Input name="pasal" placeholder="Cth: 363 KUHP" />
          </div>
          <div className="grid gap-2">
            <Label>Jenis Tindak Pidana</Label>
            <Input name="tindak_pidana" placeholder="Cth: Pencurian" />
          </div>
          <div className="grid gap-2">
            <Label>Nomor Putusan</Label>
            <Input name="nomor_putusan" placeholder="Nomor Putusan Pengadilan" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
          <div className="grid gap-2">
            <Label>Vonis Pidana</Label>
            <Input name="vonis_pidana" placeholder="Cth: 1 Tahun 6 Bulan" />
          </div>
          <div className="grid gap-2">
            <Label>Denda (Rp)</Label>
            <Input name="denda" type="number" placeholder="0" />
          </div>
          <div className="grid gap-2">
            <Label>Subsider</Label>
            <Input name="subsider_pidana" placeholder="Cth: 2 Bulan" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Mulai Ditahan</Label>
            <Input name="tanggal_mulai_ditahan" type="date" />
          </div>
          <div className="grid gap-2">
            <Label className="text-red-600 font-bold">Tanggal Ekspirasi</Label>
            <Input name="tanggal_ekspirasi" type="date" className="border-red-300 bg-red-50" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button type="submit" size="lg" className="w-full md:w-auto bg-slate-900" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {loading ? 'Menyimpan...' : 'Simpan Klien & Lanjut'}
        </Button>
      </div>
    </form>
  );

  const FormPenjamin = () => (
    <form onSubmit={handleSavePenjamin} className="space-y-6 max-w-3xl mx-auto">
       {!currentKlienId && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Mohon isi dan simpan data <strong>Klien</strong> terlebih dahulu di Tab 1.</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-slate-800 border-b pb-4 mb-6">
         <Users className="w-6 h-6 text-green-600" />
         <div>
            <h3 className="font-semibold text-lg">Data Penjamin</h3>
            <p className="text-sm text-muted-foreground">Keluarga yang bertanggung jawab.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2 col-span-2">
          <Label>Nama Lengkap Penjamin</Label>
          <Input name="nama_penjamin" required placeholder="Sesuai KTP" />
        </div>

        <div className="grid gap-2">
          <Label>Hubungan</Label>
          <Select name="hubungan_klien" required>
            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="orang_tua">Orang Tua</SelectItem>
              <SelectItem value="istri_suami">Istri / Suami</SelectItem>
              <SelectItem value="kakak_adik">Kakak / Adik</SelectItem>
              <SelectItem value="lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>No. Telepon / WA</Label>
          <Input name="nomor_telepon" type="tel" placeholder="08..." />
        </div>

        <div className="grid gap-2">
          <Label>Pekerjaan</Label>
          <Input name="pekerjaan" />
        </div>

        <div className="grid gap-2">
          <Label>Umur</Label>
          <Input name="usia" type="number" className="w-24" />
        </div>

        <div className="grid gap-2 col-span-2">
          <Label>Alamat</Label>
          <Textarea name="alamat" placeholder="Alamat tinggal penjamin" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading || !currentKlienId}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Simpan Penjamin
        </Button>
      </div>
    </form>
  );

  const FormLitmas = () => (
    <form onSubmit={handleSaveLitmas} className="space-y-6 max-w-3xl mx-auto">
      {!currentKlienId && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Data Klien belum terdeteksi. Silakan kembali ke Tab 1.</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-slate-800 border-b pb-4 mb-6">
         <FileText className="w-6 h-6 text-blue-600" />
         <div>
            <h3 className="font-semibold text-lg">Registrasi Litmas</h3>
            <p className="text-sm text-muted-foreground">Detail surat permintaan & penunjukan PK.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="grid gap-2">
            <Label>Asal UPT</Label>
            <Select name="id_upt">
              <SelectTrigger><SelectValue placeholder="Pilih UPT..." /></SelectTrigger>
              <SelectContent>
                {listUPT.length > 0 ? (
                  listUPT.map((upt) => (
                    <SelectItem key={upt.id_upt} value={String(upt.id_upt)}>{upt.nama_upt}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="0" disabled>Loading data...</SelectItem>
                )}
              </SelectContent>
            </Select>
         </div>
         <div className="grid gap-2">
            <Label>Jenis Litmas</Label>
            <Select name="jenis_litmas" required>
              <SelectTrigger><SelectValue placeholder="Pilih Jenis..." /></SelectTrigger>
              <SelectContent>
                {JENIS_LITMAS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
         </div>
         
         <div className="grid gap-2">
            <Label>Nomor Surat Permintaan</Label>
            <Input name="nomor_surat_permintaan" required />
         </div>
         <div className="grid gap-2">
            <Label>Tanggal Surat</Label>
            <Input name="tanggal_surat_permintaan" type="date" required />
         </div>
      </div>

      <Separator className="my-4" />

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-6">
        <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Administrasi Bapas</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
                <Label>Tanggal Diterima Bapas</Label>
                <Input name="tanggal_diterima_bapas" type="date" required />
            </div>
            <div className="grid gap-2">
                <Label>Nomor Surat Masuk (Agenda)</Label>
                <Input name="nomor_surat_masuk" placeholder="Nomor urut buku agenda" />
            </div>
        </div>

        {/* --- DROPDOWN PK DINAMIS --- */}
        <div className="grid gap-2">
            <Label className="text-blue-900 font-bold">Tunjuk Petugas PK</Label>
            <Select name="nama_pk">
              <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Pilih PK..." />
              </SelectTrigger>
              <SelectContent>
                {listPK.map((pk) => (
                  <SelectItem key={pk.id} value={pk.id}>
                    {pk.nama} (NIP: {pk.nip})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto" disabled={loading || !currentKlienId}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Simpan Registrasi Lengkap
        </Button>
      </div>
    </form>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Operator Registrasi</h1>
        <p className="text-slate-500">Sistem terintegrasi database.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-slate-200">
          <TabsTrigger value="klien_perkara" className="py-3 data-[state=active]:bg-white">
            1. Data Klien & Hukum
          </TabsTrigger>
          <TabsTrigger value="penjamin" className="py-3 data-[state=active]:bg-white">
            2. Data Penjamin
          </TabsTrigger>
          <TabsTrigger value="litmas" className="py-3 data-[state=active]:bg-white">
            3. Registrasi Litmas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="klien_perkara">
          <Card className="border-t-4 border-t-slate-800 shadow-md">
            <CardHeader>
              <CardTitle>Identitas Klien</CardTitle>
              <CardDescription>Simpan data klien untuk mendapatkan ID registrasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormKlienPerkara />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="penjamin">
          <Card className="border-t-4 border-t-green-600 shadow-md">
            <CardContent className="pt-6">
              <FormPenjamin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="litmas">
          <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardContent className="pt-6">
              <FormLitmas />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
