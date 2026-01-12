import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout'; 
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
  ClipboardList, 
  Gavel, 
  CalendarDays,
  Loader2,
  Check,
  ChevronsUpDown,
  Search,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Types
import { PetugasPK, UPT, Klien } from '@/types/auth';

const JENIS_LITMAS = ["Integrasi PB", "Integrasi CB", "Integrasi CMB", "Asimilasi", "Perawatan Tahanan"];
const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];

export default function OperatorRegistrasiTest() {
  const { toast } = useToast();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("klien_perkara");
  const [loading, setLoading] = useState(false);
  
  // Data Referensi
  const [listPK, setListPK] = useState<PetugasPK[]>([]);
  const [listUPT, setListUPT] = useState<UPT[]>([]);
  const [listKlien, setListKlien] = useState<Klien[]>([]);

  // State Selected Client (Global untuk semua tab)
  // Ini menyimpan ID klien yang sedang "aktif" dipilih user untuk diinputkan Penjamin/Litmas-nya
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [openClientCombo, setOpenClientCombo] = useState(false); // Untuk popover combobox

  // --- FETCH DATA AWAL ---
  const fetchReferences = async () => {
    // 1. Fetch PK
    const { data: pkData } = await supabase.from('petugas_pk').select('*');
    if (pkData) setListPK(pkData as unknown as PetugasPK[]);

    // 2. Fetch UPT
    const { data: uptData } = await supabase.from('upt').select('*');
    if (uptData) setListUPT(uptData as unknown as UPT[]);

    // 3. Fetch Data Klien (Untuk Dropdown Search)
    const { data: klienData } = await supabase
      .from('klien')
      .select('id_klien, nama_klien, nomor_register_lapas')
      .order('id_klien', { ascending: false }); // Klien terbaru di atas
    
    if (klienData) setListKlien(klienData as unknown as Klien[]);
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  // --- HELPER: SEARCHABLE CLIENT DROPDOWN COMPONENT ---
  const ClientSelector = () => {
    // Cari object klien yang sedang dipilih untuk ditampilkan labelnya
    const selectedClient = listKlien.find((k) => k.id_klien === selectedClientId);

    return (
      <div className="flex flex-col space-y-2 mb-6">
        <Label className="text-base font-semibold text-slate-700">
          Pilih Klien <span className="text-red-500">*</span>
        </Label>
        <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openClientCombo}
              className="w-full justify-between bg-white border-slate-300 hover:bg-slate-50 h-11"
            >
              {selectedClient ? (
                <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                   <span className="font-semibold text-slate-900 truncate w-full">{selectedClient.nama_klien}</span>
                   <span className="text-xs text-slate-500 truncate w-full">Reg: {selectedClient.nomor_register_lapas || '-'}</span>
                </div>
              ) : (
                <span className="text-slate-500 flex items-center gap-2">
                   <Search className="w-4 h-4" /> Cari berdasarkan nama atau no. register...
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Ketik nama klien..." />
              <CommandList>
                <CommandEmpty>Klien tidak ditemukan.</CommandEmpty>
                <CommandGroup heading="Daftar Klien (Terbaru)">
                  {listKlien.map((klien) => (
                    <CommandItem
                      key={klien.id_klien}
                      value={`${klien.nama_klien} ${klien.nomor_register_lapas}`} // String untuk pencarian
                      onSelect={() => {
                        setSelectedClientId(klien.id_klien);
                        setOpenClientCombo(false);
                        toast({ title: "Klien Dipilih", description: `Aktif: ${klien.nama_klien}` });
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedClientId === klien.id_klien ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{klien.nama_klien}</span>
                        <span className="text-xs text-muted-foreground">{klien.nomor_register_lapas}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {!selectedClientId && (
           <p className="text-xs text-amber-600 flex items-center gap-1">
             <User className="w-3 h-3" /> Silakan pilih klien terlebih dahulu untuk mengisi form ini.
           </p>
        )}
      </div>
    );
  };

  // --- HANDLER: TAB 1 (KLIEN BARU) ---
  const handleSaveKlienPerkara = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      // 1. Insert Klien
      const { data: klienData, error: klienError } = await supabase
        .from('klien')
        .insert({
            nama_klien: formData.get('nama_klien') as string,
            nomor_register_lapas: formData.get('nomor_register_lapas') as string,
            jenis_kelamin: formData.get('jenis_kelamin') as string,
            agama: formData.get('agama') as string,
            tempat_lahir: formData.get('tempat_lahir') as string,
            tanggal_lahir: formData.get('tanggal_lahir') as string,
            alamat: formData.get('alamat') as string,
        })
        .select('id_klien, nama_klien, nomor_register_lapas')
        .single();

      if (klienError) throw new Error(klienError.message);
      
      // Update State Global
      const newKlien = klienData as unknown as Klien;
      setSelectedClientId(newKlien.id_klien); // Set klien aktif
      
      // Simpan data perkara sementara (untuk dipakai di litmas jika user langsung lanjut)
      sessionStorage.setItem('temp_perkara_data', JSON.stringify(Object.fromEntries(formData)));
      
      // Refresh list klien agar klien baru muncul di dropdown
      await fetchReferences();

      toast({ 
        title: "Klien Berhasil Disimpan", 
        description: `Klien: ${newKlien.nama_klien}. Silakan lanjut ke tab Penjamin/Litmas.` 
      });
      
      setActiveTab("penjamin");

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: TAB 2 (PENJAMIN) ---
  const handleSavePenjamin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) {
      return toast({ variant: "destructive", title: "Pilih Klien", description: "Anda harus memilih klien terlebih dahulu di dropdown atas." });
    }
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from('penjamin').insert({
        id_klien: selectedClientId, // Menggunakan ID dari Dropdown
        nama_penjamin: formData.get('nama_penjamin') as string,
        hubungan_klien: formData.get('hubungan_klien') as string,
        nomor_telepon: formData.get('nomor_telepon') as string,
        pekerjaan: formData.get('pekerjaan') as string,
        usia: Number(formData.get('usia')),
        alamat: formData.get('alamat') as string,
      });

      if (error) throw error;
      
      toast({ title: "Sukses", description: "Data Penjamin berhasil disimpan untuk klien terpilih." });
      setActiveTab("litmas");

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: TAB 3 (LITMAS & PERKARA) ---
  const handleSaveLitmas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) {
      return toast({ variant: "destructive", title: "Pilih Klien", description: "Anda harus memilih klien terlebih dahulu di dropdown atas." });
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Cek apakah ada data perkara "sisa" dari tab 1 (opsional, hanya jika baru create)
    // Jika tidak ada, user hanya input litmas saja.
    const tempDataPerkara = JSON.parse(sessionStorage.getItem('temp_perkara_data') || '{}');
    
    try {
      // 1. Insert Litmas
      const { data: litmasData, error: litmasError } = await supabase.from('litmas').insert({
        id_klien: selectedClientId, // Menggunakan ID dari Dropdown
        id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null,
        jenis_litmas: formData.get('jenis_litmas') as string,
        nomor_surat_permintaan: formData.get('nomor_surat_permintaan') as string,
        tanggal_surat_permintaan: formData.get('tanggal_surat_permintaan') as string,
        tanggal_diterima_bapas: formData.get('tanggal_diterima_bapas') as string,
        nomor_surat_masuk: formData.get('nomor_surat_masuk') as string,
        nama_pk: formData.get('nama_pk') as string,
      }).select('id_litmas').single();

      if (litmasError) throw new Error(litmasError.message);

      // 2. Insert Perkara (Hanya jika ada data perkara tersimpan dari Tab 1)
      // Logikanya: Jika ini flow "Create New", data perkara ada di session.
      // Jika ini flow "Existing Client", mungkin user perlu form input perkara terpisah di sini (untuk simplifikasi, kita pakai session dulu).
      if (tempDataPerkara.pasal || tempDataPerkara.nomor_putusan) {
        const { error: perkaraError } = await supabase.from('perkara').insert({
          id_litmas: litmasData.id_litmas,
          pasal: tempDataPerkara.pasal,
          tindak_pidana: tempDataPerkara.tindak_pidana,
          nomor_putusan: tempDataPerkara.nomor_putusan,
          vonis_pidana: tempDataPerkara.vonis_pidana,
          denda: tempDataPerkara.denda ? Number(tempDataPerkara.denda) : 0,
          tanggal_mulai_ditahan: tempDataPerkara.tanggal_mulai_ditahan,
          tanggal_ekspirasi: tempDataPerkara.tanggal_ekspirasi,
        });
        if (perkaraError) throw new Error(perkaraError.message);
      }

      toast({ title: "Selesai", description: "Registrasi Litmas berhasil." });
      
      // Bersihkan state
      sessionStorage.removeItem('temp_perkara_data');
      setSelectedClientId(null); // Reset pilihan klien
      setActiveTab("klien_perkara"); // Kembali ke awal

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <TestPageLayout
      title="Operator Registrasi"
      description="Pusat input data registrasi Klien, Penjamin, dan Permintaan Litmas."
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-6 h-6" />}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-slate-100/80 rounded-xl">
          <TabsTrigger value="klien_perkara" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">1. Input Klien Baru</TabsTrigger>
          <TabsTrigger value="penjamin" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">2. Input Penjamin</TabsTrigger>
          <TabsTrigger value="litmas" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">3. Registrasi Litmas</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: KLIEN BARU --- */}
        <TabsContent value="klien_perkara">
          <Card className="border-t-4 border-t-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle>Identitas Klien & Perkara (Baru)</CardTitle>
              <CardDescription>Gunakan form ini untuk mendaftarkan WBP yang belum ada di sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveKlienPerkara} className="space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="grid gap-2"><Label>Nama Lengkap</Label><Input name="nama_klien" required placeholder="Nama Klien" /></div>
                      <div className="grid gap-2"><Label>No. Register Lapas</Label><Input name="nomor_register_lapas" required placeholder="Contoh: BI.123/..." /></div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2"><Label>Jenis Kelamin</Label><Select name="jenis_kelamin" required><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent></Select></div>
                         <div className="grid gap-2"><Label>Agama</Label><Select name="agama"><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent>{AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" /></div>
                        <div className="grid gap-2"><Label>Tanggal Lahir</Label><Input name="tanggal_lahir" type="date" required /></div>
                       </div>
                       <div className="grid gap-2"><Label>Alamat Lengkap</Label><Textarea name="alamat" placeholder="Jalan, RT/RW, Kelurahan..." className="h-[88px]" /></div>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2"><Gavel className="w-5 h-5" />Data Perkara</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="grid gap-2"><Label>Pasal</Label><Input name="pasal" placeholder="363 KUHP" /></div>
                    <div className="grid gap-2"><Label>Tindak Pidana</Label><Input name="tindak_pidana" placeholder="Pencurian" /></div>
                    <div className="grid gap-2"><Label>No. Putusan</Label><Input name="nomor_putusan" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
                    <div className="grid gap-2"><Label>Vonis</Label><Input name="vonis_pidana" placeholder="1 Tahun" /></div>
                    <div className="grid gap-2"><Label>Denda (Rp)</Label><Input name="denda" type="number" /></div>
                    <div className="grid gap-2"><Label>Subsider</Label><Input name="subsider_pidana" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Mulai Ditahan</Label><Input name="tanggal_mulai_ditahan" type="date" /></div>
                    <div className="grid gap-2"><Label className="text-red-600">Ekspirasi</Label><Input name="tanggal_ekspirasi" type="date" className="bg-red-50 border-red-200" /></div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" size="lg" className="w-full md:w-auto" disabled={loading}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Klien Baru</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 2: PENJAMIN --- */}
        <TabsContent value="penjamin">
          <Card className="border-t-4 border-t-green-600 shadow-sm">
            <CardHeader>
              <CardTitle>Data Penjamin</CardTitle>
              <CardDescription>Pilih klien terlebih dahulu, lalu input data penjaminnya.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSavePenjamin} className="space-y-6 max-w-3xl mx-auto">
                
                {/* --- CLIENT SELECTOR --- */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <ClientSelector />
                </div>

                <div className={cn("space-y-6 transition-opacity duration-300", !selectedClientId && "opacity-50 pointer-events-none")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2 col-span-2"><Label>Nama Penjamin</Label><Input name="nama_penjamin" required placeholder="Sesuai KTP" /></div>
                    <div className="grid gap-2"><Label>Hubungan</Label><Select name="hubungan_klien" required><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent><SelectItem value="orang_tua">Orang Tua</SelectItem><SelectItem value="istri_suami">Istri / Suami</SelectItem><SelectItem value="kakak_adik">Kakak / Adik</SelectItem><SelectItem value="lainnya">Lainnya</SelectItem></SelectContent></Select></div>
                    <div className="grid gap-2"><Label>No. Telepon</Label><Input name="nomor_telepon" type="tel" /></div>
                    <div className="grid gap-2"><Label>Pekerjaan</Label><Input name="pekerjaan" /></div>
                    <div className="grid gap-2"><Label>Umur</Label><Input name="usia" type="number" className="w-24" /></div>
                    <div className="grid gap-2 col-span-2"><Label>Alamat</Label><Textarea name="alamat" /></div>
                  </div>
                  <div className="flex justify-end pt-4"><Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading || !selectedClientId}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Penjamin</Button></div>
                </div>

              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB 3: LITMAS --- */}
        <TabsContent value="litmas">
          <Card className="border-t-4 border-t-blue-600 shadow-sm">
            <CardHeader>
              <CardTitle>Registrasi Litmas</CardTitle>
              <CardDescription>Pilih klien, lalu input detail permintaan litmas dan tunjuk PK.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveLitmas} className="space-y-6 max-w-3xl mx-auto">
                
                {/* --- CLIENT SELECTOR --- */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <ClientSelector />
                </div>

                <div className={cn("space-y-6 transition-opacity duration-300", !selectedClientId && "opacity-50 pointer-events-none")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2"><Label>Asal UPT</Label><Select name="id_upt"><SelectTrigger><SelectValue placeholder="Pilih UPT..." /></SelectTrigger><SelectContent>{listUPT.map((upt) => (<SelectItem key={upt.id_upt} value={String(upt.id_upt)}>{upt.nama_upt}</SelectItem>))}</SelectContent></Select></div>
                    <div className="grid gap-2"><Label>Jenis Litmas</Label><Select name="jenis_litmas" required><SelectTrigger><SelectValue placeholder="Pilih Jenis..." /></SelectTrigger><SelectContent>{JENIS_LITMAS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-2"><Label>No. Surat Permintaan</Label><Input name="nomor_surat_permintaan" required /></div>
                    <div className="grid gap-2"><Label>Tgl Surat</Label><Input name="tanggal_surat_permintaan" type="date" required /></div>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-6">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2"><CalendarDays className="w-5 h-5" />Administrasi Bapas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2"><Label>Tgl Diterima</Label><Input name="tanggal_diterima_bapas" type="date" required /></div>
                        <div className="grid gap-2"><Label>No. Agenda Masuk</Label><Input name="nomor_surat_masuk" /></div>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-blue-900 font-bold">Tunjuk PK</Label>
                        <Select name="nama_pk">
                          <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih PK..." /></SelectTrigger>
                          <SelectContent>{listPK.map((pk) => (<SelectItem key={pk.id} value={pk.id}>{pk.nama} (NIP: {pk.nip})</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4"><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || !selectedClientId}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Litmas</Button></div>
                </div>

              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TestPageLayout>
  );
}
