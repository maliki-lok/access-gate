import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Search, CheckCircle, Clock, Users, 
  Eye, FileCheck, Loader2, 
  BarChart3, AlertTriangle, Shield, FileText, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface LitmasData {
  id_litmas: number;
  nomor_surat_permintaan: string;
  tanggal_surat_permintaan: string;
  asal_bapas: string;
  jenis_litmas: string;
  status: string;
  anev_notes: string | null; 
  surat_tugas_signed_url: string | null;
  hasil_litmas_url: string | null;
  klien?: { nama_klien: string; nomor_register_lapas: string; } | null;
  petugas?: { id: string; nama: string; nip: string; } | null;
}

interface OfficerStats {
  id: string;
  nama: string;
  nip: string;
  foto_url?: string;
  total_assigned: number;
  completed: number;
  in_progress: number;
  revision: number;
  performance_rate: number;
}

export default function KasieDashboard() {
  const [litmasList, setLitmasList] = useState<LitmasData[]>([]);
  const [officerStats, setOfficerStats] = useState<OfficerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State View Detail
  const [selectedItem, setSelectedItem] = useState<LitmasData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // State View Kinerja Detail
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerStats | null>(null);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Ambil Data Litmas
      const { data: litmasData, error: litmasError } = await (supabase as any)
        .from('litmas')
        .select(`
          *,
          petugas:petugas_pk!litmas_nama_pk_fkey (id, nama, nip),
          klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas)
        `)
        .order('created_at', { ascending: false });

      if (litmasError) throw litmasError;

      // 2. Ambil Data Petugas
      const { data: petugasData } = await supabase.from('petugas_pk').select('id, nama, nip');

      // 3. Olah Data Statistik
      const allLitmas = (litmasData as unknown as LitmasData[]) || [];
      setLitmasList(allLitmas);

      const statsMap = new Map<string, OfficerStats>();
      petugasData?.forEach((p: any) => {
          statsMap.set(p.id, {
              id: p.id, nama: p.nama, nip: p.nip,
              total_assigned: 0, completed: 0, in_progress: 0, revision: 0, performance_rate: 0
          });
      });

      allLitmas.forEach(item => {
        const pkId = item.petugas?.id;
        if (pkId && statsMap.has(pkId)) {
             const stat = statsMap.get(pkId)!;
             stat.total_assigned += 1;
             if (item.status === 'Selesai' || item.status === 'Approved') stat.completed += 1;
             else if (item.status === 'Revision') stat.revision += 1;
             else stat.in_progress += 1; 
        }
      });

      const finalStats = Array.from(statsMap.values()).map(stat => ({
          ...stat,
          performance_rate: stat.total_assigned > 0 ? Math.round((stat.completed / stat.total_assigned) * 100) : 0
      }));
      setOfficerStats(finalStats.sort((a, b) => b.total_assigned - a.total_assigned)); 

    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('kasie-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'litmas' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openDoc = (path: string | null) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  const filteredLitmas = litmasList.filter(item => 
    item.klien?.nama_klien.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.petugas?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nomor_surat_permintaan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <TestPageLayout 
      title="Dashboard Kepala Seksi"
      description="Monitoring Kinerja PK dan Pengawasan Proses Litmas"
      permissionCode="access_kasie"
      icon={<Shield className="w-6 h-6" />}
    >
      <div className="space-y-6">
        
        {/* STATISTIK CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-slate-500 bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Tugas Baru</p><h3 className="text-2xl font-bold">{litmasList.filter(i => i.status === 'New Task').length}</h3></div>
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center"><FileText className="h-5 w-5 text-slate-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-yellow-500 bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Butuh Verifikasi Anev</p><h3 className="text-2xl font-bold">{litmasList.filter(i => i.status === 'Review').length}</h3></div>
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-blue-500 bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Sedang Proses PK</p><h3 className="text-2xl font-bold">{litmasList.filter(i => i.status === 'On Progress' || i.status === 'Revision').length}</h3></div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"><Loader2 className="h-5 w-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500 bg-white">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Selesai / TPP</p><h3 className="text-2xl font-bold">{litmasList.filter(i => ['Approved', 'TPP Registered', 'TPP Scheduled', 'Selesai'].includes(i.status)).length}</h3></div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS UTAMA */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="list">Daftar Pengawasan Litmas</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring Kinerja Anggota</TabsTrigger>
          </TabsList>

          {/* TAB 1: LIST LITMAS (VIEW ONLY) */}
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Pengawasan</CardTitle>
                  <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari klien, pk, no surat..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Klien</TableHead>
                        <TableHead>Jenis Litmas</TableHead>
                        <TableHead>PK</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLitmas.map((item) => (
                        <TableRow key={item.id_litmas}>
                          <TableCell>
                            <div className="font-medium">{item.klien?.nama_klien}</div>
                            <div className="text-xs text-muted-foreground">{item.nomor_surat_permintaan}</div>
                          </TableCell>
                          <TableCell>{item.jenis_litmas}</TableCell>
                          <TableCell>{item.petugas?.nama}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                                item.status === 'New Task' ? 'text-slate-500 border-slate-300' :
                                item.status === 'On Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                item.status === 'Review' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-green-50 text-green-700 border-green-200'
                            }>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedItem(item); setIsDetailOpen(true); }}>
                              <Eye className="mr-2 h-4 w-4" /> Lihat
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MONITORING KINERJA */}
          <TabsContent value="monitoring">
              {officerStats.length === 0 ? (
                  <Card><CardContent className="text-center py-12 text-muted-foreground">Belum ada data petugas.</CardContent></Card>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {officerStats.map((pk) => (
                          <Card key={pk.id} className="hover:shadow-md transition-shadow">
                              <CardHeader className="pb-3 flex flex-row items-center gap-4">
                                  <Avatar className="h-12 w-12 border">
                                      <AvatarFallback className="bg-primary/5 text-primary font-bold">{pk.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="overflow-hidden">
                                      <CardTitle className="text-base truncate">{pk.nama}</CardTitle>
                                      <CardDescription className="text-xs font-mono">{pk.nip}</CardDescription>
                                  </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  <div className="space-y-1">
                                      <div className="flex justify-between text-xs text-muted-foreground"><span>Penyelesaian</span><span>{pk.performance_rate}%</span></div>
                                      <Progress value={pk.performance_rate} className="h-2" />
                                  </div>
                                  <Separator />
                                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                      <div className="bg-slate-50 p-2 rounded"><strong>{pk.total_assigned}</strong><div className="text-slate-500">Total</div></div>
                                      <div className="bg-green-50 p-2 rounded text-green-700"><strong>{pk.completed}</strong><div className="text-green-600">Selesai</div></div>
                                      <div className="bg-blue-50 p-2 rounded text-blue-700"><strong>{pk.in_progress}</strong><div className="text-blue-600">Proses</div></div>
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              )}
          </TabsContent>
        </Tabs>

        {/* MODAL DETAIL (VIEW ONLY) */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <div className="flex items-center justify-between mr-6">
                      <DialogTitle>Detail Pengawasan</DialogTitle>
                      <Badge>{selectedItem?.status}</Badge>
                  </div>
                  <DialogDescription>Nomor Surat: {selectedItem?.nomor_surat_permintaan}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md">
                      <div><span className="text-muted-foreground block text-xs uppercase mb-1">Nama Klien</span> <p className="font-medium">{selectedItem?.klien?.nama_klien}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase mb-1">Jenis Litmas</span> <p className="font-medium">{selectedItem?.jenis_litmas}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase mb-1">Asal Bapas</span> <p className="font-medium">{selectedItem?.asal_bapas}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase mb-1">PK Penanggungjawab</span> <p className="font-medium">{selectedItem?.petugas?.nama}</p></div>
                  </div>

                  <div className="space-y-2">
                      <span className="text-sm font-semibold">Dokumen Pekerjaan:</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="border p-3 rounded flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Surat Tugas</span>
                            {selectedItem?.surat_tugas_signed_url ? (
                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openDoc(selectedItem.surat_tugas_signed_url)}><ExternalLink className="w-3 h-3 mr-1"/> Buka</Button>
                            ) : <span className="text-xs text-slate-400 italic">Belum diupload</span>}
                        </div>
                        <div className="border p-3 rounded flex justify-between items-center bg-blue-50/50">
                            <span className="text-xs font-medium text-slate-700">Laporan Litmas</span>
                            {selectedItem?.hasil_litmas_url ? (
                                <Button size="sm" className="h-7 text-xs bg-blue-600" onClick={() => openDoc(selectedItem.hasil_litmas_url)}><FileText className="w-3 h-3 mr-1"/> Buka</Button>
                            ) : <span className="text-xs text-slate-400 italic">Belum diupload</span>}
                        </div>
                      </div>
                  </div>
              </div>
          </DialogContent>
        </Dialog>

      </div>
    </TestPageLayout>
  );
}