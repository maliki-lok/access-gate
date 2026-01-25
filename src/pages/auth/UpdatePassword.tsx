import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State Logika
  const [sessionReady, setSessionReady] = useState(false); // Apakah user sudah terautentikasi?
  const [loading, setLoading] = useState(false); // Loading saat submit
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // 1. Cek Sesi Eksisting (Mungkin browser menyimpan sesi lama atau proses pertukaran token sudah selesai)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && mounted) {
        console.log("Sesi ditemukan langsung.");
        setSessionReady(true);
        return;
      }

      // 2. Jika sesi belum ada, kita DENGARKAN perubahan auth.
      // Ini adalah kunci perbaikannya. Kita tunggu Supabase Client menyelesaikan tugasnya.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth Event Triggered: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
          if (mounted) {
            console.log("Token berhasil ditukar menjadi Sesi.");
            setSessionReady(true);
          }
        }
        
        // Abaikan event SIGNED_OUT, karena itu bisa terjadi sebelum SIGNED_IN
      });

      // 3. Failsafe Timeout (Jaga-jaga jika 6 detik tidak ada kejadian apa-apa)
      setTimeout(async () => {
        if (mounted && !sessionReady) {
            // Cek sekali lagi, siapa tahu sesi sudah masuk tapi event terlewat
            const { data: { session: finalCheck } } = await supabase.auth.getSession();
            if (finalCheck) {
                 setSessionReady(true);
            } else {
                 // Benar-benar gagal
                 setErrorMessage("Gagal memverifikasi link. Pastikan link belum pernah dipakai sebelumnya.");
            }
        }
      }, 6000); // 6 Detik waktu tunggu

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []); // Dependencies kosong = hanya jalan sekali saat mount

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      toast.success('Password berhasil diperbarui! Mengarahkan ke login...');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 1500);

    } catch (error: any) {
      toast.error('Gagal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER LOGIC ---

  // 1. Jika Error Failsafe Muncul
  if (errorMessage && !sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-red-200">
            <CardHeader className="text-center">
                <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Link Tidak Valid</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => navigate('/login')}>
                    Kembali ke Login
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  // 2. Jika Masih Loading / Menunggu Token (Sesi belum siap)
  if (!sessionReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-lg font-semibold text-gray-700">Memverifikasi Keamanan...</h2>
        <p className="text-sm text-gray-500">Mohon tunggu, sedang menghubungkan ke server.</p>
      </div>
    );
  }

  // 3. Jika Sesi Siap (Form Muncul)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Atur Password Baru</CardTitle>
          <CardDescription>Silakan masukkan password baru Anda.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Konfirmasi Password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Password Baru
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
