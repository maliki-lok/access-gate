import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, AlertCircle, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  nip: z.string().min(1, 'NIP harus diisi').regex(/^\d+$/, 'NIP hanya boleh berisi angka'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export default function Login() {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ nip?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // --- PERBAIKAN UTAMA: Navigasi Otomatis ---
  // Kita menunggu sampai variable 'user' benar-benar terisi, baru pindah halaman.
  // Ini mencegah kita ditendang balik oleh ProtectedRoute.
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // --- Fitur Darurat (Dev Only) ---
  const handleEmergencyRegister = async () => {
    if (!confirm("Buat akun Auth untuk 'admin@lapas.local'?")) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@lapas.local',
        password: '123456',
      });
      if (error) throw error;
      if (!data.user) throw new Error("Gagal membuat user auth.");
      alert(`Sukses! Akun Auth dibuat.\nEmail: admin@lapas.local\nPassword: 123456\n\nSekarang coba login.`);
    } catch (err: any) {
      alert("Info: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const result = loginSchema.safeParse({ nip, password });
    if (!result.success) {
      const errors: { nip?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'nip') errors.nip = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      });
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);

    const { error: signInError } = await signIn(nip, password);

    if (signInError) {
      setError(signInError);
      setIsLoading(false); // Stop loading jika error
    } 
    
    // CATATAN PENTING:
    // Jika sukses, kita JANGAN matikan isLoading dan JANGAN navigate manual.
    // Kita biarkan 'useEffect' di atas yang mendeteksi perubahan user lalu memindahkan halaman.
    // Jika data user valid, halaman akan pindah sendiri dalam hitungan milidetik.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <img 
              src="/favicon.ico" 
              alt="Logo" 
              className="w-8 h-8 text-primary" 
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Masuk dengan NIP dan password Anda
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                type="text"
                placeholder="Masukkan NIP"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                disabled={isLoading}
                className={validationErrors.nip ? 'border-destructive' : ''}
              />
              {validationErrors.nip && (
                <p className="text-sm text-destructive">{validationErrors.nip}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={validationErrors.password ? 'border-destructive' : ''}
              />
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </Button>

            <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Dev Area</span></div>
            </div>

            <Button 
                type="button" 
                variant="outline" 
                className="w-full border-dashed text-muted-foreground hover:text-primary"
                onClick={handleEmergencyRegister}
                disabled={isLoading}
            >
                <UserPlus className="mr-2 h-4 w-4" />
                (Dev Only) Buat Akun Demo
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo: NIP <code className="bg-muted px-1 rounded">198501012010011001</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
