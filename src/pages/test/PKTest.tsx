import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { SuratTugasGenerator } from '@/components/litmas/SuratTugasGenerator'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, RefreshCcw, Upload, CheckCircle, AlertCircle, Clock, FileText, Calendar, HelpCircle, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PKTest() {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  
  // State Pendaftaran TPP
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedLitmasId, setSelectedLitmasId] = useState<number | null>(null);
  const [availableSchedules, setAvailableSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  const isAdmin = hasRole('admin');

  // Fetch Tasks
  const fetchMyTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let pkId = null;
      if (!isAdmin) {
        const { data: pkData } = await supabase.from('petugas_pk').select('id').eq('user_id', user.id).maybeSingle();
        if (!pkData) { setTasks([]); setLoading(false); return; }
        pkId = pkData.id;
      }

      // FIX: Gunakan (supabase as any) dan ganti order ke 'created_at'
      let query: any = (supabase as any)
        .from('litmas')
        .select(`
            *,
            klien:klien!litmas_id_klien_fkey (nama_klien, nomor_register_lapas, kategori_usia),
            petugas_pk:petugas_pk!litmas_nama_pk_fkey (nama, nip),
            jadwal:tpp_schedules!litmas_tpp_schedule_id_fkey (tanggal_sidang, jenis_sidang)
        `)
        .order('created_at', { ascending: false }); // PERBAIKAN DISINI: updated_at -> created_at

      if (!isAdmin && pkId) query = query.eq('nama_pk', pkId);

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
      fetchMyTasks(); 
      // Fetch Jadwal dengan (supabase as any)
      const fetchSchedules = async () => {
          const { data } = await (supabase as any)
            .from('tpp_schedules')
            .select('*')
            .eq('status', 'Open')
            .gte('tanggal_sidang', new Date().toISOString()); 
          setAvailableSchedules(data || []);
      };
      fetchSchedules();
  }, [user, isAdmin]);

  const handleUpload = async (file: File, taskId: number, type: 'surat_tugas' | 'hasil_litmas') => {
    setUploadingId(taskId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${type}/${taskId}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
      if (upErr) throw upErr;

      let updateData: any = {};
      if (type === 'surat_tugas') updateData = { surat_tugas_signed_url: path, status: 'On Progress' };
      else updateData = { hasil_litmas_url: path, status: 'Review', anev_notes: null };

      await supabase.from('litmas').update(updateData).eq('id_litmas', taskId);
      toast({ title: "Berhasil", description: "Dokumen diupload." });
      fetchMyTasks(); 
    } catch (e: any) {
      toast({ variant: "destructive", title: "Gagal", description: e.message });
    } finally {
      setUploadingId(null);
    }
  };

  // --- LOGIC PENDAFTARAN TPP (PILIH JADWAL) ---
  const openRegisterDialog = (id: number) => {
      setSelectedLitmasId(id);
      setSelectedScheduleId('');
      setIsRegisterOpen(true);
  };

  const confirmRegisterTPP = async () => {
      if (!selectedScheduleId || !selectedLitmasId) return toast({ variant: "destructive", title: "Pilih jadwal dulu!" });

      const { error } = await supabase
        .from('litmas')
        .update({ 
            status: 'TPP Scheduled', // Langsung scheduled karena sudah pilih jadwal
            tpp_schedule_id: selectedScheduleId 
        } as any)
        .eq('id_litmas', selectedLitmasId);

      if (error) toast({ variant: "destructive", title: "Gagal", description: error.message });
      else {
          toast({ title: "Sukses", description: "Berhasil mendaftar ke jadwal sidang." });
          setIsRegisterOpen(false);
          fetchMyTasks();
      }
  };

  const getStatus = (status: string | null) => status || 'New Task';

  return (
    <TestPageLayout title="Dashboard PK" description="Tugas Litmas & Pendaftaran Sidang" permissionCode="access_pk" icon={<User className="w-8 h-8 text-primary" />}>
      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Daftar Tugas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Klien</TableHead>
                  <TableHead>Status & Jadwal</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => {
                    const status = getStatus(task.status);
                    return (
                    <TableRow key={task.id_litmas}>
                      <TableCell>
                        <div className="font-bold">{task.klien?.nama_klien}</div>
                        <div className="text-xs text-muted-foreground">Reg: {task.klien?.nomor_register_lapas}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 items-start">
                            <Badge className={
                                status === 'Disetujui' ? 'bg-green-600' :
                                status === 'Ditolak' ? 'bg-red-600' :
                                status === 'On Progress' ? 'bg-blue-600' : 
                                status === 'TPP Scheduled' ? 'bg-purple-600' :
                                status === 'Selesai' ? 'bg-slate-700' :
                                'bg-slate-600'
                            }>
                                {status === 'TPP Scheduled' ? 'Sidang Dijadwalkan' : status}
                            </Badge>
                            {/* INFO JADWAL DARI RELASI TABEL JADWAL */}
                            {task.jadwal && (
                                <div className="bg-purple-50 border border-purple-200 p-2 rounded text-xs text-purple-800">
                                    <div className="font-bold flex gap-1"><Calendar className="w-3 h-3"/> {new Date(task.jadwal.tanggal_sidang).toLocaleDateString('id-ID')}</div>
                                    <div>{task.jadwal.jenis_sidang}</div>
                                </div>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          
                          {/* TAHAP 1: SURAT TUGAS */}
                          {status === 'New Task' && (
                            <div className="flex gap-2">
                                <SuratTugasGenerator litmasId={task.id_litmas} />
                                <div className="relative">
                                    <Button size="sm" variant="secondary">Upload TTD</Button>
                                    <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], task.id_litmas, 'surat_tugas')} />
                                </div>
                            </div>
                          )}

                          {/* TAHAP 2: LAPORAN */}
                          {(status === 'On Progress' || status === 'Revision') && (
                             <div className="relative">
                                <Button size="sm" className="bg-blue-600 w-full hover:bg-blue-700">Upload Laporan</Button>
                                <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], task.id_litmas, 'hasil_litmas')} />
                             </div>
                          )}

                          {/* MENUNGGU REVIEW */}
                          {status === 'Review' && (
                            <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                <Clock className="w-3 h-3"/> Menunggu Verifikasi
                            </div>
                          )}

                          {/* SIAP DAFTAR TPP */}
                          {status === 'Approved' && (
                            <Button size="sm" variant="outline" className="border-green-600 text-green-700 w-full hover:bg-green-50" onClick={() => openRegisterDialog(task.id_litmas)}>
                                Daftar Sidang TPP
                            </Button>
                          )}

                          {/* SUDAH TERJADWAL */}
                          {status === 'TPP Scheduled' && (
                             <div className="flex items-center justify-center gap-2 text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200 font-bold">
                                <CheckSquare className="w-4 h-4"/> Siap Sidang
                             </div>
                          )}

                          {/* SELESAI */}
                          {status === 'Selesai' && (
                             <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-100 p-2 rounded border">
                                <CheckCircle className="w-4 h-4"/> Selesai
                             </div>
                          )}

                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODAL PILIH JADWAL (Fitur No. 5) */}
        <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Pilih Jadwal Sidang</DialogTitle><DialogDescription>Pilih salah satu jadwal yang dibuka oleh Operator TPP.</DialogDescription></DialogHeader>
                <div className="py-4">
                    <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                        <SelectTrigger><SelectValue placeholder="Pilih Tanggal..." /></SelectTrigger>
                        <SelectContent>
                            {availableSchedules.map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                    {new Date(s.tanggal_sidang).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} — {s.jenis_sidang}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={confirmRegisterTPP} className="bg-purple-600 hover:bg-purple-700">Daftar Sekarang</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </TestPageLayout>
  );
}