import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  Shield, 
  Key, 
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Briefcase,
  BarChart3,
  Mail,
  Building2,
  ClipboardList,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

// Definisi menu item
const menuItems = [
  { path: '/admin', permission: 'access_admin', label: 'Admin Panel', icon: Settings, description: 'Kelola pengguna dan role' },
  { path: '/test/kabapas', permission: 'access_kabapas', label: 'Kabapas', icon: Building2, description: 'Kepala Balai Pemasyarakatan' },
  { path: '/test/kasubsie', permission: 'access_kasubsie', label: 'Kasubsie', icon: Users, description: 'Kepala Sub Seksi' },
  { path: '/test/operator-registrasi', permission: 'access_operator_registrasi', label: 'Operator Registrasi', icon: ClipboardList, description: 'Registrasi' },
  { path: '/test/anev', permission: 'access_anev', label: 'Anev', icon: BarChart3, description: 'Analisis & Evaluasi' },
  { path: '/test/pk', permission: 'access_pk', label: 'PK', icon: User, description: 'Pembimbing Kemasyarakatan' },
  { path: '/test/persuratan', permission: 'access_persuratan', label: 'Persuratan', icon: Mail, description: 'Manajemen Surat' },
  { path: '/test/bimker', permission: 'access_bimker', label: 'Bimker', icon: Briefcase, description: 'Bimbingan Kerja' },
  { path: '/test/bimkemas', permission: 'access_bimkemas', label: 'Bimkemas', icon: Users, description: 'Bimbingan Kemasyarakatan' },
  { path: '/test/tpp', permission: 'access_tpp', label: 'TPP', icon: TrendingUp, description: 'TPP' },
  { path: '/test/laporan', permission: 'access_laporan', label: 'Laporan', icon: FileText, description: 'Laporan' },
];

export default function Dashboard() {
  const { user, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));

  // Helper untuk mendapatkan URL foto dengan aman (untuk menghindari error TypeScript jika type belum diupdate)
  // @ts-ignore: Abaikan warning jika property foto_url belum ada di interface Employee
  const fotoUrl = user?.employee?.foto_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/favicon.ico" 
                  alt="Logo" 
                  className="w-6 h-6 object-contain" 
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold">MONALISA</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.employee.nama}</p>
                <p className="text-xs text-muted-foreground">{user?.employee.nip}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <Card className="mb-8 border-0 shadow-lg overflow-hidden">
          <CardHeader className="pb-6 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                
                {/* --- BAGIAN FOTO PROFIL --- */}
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20 overflow-hidden relative group">
                  {fotoUrl ? (
                    <img 
                      src={fotoUrl} 
                      alt={user?.employee.nama}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                      onError={(e) => {
                        // Fallback ke icon jika gambar error/link rusak
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('fallback-mode');
                        // Kita bisa memaksa menampilkan icon user lewat sibling selector atau state, 
                        // tapi cara termudah adalah membiarkan DOM di bawahnya (jika di-render kondisional)
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                {/* ------------------------- */}

                <div>
                  <CardTitle className="text-2xl font-bold text-slate-800">{user?.employee.nama}</CardTitle>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <Building2 className="w-3 h-3" />
                    <span className="text-sm font-medium">
                      {user?.employee.jabatan || 'Staff'} • {user?.employee.unit_kerja || 'Unit Kerja'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="font-mono text-[10px] tracking-wider text-slate-500">
                      NIP: {user?.employee.nip}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 pb-6 px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* KOLOM 1: Roles */}
              <div className="md:col-span-1 space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Assigned Roles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user?.roles.map((role) => (
                    <Badge key={role} variant="default" className="capitalize px-3 py-1 shadow-sm">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* KOLOM 2 & 3: Permissions */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between text-slate-700">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">System Permissions</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                    Total: {user?.permissions.length}
                  </span>
                </div>

                {/* Permission Box Container */}
                <div className="bg-slate-50/80 rounded-xl border border-dashed border-slate-200 p-4">
                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {user?.permissions && user.permissions.length > 0 ? (
                      user.permissions.map((permission) => (
                        <Badge 
                          key={permission} 
                          variant="outline" 
                          className="bg-white hover:bg-white text-slate-600 border-slate-200 font-normal text-xs py-1 px-2.5 transition-colors hover:border-primary/50 hover:text-primary"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1.5 opacity-50" />
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground italic w-full text-center py-2">
                        Tidak ada permission khusus.
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-slate-500" />
            Menu Akses
          </h2>
          {accessibleMenus.length === 0 ? (
            <Card className="border-dashed bg-slate-50/50">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Shield className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Akses Terbatas</h3>
                <p className="max-w-sm mx-auto">Akun Anda belum memiliki hak akses ke menu apapun. Silakan hubungi administrator.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {accessibleMenus.map((item) => {
                const Icon = item.icon;
                return (
                  <Card 
                    key={item.path} 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200 hover:border-primary/20"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-50 group-hover:bg-primary/5 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{item.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}