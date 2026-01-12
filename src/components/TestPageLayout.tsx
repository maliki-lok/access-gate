import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Key, 
  CheckCircle,
  Menu,
  X,
  Settings,
  Building2,
  Users,
  ClipboardList,
  BarChart3,
  Mail,
  Briefcase,
  TrendingUp,
  FileText,
  LogOut,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- DEFINISI MENU (Harus sinkron dengan Dashboard) ---
// Menu ini digunakan untuk merender sidebar
const menuItems = [
  { path: '/admin', permission: 'access_admin', label: 'Admin Panel', icon: Settings },
  { path: '/test/kabapas', permission: 'access_kabapas', label: 'Kabapas', icon: Building2 },
  { path: '/test/kasubsie', permission: 'access_kasubsie', label: 'Kasubsie', icon: Users },
  { path: '/test/operator-registrasi', permission: 'access_operator_registrasi', label: 'Operator Registrasi', icon: ClipboardList },
  { path: '/test/anev', permission: 'access_anev', label: 'Anev', icon: BarChart3 },
  { path: '/test/pk', permission: 'access_pk', label: 'PK', icon: User },
  { path: '/test/persuratan', permission: 'access_persuratan', label: 'Persuratan', icon: Mail },
  { path: '/test/bimker', permission: 'access_bimker', label: 'Bimker', icon: Briefcase },
  { path: '/test/bimkemas', permission: 'access_bimkemas', label: 'Bimkemas', icon: Users },
  { path: '/test/tpp', permission: 'access_tpp', label: 'TPP', icon: TrendingUp },
  { path: '/test/laporan', permission: 'access_laporan', label: 'Laporan', icon: FileText },
];

interface TestPageLayoutProps {
  title: string;
  description: string;
  permissionCode: string;
  icon: React.ReactNode;
}

