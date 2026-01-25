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
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // 1. Cek apakah ada Hash di URL (tanda token ada)
    const hash = window.location.hash;
    
    // Listener untuk menangkap event login/recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event); // Debugging
      
      if (event === 'PASSWORD_RECOVERY') {
        // Berhasil mendeteksi mode recovery
        setCheckingSession(false);
      } else if (event === 'SIGNED_IN') {
        // User berhasil login otomatis lewat link
        setCheckingSession(false);
      }
    });

    // Fallback: Jika dalam 3 detik tidak ada event, cek manual
    const timeout = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && !hash.includes('access_token')) {
             toast.error("Link tidak valid atau sesi kadaluarsa.");
             // navigate('/login'); // Optional: redirect atau biarkan user lihat error
        }
        setCheckingSession(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
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
      // Update password user yang sedang login
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.success('Password berhasil diperbarui! Silakan login.');
      
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Memverifikasi link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Atur Password Baru</CardTitle>
          <CardDescription>
            Masukkan password baru untuk mengamankan akun Anda.
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
            {/* Hapus tombol batal agar user fokus reset */}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}