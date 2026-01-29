import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TestPageLayout } from '@/components/TestPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Eye, Check, X, FileText, ExternalLink } from 'lucide-react';

export default function AnevTest() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    // QUERY FILTER: Hanya ambil yang statusnya 'Review'
    // Artinya PK sudah upload Laporan Litmas
    const { data, error } = await (supabase as any)
      .from('litmas')
      .select(`
        *,
        klien:klien!fk_litmas_klien(nama_klien),
        petugas_pk:petugas_pk!fk_litmas_pk(nama)
      `)
      .eq('status', 'Review') 
      .order('id_litmas', { ascending: true });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDecision = async (id: number, decision: 'Approved' | 'Revision') => {
    if (decision === 'Revision' && !notes) {
      toast({ variant: "destructive", title: "Gagal", description: "Catatan revisi wajib diisi" });
      return;
    }

    try {
      const updatePayload: any = {
        status: decision,
        anev_notes: decision === 'Revision' ? notes : null,
        reviewed_at: new Date().toISOString()
      };

      const { error } = await supabase.from('litmas').update(updatePayload).eq('id_litmas', id);

      if (error) throw error;

      toast({ title: "Berhasil", description: decision === 'Approved' ? "Litmas Disetujui" : "Dikembalikan ke PK untuk Revisi" });
      setNotes('');
      setDialogOpen(false);
      fetchReviews();
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
      description="Pemeriksaan Laporan Penelitian Kemasyarakatan"
      permissionCode="access_anev"
      icon={<BarChart3 className="w-8 h-8 text-primary" />}
    >
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Antrian Verifikasi ({reviews.length})</h2>
            <Button variant="outline" size="sm" onClick={fetchReviews} disabled={loading}>Refresh</Button>
        </div>

        {reviews.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 border rounded-lg text-slate-500">
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
                                
                                {/* Link Referensi Surat Tugas (Optional View) */}
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
      </div>
    </TestPageLayout>
  );
}