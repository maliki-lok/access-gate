import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock } from 'lucide-react';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Default true agar tidak flicker halaman kosong
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyUser = async () => {
      // 1. Cek apakah di URL ada tanda-tanda token pemulihan (access_token / type=recovery)
      const hash = window.location.hash;
      const isRecoveryLink = hash && (hash.includes('type=recovery') || hash.includes('access_token'));

      // 2. Ambil sesi saat ini
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // CASE A: User sudah punya sesi (Mungkin refresh halaman atau proses hash selesai sangat cepat)
        if(mounted) setCheckingSession(false);
      } else if (isRecoveryLink) {
        // CASE B: Belum ada sesi, TAPI ada token di URL.
        // JANGAN ERROR DULU. Ini berarti Supabase sedang memproses token.
        // Kita tunggu event 'PASSWORD_RECOVERY' atau 'SIGNED_IN' dari listener di bawah.
        console.log("Sedang memproses token dari URL...");
      } else {
        // CASE C: Tidak ada sesi DAN tidak ada token di URL.
        // Ini murni akses ilegal atau link sudah benar-benar basi/terpakai.
        toast.error("Link tidak valid atau sudah kadaluarsa.");
        navigate('/login');
      }
    };

    verifyUser();

    // 3. Pasang Listener untuk menangkap momen ketika Supabase selesai memproses Link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        // Hore! Supabase berhasil menukar Link menjadi Sesi.
        // User siap ganti password.
        if(mounted) setCheckingSession(false);
      } else if (event === 'SIGNED_OUT') {
        // Token gagal atau user logout
        // Jangan redirect langsung, biarkan user melihat form (tapi submit akan gagal nanti)
        // atau redirect jika Anda ketat.
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      // Update password user yang sedang login (hasil dari magic link)
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password berhasil diperbarui! Silakan login kembali.');
      
      // Logout agar aman, lalu lempar ke login
      await supabase.auth.signOut();
      navigate('/login');

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Gagal memperbarui password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Memverifikasi keamanan link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Atur Password Baru</CardTitle>
          <CardDescription>
            Silakan masukkan password baru untuk akun Anda.
          </CardDescription>
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
          <CardFooter className="flex flex-col gap-2">
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
