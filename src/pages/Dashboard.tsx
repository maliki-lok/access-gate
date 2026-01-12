import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  User, 
  Shield, 
  Key, 
  Settings,
  FileText,
  Briefcase,
  BarChart3,
  Mail,
  Building2,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Definisi menu item
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

import { Users } from 'lucide-react'; // Import ulang Users karena dipakai di menuItems

export default function Dashboard() {
  const { user, signOut, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const accessibleMenus = menuItems.filter(item => hasPermission(item.permission));

  // @ts-ignore: Abaikan warning jika property foto_url belum ada
  const fotoUrl = user?.employee?.foto_url;

  // Komponen Sidebar Content (digunakan untuk Desktop dan Mobile)
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
          <img src="/favicon.ico" alt="Logo" className="w-5 h-5 object-contain" />
        </div>
        <span className="text-lg font-bold text-slate-800">MONALISA</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
          Menu Aplikasi
        </div>
        {accessibleMenus.length > 0 ? (
          accessibleMenus.map((item) => {
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
          })
        ) : (
          <div className="px-3 py-4 text-sm text-slate-500 text-center bg-slate-50 rounded-lg mx-2 border border-dashed">
            Tidak ada akses menu
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
             {fotoUrl ? (
                <img src={fotoUrl} alt="User" className="w-full h-full object-cover" />
             ) : (
                <User className="w-6 h-6 m-2 text-slate-400" />
             )}
          </div>
          <div className="overflow-hidden">
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white animate-in slide-in-from-left duration-300">
             <div className="relative h-full">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-4 z-50" 
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
                <SidebarContent />
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b h-16 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
               <Menu className="w-5 h-5" />
             </Button>
             <span className="font-semibold text-lg">MONALISA</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 space-y-8 max-w-5xl mx-auto w-full">
          
          {/* Welcome Message */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Selamat datang kembali di sistem manajemen.</p>
          </div>

          {/* User Profile Card (Updated Layout) */}
          <Card className="border-0 shadow-md overflow-hidden bg-white">
            <div className="h-32 bg-gradient-to-r from-primary/80 to-primary/40"></div>
            <CardHeader className="relative pb-0 pt-0 px-6 sm:px-8">
              <div className="-mt-16 mb-4 flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden flex items-center justify-center">
                  {fotoUrl ? (
                    <img src={fotoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-slate-300" />
                  )}
                </div>
                <div className="text-center sm:text-left pb-4 flex-1">
                  <h2 className="text-2xl font-bold text-slate-900">{user?.employee.nama}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-slate-500 mt-1">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Briefcase className="w-4 h-4" /> {user?.employee.nip}
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Building2 className="w-4 h-4" /> {user?.employee.unit_kerja || 'Unit Kerja'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="px-6 sm:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Roles Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-slate-900">Role Akses</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user?.roles.map((role) => (
                      <Badge key={role} className="px-3 py-1 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 shadow-none">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Permissions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <div className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-slate-900">Permission</h3>
                    </div>
                    <Badge variant="outline" className="font-normal text-xs">
                      {user?.permissions.length} items
                    </Badge>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-[200px] overflow-y-auto custom-scrollbar">
                    <div className="flex flex-wrap gap-2">
                      {user?.permissions && user.permissions.length > 0 ? (
                        user.permissions.map((permission) => (
                          <div key={permission} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-600">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {permission.replace(/_/g, ' ')}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">Tidak ada permission.</span>
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
