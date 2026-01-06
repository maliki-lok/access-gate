import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Shield, Key, CheckCircle } from 'lucide-react';

interface TestPageLayoutProps {
  title: string;
  description: string;
  permissionCode: string;
  icon: React.ReactNode;
}

export function TestPageLayout({ title, description, permissionCode, icon }: TestPageLayoutProps) {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  const hasAccess = hasPermission(permissionCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>

        {/* Page Header */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                {icon}
              </div>
              <div>
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription className="mt-1">{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-muted-foreground">Permission required:</span>
              <Badge variant={hasAccess ? 'default' : 'destructive'}>{permissionCode}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* User Info Debug Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Informasi Pengguna (Debug)
            </CardTitle>
            <CardDescription>
              Data ini ditampilkan untuk membuktikan RBAC bekerja dengan benar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Info */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Data Employee
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <span className="ml-2 font-medium">{user?.employee.nama}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">NIP:</span>
                  <span className="ml-2 font-medium">{user?.employee.nip}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Jabatan:</span>
                  <span className="ml-2 font-medium">{user?.employee.jabatan || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Unit Kerja:</span>
                  <span className="ml-2 font-medium">{user?.employee.unit_kerja || '-'}</span>
                </div>
              </div>
            </div>

            {/* Roles */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Roles Aktif
              </h4>
              <div className="flex flex-wrap gap-2">
                {user?.roles.map((role) => (
                  <Badge key={role} variant="default" className="capitalize">
                    {role}
                  </Badge>
                ))}
                {user?.roles.length === 0 && (
                  <span className="text-sm text-muted-foreground">Tidak ada role</span>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Permissions Aktif ({user?.permissions.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {user?.permissions.map((permission) => (
                  <Badge 
                    key={permission} 
                    variant={permission === permissionCode ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {permission}
                    {permission === permissionCode && ' ✓'}
                  </Badge>
                ))}
                {user?.permissions.length === 0 && (
                  <span className="text-sm text-muted-foreground">Tidak ada permission</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
