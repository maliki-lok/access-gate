import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import { TestPageLayout } from '@/components/TestPageLayout'; 
import { 
  Search, CheckCircle, Clock, Users, 
  Eye, XCircle, Calendar, FileCheck, Loader2, 
  BarChart3, AlertTriangle, Shield, FileText
} from 'lucide-react';

// --- Interfaces ---
interface LitmasData {
  id_litmas: number;
  nomor_surat_permintaan: string;
  tanggal_surat_permintaan: string;
  asal_bapas: string;
  jenis_litmas: string;
  status: string;
  catatan_revisi: string | null;
  nama_pk: string | null; 
  // FIX: Sesuaikan nama kolom dengan database (nama_klien)
  klien?: {
    nama_klien: string;
  } | null;
  petugas?: {
    id: string;
    nama: string;
    nip: string;
  } | null;
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
  
  // State Popup Detail Verifikasi
  const [selectedItem, setSelectedItem] = useState<LitmasData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [catatanRevisi, setCatatanRevisi] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // State Popup Detail Kinerja PK
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerStats | null>(null);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);

  // --- 1. Fetch Data Function ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // A. Ambil Data Litmas
      // FIX: Query disesuaikan dengan kolom 'nama_klien' dan relasi yang benar
      const { data: litmasData, error: litmasError } = await supabase
        .from('litmas')
        .select(`
          *,
          petugas:petugas_pk!litmas_nama_pk_fkey (
            id,
            nama,
            nip
          ),
          klien:klien!litmas_id_klien_fkey (
            nama_klien
          )
        `)
        .order('created_at', { ascending: false });

      if (litmasError) throw litmasError;

      // B. Ambil Data Petugas
      const { data: petugasData, error: petugasError } = await supabase
        .from('petugas_pk')
        .select('id, nama, nip');
      
      if (petugasError) {
          console.warn("Gagal fetch tabel petugas_pk", petugasError);
      }

      // C. Olah Data
      const allLitmas = (litmasData as unknown as LitmasData[]) || [];
      setLitmasList(allLitmas);

      // --- Statistik ---
      const statsMap = new Map<string, OfficerStats>();

      if (petugasData) {
        petugasData.forEach((p: any) => {
            statsMap.set(p.id, {
                id: p.id,
                nama: p.nama,
                nip: p.nip,
                foto_url: undefined,
                total_assigned: 0,
                completed: 0,
                in_progress: 0,
                revision: 0,
                performance_rate: 0
            });
        });
      }

      allLitmas.forEach(item => {
        const pkId = item.petugas?.id;
        if (pkId) {
             if (!statsMap.has(pkId)) {
                statsMap.set(pkId, {
                    id: pkId,
                    nama: item.petugas!.nama,
                    nip: item.petugas!.nip,
                    foto_url: undefined,
                    total_assigned: 0,
                    completed: 0,
                    in_progress: 0,
                    revision: 0,
                    performance_rate: 0
                });
             }

             const stat = statsMap.get(pkId)!;
             stat.total_assigned += 1;

             if (item.status === 'Disetujui') {
                 stat.completed += 1;
             } else if (item.status === 'Revisi') {
                 stat.revision += 1;
             } else {
                 stat.in_progress += 1; 
             }
        }
      });

      const finalStats = Array.from(statsMap.values()).map(stat => ({
          ...stat,
          performance_rate: stat.total_assigned > 0 
            ? Math.round((stat.completed / stat.total_assigned) * 100) 
            : 0
      }));

      setOfficerStats(finalStats.sort((a, b) => b.total_assigned - a.total_assigned)); 

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('realtime-dashboard-kasie')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'litmas' }, (payload) => {
          fetchData(); 
          if (payload.eventType === 'INSERT') toast.info('Data Litmas baru masuk.');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- Handlers ---
  const handleOpenDetail = (item: LitmasData) => {
    setSelectedItem(item);
    setCatatanRevisi(item.catatan_revisi || ''); 
    setIsDetailOpen(true);
  };

  const handleOpenPerformance = (officer: OfficerStats) => {
    setSelectedOfficer(officer);
    setIsPerformanceOpen(true);
  }

  const updateStatus = async (newStatus: string, note?: string) => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('litmas')
        .update({ 
          status: newStatus, 
          catatan_revisi: note || null 
        } as any)
        .eq('id_litmas', selectedItem.id_litmas);

      if (error) throw error;
      toast.success(newStatus === 'Revisi' ? 'Dikembalikan ke PK' : 'Disetujui');
      setIsDetailOpen(false);
    } catch (error: any) {
      toast.error('Gagal update: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLitmas = litmasList.filter(item => 
    item.nomor_surat_permintaan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenis_litmas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.petugas?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.klien?.nama_klien.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ''
  );

  // Filter tugas untuk popup kinerja
  const selectedOfficerTasks = litmasList.filter(item => item.petugas?.id === selectedOfficer?.id);

  const globalStats = {
    waiting: litmasList.filter(i => i.status === 'Menunggu Verifikasi' || !i.status).length,
    process: litmasList.filter(i => i.status === 'Proses').length,
    completed: litmasList.filter(i => i.status === 'Disetujui').length,
    active_pk: officerStats.length
  };

  return (
    <TestPageLayout 
      title="Dashboard Kepala Seksi"
      description="Monitoring kinerja PK dan Verifikasi Laporan Litmas (Real-Time)"
      permissionCode="access_kasie"
      icon={<Shield className="w-6 h-6" />}
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        {/* Header Tanggal */}
        <div className="flex flex-col md:flex-row justify-end items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
             <Calendar className="h-4 w-4 text-slate-500" />
             <span className="text-sm font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Perlu Verifikasi</p><h3 className="text-2xl font-bold">{globalStats.waiting}</h3></div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center"><FileCheck className="h-5 w-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-yellow-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Sedang Proses</p><h3 className="text-2xl font-bold">{globalStats.process}</h3></div>
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Selesai</p><h3 className="text-2xl font-bold">{globalStats.completed}</h3></div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div><p className="text-sm text-muted-foreground">Total Anggota</p><h3 className="text-2xl font-bold">{globalStats.active_pk}</h3></div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center"><Users className="h-5 w-5 text-purple-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="approval" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="approval">Permintaan Persetujuan</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring Anggota</TabsTrigger>
          </TabsList>

          {/* TAB 1: APPROVAL */}
          <TabsContent value="approval">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daftar Verifikasi Litmas</CardTitle>
                    <CardDescription>Dokumen yang memerlukan tinjauan Anda.</CardDescription>
                  </div>
                  <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari surat / PK / Klien..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : filteredLitmas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Tidak ada dokumen ditemukan.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Surat / Tgl</TableHead>
                        <TableHead>Klien</TableHead>
                        <TableHead>Jenis / Asal</TableHead>
                        <TableHead>PK Penanggungjawab</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLitmas.map((item) => (
                        <TableRow key={item.id_litmas}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-xs">{item.nomor_surat_permintaan || '-'}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.tanggal_surat_permintaan ? new Date(item.tanggal_surat_permintaan).toLocaleDateString('id-ID') : '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">{item.klien?.nama_klien || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{item.jenis_litmas}</span>
                              <span className="text-xs text-muted-foreground">{item.asal_bapas}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {item.petugas?.nama?.substring(0,2).toUpperCase() || 'PK'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{item.petugas?.nama || 'Belum ditunjuk'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              item.status === 'Menunggu Verifikasi' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                              item.status === 'Disetujui' ? 'bg-green-50 text-green-700 border-green-200' :
                              item.status === 'Revisi' ? 'bg-red-50 text-red-700 border-red-200' : 
                              'bg-blue-50 text-blue-700 border-blue-200'
                            }>
                              {item.status || 'Baru'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => handleOpenDetail(item)}>
                              <Eye className="mr-2 h-4 w-4" /> Tinjau
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: MONITORING ANGGOTA */}
          <TabsContent value="monitoring">
              {loading ? (
                  <div className="text-center py-12"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></div>
              ) : officerStats.length === 0 ? (
                  <Card><CardContent className="text-center py-12 text-muted-foreground">Belum ada data petugas.</CardContent></Card>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {officerStats.map((pk) => (
                          <Card key={pk.id} className="hover:shadow-md transition-shadow relative overflow-hidden">
                              <CardHeader className="pb-3 flex flex-row items-center gap-4 space-y-0">
                                  <Avatar className="h-12 w-12 border">
                                      <AvatarImage src={pk.foto_url} />
                                      <AvatarFallback className="bg-primary/5 text-primary text-lg font-semibold">
                                          {pk.nama.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                  </Avatar>
                                  <div className="space-y-1 overflow-hidden">
                                      <CardTitle className="text-base truncate" title={pk.nama}>{pk.nama}</CardTitle>
                                      <CardDescription className="text-xs font-mono">{pk.nip}</CardDescription>
                                  </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                      <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>Completion Rate</span>
                                          <span className="font-medium text-foreground">{pk.performance_rate}%</span>
                                      </div>
                                      <Progress value={pk.performance_rate} className="h-2" />
                                  </div>
                                  <Separator />
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                      <div className="bg-blue-50 p-2 rounded-lg">
                                          <div className="text-xs text-blue-600 font-medium mb-1">Total</div>
                                          <div className="text-xl font-bold text-blue-700">{pk.total_assigned}</div>
                                      </div>
                                      <div className="bg-green-50 p-2 rounded-lg">
                                          <div className="text-xs text-green-600 font-medium mb-1">Selesai</div>
                                          <div className="text-xl font-bold text-green-700">{pk.completed}</div>
                                      </div>
                                      <div className="bg-yellow-50 p-2 rounded-lg">
                                          <div className="text-xs text-yellow-600 font-medium mb-1">Proses</div>
                                          <div className="text-xl font-bold text-yellow-700">{pk.in_progress}</div>
                                      </div>
                                  </div>
                                  {pk.revision > 0 && (
                                      <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100 justify-center">
                                          <AlertTriangle className="h-3 w-3" />
                                          <span>{pk.revision} dokumen revisi</span>
                                      </div>
                                  )}
                              </CardContent>
                              <CardFooter>
                                  <Button 
                                    variant="ghost" 
                                    className="w-full text-xs hover:bg-slate-100" 
                                    size="sm"
                                    onClick={() => handleOpenPerformance(pk)}
                                  >
                                      <BarChart3 className="mr-2 h-3 w-3" /> Detail Kinerja
                                  </Button>
                              </CardFooter>
                          </Card>
                      ))}
                  </div>
              )}
          </TabsContent>
        </Tabs>

        {/* DIALOG DETAIL VERIFIKASI */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <div className="flex items-center justify-between mr-6">
                      <DialogTitle>Tinjauan Dokumen Litmas</DialogTitle>
                      <Badge variant="secondary">{selectedItem?.status || 'Baru'}</Badge>
                  </div>
                  <DialogDescription>No. Surat: {selectedItem?.nomor_surat_permintaan}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md">
                      <div><span className="text-muted-foreground block text-xs uppercase">Nama Klien</span> <p className="font-medium">{selectedItem?.klien?.nama_klien || '-'}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase">Jenis Litmas</span> <p className="font-medium">{selectedItem?.jenis_litmas}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase">Asal UPT</span> <p className="font-medium">{selectedItem?.asal_bapas}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase">Petugas PK</span> <p className="font-medium">{selectedItem?.petugas?.nama}</p></div>
                      <div><span className="text-muted-foreground block text-xs uppercase">Tanggal Surat</span> <p className="font-medium">{selectedItem?.tanggal_surat_permintaan}</p></div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                      <span className="text-sm font-medium">Catatan / Komentar Verifikasi:</span>
                      <Textarea 
                          placeholder="Berikan catatan jika ada revisi, atau pesan persetujuan..." 
                          value={catatanRevisi} 
                          onChange={(e) => setCatatanRevisi(e.target.value)}
                          className="h-24"
                      />
                  </div>
              </div>

              <DialogFooter>
                  <Button variant="destructive" onClick={() => updateStatus('Revisi', catatanRevisi)} disabled={isProcessing}>
                      <XCircle className="mr-2 h-4 w-4" /> Kembalikan (Revisi)
                  </Button>
                  <Button onClick={() => updateStatus('Disetujui')} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Setujui
                  </Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG DETAIL KINERJA PK */}
        <Dialog open={isPerformanceOpen} onOpenChange={setIsPerformanceOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-slate-100">
                    <AvatarImage src={selectedOfficer?.foto_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {selectedOfficer?.nama.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl">{selectedOfficer?.nama}</DialogTitle>
                  <DialogDescription className="font-mono text-xs mt-1">NIP. {selectedOfficer?.nip}</DialogDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Total: {selectedOfficer?.total_assigned}</Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">Selesai: {selectedOfficer?.completed}</Badge>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" /> Riwayat Penugasan Litmas
              </h4>
              
              {selectedOfficerTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                  Belum ada riwayat tugas yang tercatat.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Surat & Klien</TableHead>
                        <TableHead>Jenis Litmas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Tgl. Permintaan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOfficerTasks.map((task) => (
                        <TableRow key={task.id_litmas} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-xs text-slate-900">
                                    {task.nomor_surat_permintaan}
                                </span>
                                {/* FIX: Nama Klien menggunakan kolom yang benar */}
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    <span className="font-medium text-slate-700">Klien: {task.klien?.nama_klien || '-'}</span>
                                    <span>{task.asal_bapas}</span>
                                </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{task.jenis_litmas}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={
                                task.status === 'Disetujui' ? 'bg-green-100 text-green-700 border-green-200' :
                                task.status === 'Revisi' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }>
                              {task.status || 'Baru'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground font-mono">
                            {task.tanggal_surat_permintaan ? new Date(task.tanggal_surat_permintaan).toLocaleDateString('id-ID') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setIsPerformanceOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TestPageLayout>
  );
}