export function TestPageLayout({ title, description, permissionCode, icon }: TestPageLayoutProps) {
  const { user, hasPermission, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Cek Permission Halaman Ini
  const hasAccess = hasPermission(permissionCode);

  // 2. Cek Permission Menu Sidebar (Filter menu yang boleh dilihat)
  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));
  
  // Helper foto
  // @ts-ignore
  const fotoUrl = user?.employee?.foto_url;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // --- KOMPONEN SIDEBAR ---
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Header Sidebar */}
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
          <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-lg font-bold text-slate-800">MONALISA</span>
      </div>

      {/* List Menu (Scrollable) */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
          Navigasi Utama
        </div>
        
        {/* Tombol Dashboard - Selalu Muncul */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start mb-1",
            location.pathname === '/dashboard' ? "bg-slate-100 text-primary font-medium" : "text-slate-600 hover:text-primary hover:bg-slate-50"
          )}
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-5 h-5 mr-3 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          </div>
          Dashboard
        </Button>

        {/* Menu Dinamis Berdasarkan Permission */}
        {accessibleMenus.length > 0 && (
           <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 mb-2 px-3">
             Menu Aplikasi
           </div>
        )}
        
        {accessibleMenus.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start mb-1",
                isActive ? "bg-slate-100 text-primary font-medium" : "text-slate-600 hover:text-primary hover:bg-slate-50"
              )}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
            >
              <Icon className={cn("w-5 h-5 mr-3", isActive ? "text-primary" : "text-slate-500")} />
              {item.label}
            </Button>
          );
        })}
      </div>

      {/* Footer Sidebar (User Profile) */}
      <div className="p-4 border-t bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
             {fotoUrl ? (
                <img src={fotoUrl} alt="User" className="w-full h-full object-cover" />
             ) : (
                <User className="w-6 h-6 m-2 text-slate-400" />
             )}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.employee.nama}</p>
            <p className="text-xs text-slate-500 truncate">{user?.employee.jabatan || 'User'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      
      {/* --- SIDEBAR DESKTOP (Fixed) --- */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* --- SIDEBAR MOBILE (Overlay) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white animate-in slide-in-from-left duration-300 shadow-2xl">
             <div className="relative h-full flex flex-col">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4 z-50 hover:bg-slate-100" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Mobile Header (Navbar) */}
        <header className="md:hidden bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
               <Menu className="w-5 h-5 text-slate-700" />
             </Button>
             <span className="font-semibold text-lg tracking-tight text-slate-800">MONALISA</span>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full space-y-6">
          
          {/* 1. Tombol Kembali ke Dashboard */}
          <div>
            <Button 
              variant="outline" 
              className="group bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Dashboard
            </Button>
          </div>

          {/* 2. Judul Halaman & Status Permission */}
          <Card className={cn(
              "border-0 shadow-md overflow-hidden transition-all duration-500",
              !hasAccess ? "ring-2 ring-red-500/20" : ""
            )}>
            <div className={cn("h-1.5 w-full", hasAccess ? "bg-primary" : "bg-red-500")}></div>
            <CardHeader className="bg-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    hasAccess ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"
                  )}>
                  {hasAccess ? icon : <Lock className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                    {title}
                    {!hasAccess && <span className="text-sm font-normal text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Akses Ditolak</span>}
                  </CardTitle>
                  <CardDescription className="mt-1 text-slate-500">{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="bg-slate-50/50 border-t border-slate-100 py-3">
              <div className="flex items-center gap-2 text-sm">
                {hasAccess ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-slate-600 font-medium">Permission Required:</span>
                <Badge 
                  variant={hasAccess ? 'default' : 'destructive'} 
                  className={cn("font-mono text-xs tracking-wide", !hasAccess && "animate-pulse")}
                >
                  {permissionCode}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 3. Alert Jika Akses Ditolak (Side menu tetap ada, tapi konten utama memberi peringatan) */}
          {!hasAccess && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 shadow-sm">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Anda tidak memiliki izin!</AlertTitle>
              <AlertDescription>
                Akun Anda tidak memiliki permission <code>{permissionCode}</code> yang diperlukan untuk mengakses fitur ini.
                Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
              </AlertDescription>
            </Alert>
          )}

          {/* 4. Debug Info Card (Selalu muncul untuk tujuan testing/debug RBAC) */}
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/30">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                <User className="w-5 h-5 text-slate-500" />
                Informasi Pengguna (Debug RBAC)
              </CardTitle>
              <CardDescription>
                Data ini ditampilkan untuk memverifikasi role dan permission Anda saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Employee Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Nama Pegawai</span>
                    <p className="font-medium text-slate-900 truncate">{user?.employee.nama}</p>
                 </div>
                 <div className="p-3 bg-slate-50 rounded border border-slate-100">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Jabatan</span>
                    <p className="font-medium text-slate-900 truncate">{user?.employee.jabatan || '-'}</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Roles */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <Shield className="w-4 h-4 text-primary" />
                    Roles Aktif
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 min-h-[100px]">
                    <div className="flex flex-wrap gap-2">
                      {user?.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="bg-white border-slate-200 text-slate-700">
                          {role}
                        </Badge>
                      ))}
                      {user?.roles.length === 0 && (
                        <span className="text-sm text-slate-400 italic">Tidak ada role yang ditetapkan.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <Key className="w-4 h-4 text-primary" />
                    Permissions Dimiliki
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 min-h-[100px]">
                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                      {user?.permissions.map((permission) => (
                        <Badge 
                          key={permission} 
                          variant="outline"
                          className={cn(
                            "text-xs font-normal transition-colors",
                            permission === permissionCode 
                              ? "bg-green-100 text-green-700 border-green-300 font-semibold shadow-sm" 
                              : "bg-white text-slate-500 border-slate-200"
                          )}
                        >
                          {permission}
                          {permission === permissionCode && ' ✓'}
                        </Badge>
                      ))}
                      {user?.permissions.length === 0 && (
                        <span className="text-sm text-slate-400 italic">Tidak ada permission khusus.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
