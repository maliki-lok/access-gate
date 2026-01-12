import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Gavel, 
  FileText, 
  Save, 
  Users,
  CalendarDays,
  AlertCircle
} from 'lucide-react';

// --- MOCK DATA (Simulasi Database) ---
const PK_OPTIONS = [
  { id: 'uuid-1', nama: 'Budi Santoso', nip: '198501012010011001' },
  { id: 'uuid-2', nama: 'Siti Aminah', nip: '199005052015022002' },
  { id: 'uuid-3', nama: 'Rahmat Hidayat', nip: '198812122012031003' },
];

const JENIS_LITMAS = [
  "Integrasi PB", "Integrasi CB", "Integrasi CMB", "Asimilasi", "Perawatan Tahanan"
];

const AGAMA_OPTIONS = ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Konghucu"];

export default function OperatorRegistrasiTest() {
  const [activeTab, setActiveTab] = useState("klien_perkara");

  // --- FORM 1: KLIEN & PERKARA (Gabungan) ---
  const FormKlienPerkara = () => (
    <div className="space-y-8">
      
      {/* BAGIAN A: DATA PRIBADI (Tabel Klien) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">1. Data Pribadi Klien</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nama Lengkap (Sesuai Putusan)</Label>
              <Input placeholder="Nama Klien" />
            </div>
            <div className="grid gap-2">
              <Label>No. Register Lapas</Label>
              <Input placeholder="Contoh: BI.123/..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                <Label>Jenis Kelamin</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
               </div>
               <div className="grid gap-2">
                <Label>Agama</Label>
                <Select>
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
                <Input />
              </div>
              <div className="grid gap-2">
                <Label>Tanggal Lahir</Label>
                <Input type="date" />
              </div>
             </div>
             <div className="grid gap-2">
              <Label>Alamat Lengkap</Label>
              <Textarea placeholder="Jalan, RT/RW, Kelurahan, Kecamatan" className="h-[88px]" />
             </div>
          </div>
        </div>
      </div>

      {/* BAGIAN B: DATA PERKARA UTAMA (Tabel Perkara) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <Gavel className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-lg">2. Data Perkara Utama</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label>Pasal Kejahatan</Label>
            <Input placeholder="Cth: 363 KUHP" />
          </div>
          <div className="grid gap-2">
            <Label>Jenis Tindak Pidana</Label>
            <Input placeholder="Cth: Pencurian" />
          </div>
          <div className="grid gap-2">
            <Label>Nomor Putusan</Label>
            <Input placeholder="Nomor Putusan Pengadilan" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
          <div className="grid gap-2">
            <Label>Vonis Pidana</Label>
            <Input placeholder="Cth: 1 Tahun 6 Bulan" />
          </div>
          <div className="grid gap-2">
            <Label>Denda (Rp)</Label>
            <Input type="number" placeholder="0" />
          </div>
           <div className="grid gap-2">
            <Label>Subsider Denda</Label>
            <Input placeholder="Cth: 2 Bulan" />
          </div>
        </div>

        {/* Tanggal Penting Perkara */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="grid gap-2">
            <Label className="text-xs">Mulai Ditahan</Label>
            <Input type="date" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">1/3 Masa Pidana</Label>
            <Input type="date" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">1/2 Masa Pidana</Label>
            <Input type="date" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">2/3 Masa Pidana</Label>
            <Input type="date" />
          </div>
        </div>
        <div className="grid gap-2">
          <Label className="text-red-600 font-bold">Tanggal Ekspirasi (Bebas Murni)</Label>
          <Input type="date" className="border-red-300 bg-red-50" />
        </div>
      </div>

      {/* BAGIAN C: PERKARA TAMBAHAN (Tabel Perkara Tambahan) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-lg">3. Perkara Tambahan (Opsional)</h3>
        </div>
        <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 border-dashed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Nomor Putusan Lain</Label>
              <Input placeholder="Jika ada" />
            </div>
            <div className="grid gap-2">
              <Label>Pasal / Perkara</Label>
              <Input placeholder="Kasus kedua" />
            </div>
            <div className="grid gap-2">
              <Label>Vonis Tambahan</Label>
              <Input placeholder="Lama pidana" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
             <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
               + Tambah Perkara Lain
             </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button size="lg" className="w-full md:w-auto bg-slate-900">
          <Save className="w-4 h-4 mr-2" /> Simpan Data Klien & Hukum
        </Button>
      </div>
    </div>
  );

  // --- FORM 2: DATA PENJAMIN ---
  const FormPenjamin = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-slate-800 border-b pb-4 mb-6">
         <Users className="w-6 h-6 text-green-600" />
         <div>
            <h3 className="font-semibold text-lg">Data Penjamin Klien</h3>
            <p className="text-sm text-muted-foreground">Orang yang bertanggung jawab selama masa bimbingan.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2 col-span-2">
          <Label>Nama Lengkap Penjamin</Label>
          <Input placeholder="Sesuai KTP" />
        </div>

        <div className="grid gap-2">
          <Label>Hubungan dengan Klien</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Pilih Hubungan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="orang_tua">Orang Tua (Ayah/Ibu)</SelectItem>
              <SelectItem value="istri_suami">Istri / Suami</SelectItem>
              <SelectItem value="kakak_adik">Kakak / Adik</SelectItem>
              <SelectItem value="paman_bibi">Paman / Bibi</SelectItem>
              <SelectItem value="lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Nomor Telepon / WhatsApp</Label>
          <Input type="tel" placeholder="08..." />
        </div>

        <div className="grid gap-2">
          <Label>Pekerjaan</Label>
          <Input />
        </div>

        <div className="grid gap-2">
          <Label>Umur</Label>
          <Input type="number" className="w-24" />
        </div>

        <div className="grid gap-2 col-span-2">
          <Label>Alamat Lengkap (Tempat Tinggal)</Label>
          <Textarea placeholder="Alamat rumah penjamin (lokasi klien akan tinggal)" />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" /> Simpan Data Penjamin
        </Button>
      </div>
    </div>
  );

  // --- FORM 3: REGISTRASI LITMAS (Dengan Dropdown PK) ---
  const FormLitmas = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-slate-800 border-b pb-4 mb-6">
         <FileText className="w-6 h-6 text-blue-600" />
         <div>
            <h3 className="font-semibold text-lg">Registrasi Permintaan Litmas</h3>
            <p className="text-sm text-muted-foreground">Input surat permintaan dan penunjukan PK.</p>
         </div>
      </div>

      {/* Detail Surat Masuk */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="grid gap-2">
            <Label>Asal UPT (Lapas/Rutan)</Label>
            <Input placeholder="Cth: Lapas Cipinang" />
         </div>
         <div className="grid gap-2">
            <Label>Jenis Litmas</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Pilih Jenis..." /></SelectTrigger>
              <SelectContent>
                {JENIS_LITMAS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
         </div>
         
         <div className="grid gap-2">
            <Label>Nomor Surat Permintaan</Label>
            <Input placeholder="Nomor surat dari UPT" />
         </div>
         <div className="grid gap-2">
            <Label>Tanggal Surat</Label>
            <Input type="date" />
         </div>
      </div>

      <Separator className="my-4" />

      {/* Bagian Internal Bapas & Penunjukan PK */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-6">
        <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Administrasi Bapas</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
                <Label>Tanggal Diterima Bapas</Label>
                <Input type="date" />
            </div>
            <div className="grid gap-2">
                <Label>Nomor Surat Masuk (Agenda)</Label>
                <Input />
            </div>
        </div>

        {/* --- DROPDOWN MEMILIH PK (REFERENSI TABEL PETUGAS_PK) --- */}
        <div className="grid gap-2">
            <Label className="text-blue-900 font-bold">Tunjuk Petugas PK (Pembimbing Kemasyarakatan)</Label>
            <Select>
              <SelectTrigger className="bg-white border-blue-200">
                  <SelectValue placeholder="Pilih Nama PK..." />
              </SelectTrigger>
              <SelectContent>
                {PK_OPTIONS.map((pk) => (
                  <SelectItem key={pk.id} value={pk.id}>
                    <div className="flex flex-col text-left">
                        <span className="font-medium">{pk.nama}</span>
                        <span className="text-xs text-muted-foreground">NIP: {pk.nip}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-blue-600">
                *Petugas yang dipilih akan mendapatkan notifikasi tugas litmas baru.
            </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Save className="w-4 h-4 mr-2" /> Registrasi & Distribusi ke PK
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Operator Registrasi</h1>
        <p className="text-slate-500">Manajemen data klien masuk dan registrasi permintaan litmas.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto p-1 bg-slate-200">
          <TabsTrigger value="klien_perkara" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            1. Data Klien & Hukum
          </TabsTrigger>
          <TabsTrigger value="penjamin" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            2. Data Penjamin
          </TabsTrigger>
          <TabsTrigger value="litmas" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            3. Registrasi Litmas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="klien_perkara">
          <Card className="border-t-4 border-t-slate-800 shadow-md">
            <CardHeader>
              <CardTitle>Identitas & Riwayat Hukum</CardTitle>
              <CardDescription>Input data diri WBP beserta detail perkara utama dan tambahan.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormKlienPerkara />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="penjamin">
          <Card className="border-t-4 border-t-green-600 shadow-md">
            <CardHeader>
              <CardTitle>Identitas Penjamin</CardTitle>
              <CardDescription>Keluarga atau pihak yang menjamin klien selama masa integrasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormPenjamin />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="litmas">
          <Card className="border-t-4 border-t-blue-600 shadow-md">
            <CardHeader>
              <CardTitle>Registrasi Permintaan</CardTitle>
              <CardDescription>Pencatatan surat masuk dan penunjukan Petugas PK.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormLitmas />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
