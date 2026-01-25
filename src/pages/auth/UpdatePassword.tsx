import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, AlertCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook untuk baca ?otp=...&email=...
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const performManualVerification = async () => {
      // 1. Cek apakah sudah login (misal refresh halaman setelah verifikasi sukses)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if(mounted) {
            setIsAuthenticated(true);
            setIsVerifying(false);
        }
        return;
      }

      // 2. Ambil parameter OTP dan Email dari Link WhatsApp
      const otp = searchParams.get('otp');
      const email = searchParams.get('email');

      if (!otp || !email) {
        // Cek error dari hash url (sisa-sisa cara lama)
        const hash = window.location.hash;
        if (hash.includes('error_code=otp_expired')) {
            if(mounted) {
                setErrorMessage("Link kadaluarsa (OTP Expired). Mohon minta link baru.");
                setIsVerifying(false);
            }
            return;
        }

        if(mounted) {
            setErrorMessage("Link tidak valid (Data tidak lengkap).");
            setIsVerifying(false);
        }
        return;
      }

      // 3. Lakukan Verifikasi Manual (Tukar OTP jadi Session)
      // Ini kebal terhadap "Link Preview" karena ini POST request, bukan GET visit biasa.
      try {
        const { error } = await supabase.auth.verifyOtp({
            email: email,
            token: otp,
            type: 'recovery'
        });

        if (error) throw error;

        // Sukses!
        if (mounted) {
            setIsAuthenticated(true);
            setIsVerifying(false);
            console.log("Verifikasi OTP Sukses");
        }

      } catch (error: any) {
        console.error("Verifikasi Gagal:", error);
        if (mounted) {
            setErrorMessage(error.message || "Gagal memverifikasi kode.");
            setIsVerifying(false);
        }
      }
    };

    performManualVerification();

    return () => { mounted = false; };
  }, [searchParams]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password minimal 6 karakter');
    if (password !== confirmPassword) return toast.error('Konfirmasi password tidak cocok');

    setLoadingSubmit(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;

      toast.success('Password berhasil diperbarui!');
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      toast.error('Gagal update: ' + error.message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // --- RENDER ---
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Memverifikasi kode keamanan...</p>
      </div>
    );
  }

  if (errorMessage && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md border-red-200">
            <CardHeader className="text-center">
                <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-600">Akses Ditolak</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button className="w-full" variant="outline" onClick={() => navigate('/login')}>Kembali ke Login</Button>
            </CardFooter>
        </Card>
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
          <CardTitle>Password Baru</CardTitle>
          <CardDescription>Silakan masukkan password baru Anda.</CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Password Baru</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Ulangi Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loadingSubmit}>
              {loadingSubmit && <Loader2 className="mr-2 animate-spin" />} Simpan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
