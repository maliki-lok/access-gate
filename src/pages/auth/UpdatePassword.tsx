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
  
  // State UI
  const [loading, setLoading] = useState(false); // Loading saat submit form
  const [verifying, setVerifying] = useState(true); // Loading saat cek link
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // Error state

  useEffect(() => {
    let mounted = true;

    const initRecovery = async () => {
      // 1. Ambil Hash dari URL (ini berisi token rahasia)
      const hash = window.location.hash;
      const hasToken = hash && (hash.includes('access_token') || hash.includes('type=recovery'));
      
      // 2. Cek apakah kita SUDAH punya sesi aktif?
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // User sudah login (aman)
        if(mounted) setVerifying(false);
        return;
      }

      // 3. Jika tidak ada sesi DAN tidak ada token di URL -> Error
      if (!hasToken) {
        if(mounted) {
            setErrorMsg("Link tidak valid atau URL rusak.");
            setVerifying(false);
        }
        return;
      }

      // 4. Jika ada Token, kita tunggu Supabase memprosesnya.
      // Kita pasang listener.
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Auth Event: ${event}`);

        // Event: PASSWORD_RECOVERY -> Supabase mendeteksi ini flow reset password
        // Event: SIGNED_IN -> Token berhasil ditukar jadi sesi
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          if (mounted) {
             setVerifying(false); // Hore! Form boleh muncul
             setErrorMsg(null);
          }
        }
        
        // Event: SIGNED_OUT -> Abaikan saja jika kita sedang menunggu proses token
      });

      // 5. Timeout Safety (Jaga-jaga jika Supabase macet)
      // Jika dalam 5 detik tidak ada hasil, tampilkan error manual.
      setTimeout(async () => {
        if (mounted) {
            // Cek sekali lagi
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (!retrySession && verifying) {
                setErrorMsg("Waktu verifikasi habis atau link kadaluarsa.");
                setVerifying(false);
            }
        }
      }, 5000); // Beri waktu 5 detik

      return () => {
        subscription.unsubscribe();
      };
    };

    initRecovery();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array agar hanya jalan sekali saat mount

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
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password berhasil diperbarui! Mengarahkan ke login...');
      
      // Logout bersih & redirect
      await supabase.auth.signOut();
      setTimeout(() => {
          navigate('/login');
      }, 1500);

    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error('Gagal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER STATES ---

  // 1. Sedang Memverifikasi Link
  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h3 className="font-medium text-lg">Memverifikasi Link...</h3>
        <p className="text-sm text-muted-foreground">Mohon tunggu sebentar, jangan tutup halaman ini.</p>
      </div>
    );
  }

  // 2. Jika Error (Link Basi / Invalid)
  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200 border">
            <CardHeader className="text-center">
                <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Akses Ditolak</CardTitle>
                <CardDescription>{errorMsg}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className="w-full" onClick={() => navigate('/login')}>
                    Kembali ke Halaman Login
                </Button>
            </CardFooter>
        </Card>
      </div>
    );
  }

  // 3. Form Utama (Sukses)
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
