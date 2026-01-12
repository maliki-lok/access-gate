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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { 
  ClipboardList, 
  Gavel, 
  CalendarDays,
  Loader2,
  Check,
  ChevronsUpDown,
  Search,
  User,
  UserCheck,
  List,
  RefreshCw,
  Pencil,
  XCircle,
  MapPin,
  Briefcase
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
const PENDIDIKAN_OPTIONS = ["Tidak Sekolah", "SD", "SMP", "SMA/SMK", "D3", "S1", "S2", "S3"];

export default function OperatorRegistrasiTest() {
  const { toast } = useToast();
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState("klien_perkara");
  const [loading, setLoading] = useState(false);
  
  // Data Referensi
  const [listPK, setListPK] = useState<PetugasPK[]>([]);
  const [listUPT, setListUPT] = useState<UPT[]>([]);
  const [listKlien, setListKlien] = useState<Klien[]>([]);

  // State Selected Client (Global)
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [openClientCombo, setOpenClientCombo] = useState(false);

  // State Selected PK (Litmas)
  const [selectedPkId, setSelectedPkId] = useState<string | null>(null);
  const [openPkCombo, setOpenPkCombo] = useState(false);

  // State Data List (Tab 4)
  const [dataLitmas, setDataLitmas] = useState<any[]>([]);
  const [dataKlienFull, setDataKlienFull] = useState<any[]>([]);

  // State EDIT MODE & Calculator
  const [editingKlien, setEditingKlien] = useState<Klien | null>(null);
  
  // State untuk kalkulasi umur otomatis
  const [tglLahir, setTglLahir] = useState("");
  const [hitungUsia, setHitungUsia] = useState("");
  const [hitungKategori, setHitungKategori] = useState("");

  // --- HELPER: CALCULATE AGE ---
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    setTglLahir(dateVal);
    calculateAgeAndCategory(dateVal);
  };

  const calculateAgeAndCategory = (dateString: string) => {
    if (!dateString) return;
    
    const birthDate = new Date(dateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    setHitungUsia(age.toString());
    setHitungKategori(age < 18 ? "Anak" : "Dewasa");
  };

  // Set initial state when entering edit mode
  useEffect(() => {
    if (editingKlien) {
      if (editingKlien.tanggal_lahir) {
        setTglLahir(editingKlien.tanggal_lahir);
        calculateAgeAndCategory(editingKlien.tanggal_lahir);
      }
    } else {
      // Reset form state
      setTglLahir("");
      setHitungUsia("");
      setHitungKategori("");
    }
  }, [editingKlien]);

  // --- FETCH DATA AWAL ---
  const fetchReferences = async () => {
    const { data: pkData } = await supabase.from('petugas_pk').select('*');
    if (pkData) setListPK(pkData as unknown as PetugasPK[]);

    const { data: uptData } = await supabase.from('upt').select('*');
    if (uptData) setListUPT(uptData as unknown as UPT[]);

    const { data: klienData } = await supabase
      .from('klien')
      .select('id_klien, nama_klien, nomor_register_lapas')
      .order('id_klien', { ascending: false });
    if (klienData) setListKlien(klienData as unknown as Klien[]);
  };

  const fetchTableData = async () => {
    setLoading(true);
    try {
      const { data: kData, error: kError } = await supabase
        .from('klien')
        .select('*')
        .order('id_klien', { ascending: false })
        .limit(20);
      if (kError) throw kError;
      setDataKlienFull(kData || []);

      const { data: lData, error: lError } = await supabase
        .from('litmas')
        .select(`*, klien (nama_klien, nomor_register_lapas), petugas_pk (nama, nip)`)
        .order('id_litmas', { ascending: false })
        .limit(20);
      
      if (lError) throw lError;
      setDataLitmas(lData || []);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Gagal memuat data", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  useEffect(() => {
    if (activeTab === 'list_data') {
      fetchTableData();
    }
  }, [activeTab]);

  // --- ACTIONS ---
  const handleEditClick = (klien: Klien) => {
    setEditingKlien(klien);
    setActiveTab("klien_perkara");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: "Mode Edit", description: `Mengedit data: ${klien.nama_klien}` });
  };

  const handleCancelEdit = () => {
    setEditingKlien(null);
    toast({ title: "Edit Dibatalkan", description: "Kembali ke mode input baru." });
  };

  // --- HANDLER: TAB 1 (KLIEN - INSERT / UPDATE) ---
  const handleSaveKlienPerkara = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const payload = {
        nama_klien: formData.get('nama_klien') as string,
        nomor_register_lapas: formData.get('nomor_register_lapas') as string,
        jenis_kelamin: formData.get('jenis_kelamin') as string,
        agama: formData.get('agama') as string,
        pendidikan: formData.get('pendidikan') as string,
        
        tempat_lahir: formData.get('tempat_lahir') as string,
        tanggal_lahir: formData.get('tanggal_lahir') as string,
        usia: Number(formData.get('usia')),
        kategori_usia: formData.get('kategori_usia') as string,
        
        pekerjaan: formData.get('pekerjaan') as string,
        minat_bakat: formData.get('minat_bakat') as string,
        
        alamat: formData.get('alamat') as string,
        kelurahan: formData.get('kelurahan') as string,
        kecamatan: formData.get('kecamatan') as string,
        nomor_telepon: formData.get('nomor_telepon') as string,
      };

      if (editingKlien) {
        // --- UPDATE ---
        const { error } = await supabase
          .from('klien')
          .update(payload)
          .eq('id_klien', editingKlien.id_klien);

        if (error) throw new Error(error.message);

        toast({ title: "Berhasil Diupdate", description: "Data klien telah diperbarui." });
        setEditingKlien(null);
        fetchTableData();
        setActiveTab("list_data");

      } else {
        // --- INSERT ---
        const { data: klienData, error: klienError } = await supabase
          .from('klien')
          .insert(payload)
          .select('id_klien, nama_klien, nomor_register_lapas')
          .single();

        if (klienError) throw new Error(klienError.message);
        
        const newKlien = klienData as unknown as Klien;
        setSelectedClientId(newKlien.id_klien);
        sessionStorage.setItem('temp_perkara_data', JSON.stringify(Object.fromEntries(formData)));
        
        await fetchReferences();
        toast({ title: "Klien Disimpan", description: `ID: ${newKlien.id_klien}. Lanjut ke Penjamin.` });
        setActiveTab("penjamin");
      }

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePenjamin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from('penjamin').insert({
        id_klien: selectedClientId,
        nama_penjamin: formData.get('nama_penjamin') as string,
        hubungan_klien: formData.get('hubungan_klien') as string,
        nomor_telepon: formData.get('nomor_telepon') as string,
        pekerjaan: formData.get('pekerjaan') as string,
        usia: Number(formData.get('usia')),
        alamat: formData.get('alamat') as string,
      });

      if (error) throw error;
      toast({ title: "Sukses", description: "Data Penjamin disimpan." });
      setActiveTab("litmas");

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLitmas = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedClientId) return toast({ variant: "destructive", title: "Error", description: "Pilih Klien dulu." });

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const tempDataPerkara = JSON.parse(sessionStorage.getItem('temp_perkara_data') || '{}');
    
    try {
      const { data: litmasData, error: litmasError } = await supabase.from('litmas').insert({
        id_klien: selectedClientId,
        id_upt: formData.get('id_upt') ? Number(formData.get('id_upt')) : null,
        jenis_litmas: formData.get('jenis_litmas') as string,
        nomor_surat_permintaan: formData.get('nomor_surat_permintaan') as string,
        tanggal_surat_permintaan: formData.get('tanggal_surat_permintaan') as string,
        tanggal_diterima_bapas: formData.get('tanggal_diterima_bapas') as string,
        nomor_surat_masuk: formData.get('nomor_surat_masuk') as string,
        nama_pk: selectedPkId,
      }).select('id_litmas').single();

      if (litmasError) throw new Error(litmasError.message);

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
      sessionStorage.removeItem('temp_perkara_data');
      setSelectedClientId(null);
      setSelectedPkId(null);
      setActiveTab("list_data");

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- SUB COMPONENTS ---

  const ClientSelector = () => {
    const selectedClient = listKlien.find((k) => k.id_klien === selectedClientId);
    return (
      <div className="flex flex-col space-y-2 mb-6">
        <Label className="text-base font-semibold text-slate-700">Pilih Klien <span className="text-red-500">*</span></Label>
        <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openClientCombo} className="w-full justify-between bg-white border-slate-300 hover:bg-slate-50 h-11">
              {selectedClient ? (
                <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                   <span className="font-semibold text-slate-900 truncate w-full">{selectedClient.nama_klien}</span>
                   <span className="text-xs text-slate-500 truncate w-full">Reg: {selectedClient.nomor_register_lapas || '-'}</span>
                </div>
              ) : (
                <span className="text-slate-500 flex items-center gap-2"><Search className="w-4 h-4" /> Cari berdasarkan nama atau no. register...</span>
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
                      value={`${klien.nama_klien} ${klien.nomor_register_lapas}`}
                      onSelect={() => {
                        setSelectedClientId(klien.id_klien);
                        setOpenClientCombo(false);
                        toast({ title: "Klien Dipilih", description: `Aktif: ${klien.nama_klien}` });
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", selectedClientId === klien.id_klien ? "opacity-100" : "opacity-0")} />
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
        {!selectedClientId && <p className="text-xs text-amber-600 flex items-center gap-1"><User className="w-3 h-3" /> Silakan pilih klien terlebih dahulu.</p>}
      </div>
    );
  };

  const PKSelector = () => {
    const selectedPk = listPK.find((pk) => pk.id === selectedPkId);
    return (
      <div className="grid gap-2">
        <Label className="text-blue-900 font-bold flex items-center gap-2"><UserCheck className="w-4 h-4" /> Tunjuk PK</Label>
        <Popover open={openPkCombo} onOpenChange={setOpenPkCombo}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openPkCombo} className="w-full justify-between bg-white border-blue-200 hover:bg-blue-50 h-auto py-2 text-left">
              {selectedPk ? (
                <div className="flex flex-col items-start text-left leading-tight overflow-hidden">
                   <span className="font-semibold text-slate-900 truncate w-full">{selectedPk.nama}</span>
                   <span className="text-xs text-slate-500 truncate w-full">NIP: {selectedPk.nip}</span>
                </div>
              ) : (
                <span className="text-slate-500">Pilih Petugas PK...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari PK atau NIP..." />
              <CommandList>
                <CommandEmpty>Petugas PK tidak ditemukan.</CommandEmpty>
                <CommandGroup>
                  {listPK.map((pk) => (
                    <CommandItem key={pk.id} value={`${pk.nama} ${pk.nip}`} onSelect={() => { setSelectedPkId(pk.id); setOpenPkCombo(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", selectedPkId === pk.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col"><span className="font-medium">{pk.nama}</span><span className="text-xs text-muted-foreground">NIP: {pk.nip}</span></div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <TestPageLayout
      title="Registrasi"
      description="Pusat input data registrasi Klien, Penjamin, dan Permintaan Litmas."
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-6 h-6" />}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100/80 rounded-xl">
          <TabsTrigger value="klien_perkara" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">{editingKlien ? 'Edit Klien' : '1. Klien Baru'}</TabsTrigger>
          <TabsTrigger value="penjamin" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">2. Penjamin</TabsTrigger>
          <TabsTrigger value="litmas" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">3. Litmas</TabsTrigger>
          <TabsTrigger value="list_data" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex gap-2"><List className="w-4 h-4" /> Data Terdaftar</TabsTrigger>
        </TabsList>

        {/* --- TAB 1: KLIEN BARU / EDIT KLIEN --- */}
        <TabsContent value="klien_perkara">
           <Card className={cn("border-t-4 shadow-sm transition-all", editingKlien ? "border-t-amber-500 bg-amber-50/30" : "border-t-slate-800")}>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle>{editingKlien ? `Edit Data: ${editingKlien.nama_klien}` : 'Identitas Klien & Perkara (Baru)'}</CardTitle>
                   <CardDescription>{editingKlien ? 'Silakan ubah data yang diperlukan lalu simpan.' : 'Gunakan form ini untuk mendaftarkan WBP yang belum ada di sistem.'}</CardDescription>
                 </div>
                 {editingKlien && (
                   <Button variant="outline" size="sm" onClick={handleCancelEdit} className="border-red-200 text-red-600 hover:bg-red-50">
                     <XCircle className="w-4 h-4 mr-2" /> Batal Edit
                   </Button>
                 )}
               </div>
             </CardHeader>
             <CardContent>
               <form key={editingKlien ? `edit-${editingKlien.id_klien}` : 'create-new'} onSubmit={handleSaveKlienPerkara} className="space-y-8">
                 <div className="space-y-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <h4 className="font-semibold text-slate-700 flex items-center"><User className="w-4 h-4 mr-2" /> Data Diri Utama</h4>
                       <div className="grid gap-2"><Label>Nama Lengkap</Label><Input name="nama_klien" defaultValue={editingKlien?.nama_klien || ''} required placeholder="Nama Klien" /></div>
                       <div className="grid gap-2"><Label>No. Register Lapas</Label><Input name="nomor_register_lapas" defaultValue={editingKlien?.nomor_register_lapas || ''} required placeholder="Contoh: BI.123/..." /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Jenis Kelamin</Label>
                            <Select name="jenis_kelamin" required defaultValue={editingKlien?.jenis_kelamin || undefined}>
                              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                              <SelectContent><SelectItem value="L">Laki-laki</SelectItem><SelectItem value="P">Perempuan</SelectItem></SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Agama</Label>
                            <Select name="agama" defaultValue={editingKlien?.agama || undefined}>
                              <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                              <SelectContent>{AGAMA_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                       </div>
                       <div className="grid gap-2">
                          <Label>Pendidikan Terakhir</Label>
                          <Select name="pendidikan" defaultValue={editingKlien?.pendidikan || undefined}>
                            <SelectTrigger><SelectValue placeholder="Pilih Pendidikan..." /></SelectTrigger>
                            <SelectContent>{PENDIDIKAN_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                          </Select>
                       </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700 flex items-center"><CalendarDays className="w-4 h-4 mr-2" /> Kelahiran & Usia</h4>
                        <div className="grid grid-cols-2 gap-4">
                         <div className="grid gap-2"><Label>Tempat Lahir</Label><Input name="tempat_lahir" defaultValue={editingKlien?.tempat_lahir || ''} /></div>
                         <div className="grid gap-2">
                            <Label>Tanggal Lahir</Label>
                            <Input name="tanggal_lahir" type="date" value={tglLahir} onChange={handleDateChange} required />
                         </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md">
                           <div className="grid gap-1">
                              <Label className="text-xs text-slate-500">Usia (Otomatis)</Label>
                              <Input name="usia" value={hitungUsia} readOnly className="bg-white" />
                           </div>
                           <div className="grid gap-1">
                              <Label className="text-xs text-slate-500">Kategori (Otomatis)</Label>
                              <Input name="kategori_usia" value={hitungKategori} readOnly className="bg-white" />
                           </div>
                        </div>
                        
                        <div className="grid gap-2">
                           <Label>Pekerjaan</Label>
                           <Input name="pekerjaan" defaultValue={editingKlien?.pekerjaan || ''} placeholder="Pekerjaan sebelumnya..." />
                        </div>
                        <div className="grid gap-2">
                           <Label>Minat / Bakat</Label>
                           <Input name="minat_bakat" defaultValue={editingKlien?.minat_bakat || ''} placeholder="Contoh: Musik, Pertanian, dll" />
                        </div>
                     </div>
                   </div>

                   <Separator />
                   
                   <div className="space-y-4">
                     <h4 className="font-semibold text-slate-700 flex items-center"><MapPin className="w-4 h-4 mr-2" /> Alamat & Kontak</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2"><Label>Alamat Lengkap (Jalan/RT/RW)</Label><Textarea name="alamat" defaultValue={editingKlien?.alamat || ''} className="h-24" /></div>
                        <div className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2"><Label>Kelurahan</Label><Input name="kelurahan" defaultValue={editingKlien?.kelurahan || ''} /></div>
                              <div className="grid gap-2"><Label>Kecamatan</Label><Input name="kecamatan" defaultValue={editingKlien?.kecamatan || ''} /></div>
                           </div>
                           <div className="grid gap-2"><Label>Nomor Telepon / WA</Label><Input name="nomor_telepon" defaultValue={editingKlien?.nomor_telepon || ''} placeholder="08..." /></div>
                        </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Bagian Perkara disembunyikan saat Edit */}
                 {!editingKlien && (
                   <>
                     <Separator />
                     <div className="space-y-4">
                       <h3 className="font-semibold text-lg text-red-700 flex items-center gap-2"><Gavel className="w-5 h-5" />Data Perkara (Awal)</h3>
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
                   </>
                 )}

                 <div className="flex justify-end pt-4 gap-2">
                   {editingKlien && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Batal</Button>}
                   <Button type="submit" size="lg" className={cn("w-full md:w-auto", editingKlien ? "bg-amber-600 hover:bg-amber-700" : "")} disabled={loading}>
                     {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 
                     {editingKlien ? "Simpan Perubahan" : "Simpan Klien Baru"}
                   </Button>
                 </div>
               </form>
             </CardContent>
           </Card>
        </TabsContent>

        {/* Tab 2, 3, dan 4 tidak berubah signifikan secara logika, tetap dirender */}
        <TabsContent value="penjamin">
          <Card className="border-t-4 border-t-green-600 shadow-sm">
             <CardHeader>
               <CardTitle>Data Penjamin</CardTitle>
               <CardDescription>Pilih klien terlebih dahulu, lalu input data penjaminnya.</CardDescription>
             </CardHeader>
             <CardContent className="pt-6">
               <form onSubmit={handleSavePenjamin} className="space-y-6 max-w-3xl mx-auto">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector /></div>
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

        <TabsContent value="litmas">
          <Card className="border-t-4 border-t-blue-600 shadow-sm">
             <CardHeader>
               <CardTitle>Registrasi Litmas</CardTitle>
               <CardDescription>Pilih klien, lalu input detail permintaan litmas dan tunjuk PK.</CardDescription>
             </CardHeader>
             <CardContent className="pt-6">
               <form onSubmit={handleSaveLitmas} className="space-y-6 max-w-3xl mx-auto">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><ClientSelector /></div>
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
                     <PKSelector />
                   </div>
                   <div className="flex justify-end pt-4"><Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || !selectedClientId}>{loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan Litmas</Button></div>
                 </div>
               </form>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="list_data">
          <div className="space-y-6">
             <Card className="border-t-4 border-t-purple-600 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <div>
                      <CardTitle>Daftar Klien Terdaftar</CardTitle>
                      <CardDescription>20 data klien terbaru.</CardDescription>
                   </div>
                   <Button variant="ghost" size="sm" onClick={fetchTableData}><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /></Button>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                         <TableRow>
                            <TableHead>Nama Klien</TableHead>
                            <TableHead>No. Register</TableHead>
                            <TableHead>Jenis Kelamin</TableHead>
                            <TableHead>Usia</TableHead>
                            <TableHead>Aksi</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {dataKlienFull.length > 0 ? (
                            dataKlienFull.map((k) => (
                               <TableRow key={k.id_klien}>
                                  <TableCell className="font-medium">{k.nama_klien}</TableCell>
                                  <TableCell>{k.nomor_register_lapas}</TableCell>
                                  <TableCell>{k.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                                  <TableCell>{k.usia ? `${k.usia} Tahun` : '-'}</TableCell>
                                  <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => handleEditClick(k)} className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                    </Button>
                                  </TableCell>
                               </TableRow>
                            ))
                         ) : (
                            <TableRow><TableCell colSpan={5} className="text-center py-4 text-slate-500">Belum ada data klien.</TableCell></TableRow>
                         )}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>

             <Card className="border-t-4 border-t-orange-600 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                   <div>
                      <CardTitle>Daftar Permintaan Litmas</CardTitle>
                      <CardDescription>Status registrasi litmas dan penunjukan PK.</CardDescription>
                   </div>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                         <TableRow>
                            <TableHead>No. Surat</TableHead>
                            <TableHead>Jenis Litmas</TableHead>
                            <TableHead>Nama Klien</TableHead>
                            <TableHead>Tgl Terima</TableHead>
                            <TableHead>Petugas PK</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {dataLitmas.length > 0 ? (
                            dataLitmas.map((l) => (
                               <TableRow key={l.id_litmas}>
                                  <TableCell className="font-medium">{l.nomor_surat_permintaan}</TableCell>
                                  <TableCell><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{l.jenis_litmas}</span></TableCell>
                                  <TableCell>{l.klien?.nama_klien || 'Tanpa Nama'}</TableCell>
                                  <TableCell>{l.tanggal_diterima_bapas}</TableCell>
                                  <TableCell>
                                     {l.petugas_pk ? (
                                        <div className="flex flex-col"><span className="text-sm font-medium">{l.petugas_pk.nama}</span><span className="text-xs text-slate-500">{l.petugas_pk.nip}</span></div>
                                     ) : (
                                        <span className="text-red-500 text-xs italic">Belum ditunjuk</span>
                                     )}
                                  </TableCell>
                               </TableRow>
                            ))
                         ) : (
                            <TableRow><TableCell colSpan={5} className="text-center py-4 text-slate-500">Belum ada data litmas.</TableCell></TableRow>
                         )}
                      </TableBody>
                   </Table>
                </CardContent>
             </Card>
          </div>
        </TabsContent>
      </Tabs>
    </TestPageLayout>
  );
}
