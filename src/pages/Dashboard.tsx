import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TrendingUp
} from 'lucide-react';

const menuItems = [
  { path: '/admin', permission: 'access_admin', label: 'Admin Panel', icon: Settings, description: 'Kelola pengguna dan role' },
  { path: '/test/kabapas', permission: 'access_kabapas', label: 'Kabapas', icon: Building2, description: 'Kepala Lapas' },
  { path: '/test/kasubsie', permission: 'access_kasubsie', label: 'Kasubsie', icon: Users, description: 'Kepala Sub Seksi' },
  { path: '/test/operator-registrasi', permission: 'access_operator_registrasi', label: 'Operator Registrasi', icon: ClipboardList, description: 'Registrasi' },
  { path: '/test/anev', permission: 'access_anev', label: 'Anev', icon: BarChart3, description: 'Analisis & Evaluasi' },
  { path: '/test/pk', permission: 'access_pk', label: 'PK', icon: User, description: 'Pembinaan Kepribadian' },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">RBAC System</h1>
                <p className="text-xs text-muted-foreground">Role-Based Access Control</p>
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
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{user?.employee.nama}</CardTitle>
                  <CardDescription className="mt-1">
                    {user?.employee.jabatan || 'Staff'} • {user?.employee.unit_kerja || 'Unit Kerja'}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">NIP: {user?.employee.nip}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Roles */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Roles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {user?.roles.map((role) => (
                    <Badge key={role} variant="default" className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Permissions ({user?.permissions.length})</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {user?.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Menu yang Dapat Diakses</h2>
          {accessibleMenus.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Anda tidak memiliki akses ke menu manapun.</p>
                <p className="text-sm mt-2">Hubungi administrator untuk mendapatkan akses.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {accessibleMenus.map((item) => {
                const Icon = item.icon;
                return (
                  <Card 
                    key={item.path} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-0 shadow-md"
                    onClick={() => navigate(item.path)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
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
