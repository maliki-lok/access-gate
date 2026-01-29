import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Eye, Check, X, FileText, ExternalLink, History, Clock } from 'lucide-react';

export default function AnevTest() {
  const { toast } = useToast();
  
  // State Data
  const [reviews, setReviews] = useState<any[]>([]); // Data Antrian
  const [history, setHistory] = useState<any[]>([]); // Data Riwayat
  const [loading, setLoading] = useState(false);
  
  // State Actions
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
        // 1. Ambil Antrian (Status = Review)
        const { data: dataReview, error: errReview } = await (supabase as any)
          .from('litmas')
          .select(`
            *,
            klien:klien!fk_litmas_klien(nama_klien, nomor_register_lapas),
            petugas_pk:petugas_pk!fk_litmas_pk(nama)
          `)
          .eq('status', 'Review') 
          .order('created_at', { ascending: true }); // Yang lama dulu (FIFO)

        if (errReview) throw errReview;
        setReviews(dataReview || []);

        // 2. Ambil History (Status != New Task, On Progress, Review)
        // Artinya ambil yang sudah Approved, Revision, atau sudah masuk TPP
        const { data: dataHistory, error: errHistory } = await (supabase as any)
          .from('litmas')
          .select(`
            *,
            klien:klien!fk_litmas_klien(nama_klien, nomor_register_lapas),
            petugas_pk:petugas_pk!fk_litmas_pk(nama)
          `)
          .not('status', 'in', '("New Task","On Progress","Review")') 
          .order('created_at', { ascending: false }); // Yang terbaru paling atas

        if (errHistory) throw errHistory;
        setHistory(dataHistory || []);

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- HANDLER KEPUTUSAN ---
  const handleDecision = async (id: number, decision: 'Approved' | 'Revision') => {
    if (decision === 'Revision' && !notes) {
      toast({ variant: "destructive", title: "Gagal", description: "Catatan revisi wajib diisi" });
      return;
    }

    try {
      const updatePayload: any = {
        status: decision,
        anev_notes: decision === 'Revision' ? notes : null,
        waktu_verifikasi_anev: new Date().toISOString()
        // reviewed_at: new Date().toISOString() // Pastikan kolom ini ada di DB, jika tidak hapus baris ini
      };

      const { error } = await supabase.from('litmas').update(updatePayload).eq('id_litmas', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: decision === 'Approved' ? "Litmas Disetujui" : "Dikembalikan ke PK untuk Revisi" });
      setNotes('');
      setDialogOpen(false);
      fetchData(); // Refresh kedua tabel
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const openDoc = (path: string) => {
    if(!path) return;
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <TestPageLayout
      title="Dashboard Anev"
      description="Pemeriksaan & Verifikasi Laporan Penelitian Kemasyarakatan"
      permissionCode="access_anev"
      icon={<BarChart3 className="w-8 h-8 text-primary" />}
    >
      <Tabs defaultValue="antrian" className="space-y-6">
        
        {/* TABS HEADER */}
        <div className="flex justify-between items-center">
            <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="antrian" className="flex items-center gap-2">
                    <Clock className="w-4 h-4"/> Antrian
                    {reviews.length > 0 && <Badge className="ml-1 bg-yellow-600 hover:bg-yellow-600 h-5 w-5 p-0 flex items-center justify-center rounded-full">{reviews.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="w-4 h-4"/> Riwayat
                </TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>Refresh Data</Button>
        </div>

        {/* --- TAB 1: ANTRIAN VERIFIKASI --- */}
        <TabsContent value="antrian">
            {reviews.length === 0 ? (
                <div className="text-center p-12 bg-slate-50 border rounded-lg text-slate-500 border-dashed">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300"/>
                    <h3 className="font-medium text-slate-900">Semua Bersih</h3>
                    <p className="text-sm">Tidak ada laporan litmas yang perlu diverifikasi saat ini.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((item) => (
                        <Card key={item.id_litmas} className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3 bg-slate-50/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-800">{item.klien?.nama_klien}</CardTitle>
                                        <p className="text-xs text-slate-500 font-mono mt-1">{item.jenis_litmas}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Perlu Review</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="text-sm space-y-2 mb-5">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">PK Penanggung Jawab:</span>
                                        <span className="font-medium">{item.petugas_pk?.nama}</span>
                                    </div>
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-slate-500">No. Surat:</span>
                                        <span className="font-mono text-xs">{item.nomor_surat_permintaan}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-5">
                                    {/* Tombol UTAMA: Lihat Laporan */}
                                    <Button 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm" 
                                        size="sm" 
                                        onClick={() => openDoc(item.hasil_litmas_url)}
                                    >
                                        <Eye className="w-4 h-4 mr-2"/> Buka Laporan Litmas
                                    </Button>
                                    
                                    {/* Link Referensi Surat Tugas */}
                                    {item.surat_tugas_signed_url && (
                                        <div 
                                            onClick={() => openDoc(item.surat_tugas_signed_url)}
                                            className="flex items-center justify-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 cursor-pointer transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3"/> Lihat Surat Tugas (Referensi)
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 border-t pt-4">
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => handleDecision(item.id_litmas, 'Approved')}>
                                        <Check className="w-4 h-4 mr-2"/> Terima
                                    </Button>

                                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => setSelectedId(item.id_litmas)}>
                                                <X className="w-4 h-4 mr-2"/> Revisi
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogTitle>Catatan Revisi</DialogTitle>
                                            <Textarea 
                                                placeholder="Jelaskan bagian yang perlu diperbaiki oleh PK..." 
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="min-h-[100px]"
                                            />
                                            <DialogFooter>
                                                <Button onClick={() => selectedId && handleDecision(selectedId, 'Revision')}>
                                                    Kirim Revisi
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* --- TAB 2: RIWAYAT / HISTORY --- */}
        <TabsContent value="history">
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Pemeriksaan</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Klien</TableHead>
                                <TableHead>Jenis Litmas</TableHead>
                                <TableHead>Petugas PK</TableHead>
                                <TableHead>Status Keputusan</TableHead>
                                <TableHead>Catatan / Info</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada riwayat pemeriksaan.</TableCell>
                                </TableRow>
                            ) : (
                                history.map((item) => (
                                    <TableRow key={item.id_litmas}>
                                        <TableCell>
                                            <div className="font-bold">{item.klien?.nama_klien}</div>
                                            <div className="text-xs text-muted-foreground">{item.klien?.nomor_register_lapas}</div>
                                        </TableCell>
                                        <TableCell>{item.jenis_litmas}</TableCell>
                                        <TableCell>{item.petugas_pk?.nama}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                item.status === 'Approved' ? 'bg-green-600' :
                                                item.status === 'Revision' ? 'bg-red-600' :
                                                item.status === 'TPP Registered' || item.status === 'TPP Scheduled' ? 'bg-purple-600' :
                                                item.status === 'Selesai' ? 'bg-slate-600' :
                                                'bg-slate-500'
                                            }>
                                                {item.status === 'Approved' ? 'Disetujui' : item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-xs">
                                            {item.status === 'Revision' ? (
                                                <div className="text-xs text-red-600 italic border-l-2 border-red-200 pl-2">
                                                    "{item.anev_notes}"
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => openDoc(item.hasil_litmas_url)}>
                                                <FileText className="w-4 h-4 text-slate-500"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </TestPageLayout>
  );
}