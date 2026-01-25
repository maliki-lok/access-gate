import { useState } from 'react';
// import { useNavigate } from 'react-router-dom'; // Tidak diperlukan lagi karena navigasi ada di Sidebar
// import { useAuth } from '@/contexts/AuthContext'; // Info user sudah ditangani oleh Layout
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Key, FileSpreadsheet, Settings } from 'lucide-react'; // Tambah icon Settings

// Import Layout
import { TestPageLayout } from '@/components/TestPageLayout';

// Import Komponen (Tetap sama)
import { EmployeeManagement } from '@/components/admin/EmployeeManagement';
import { UserManagement } from '@/components/admin/UserManagement'; // Pastikan import ini sesuai (named/default)
import { RoleManagement } from '@/components/admin/RoleManagement';
import { PermissionManagement } from '@/components/admin/PermissionManagement';

export default function AdminPage() {
  // const navigate = useNavigate(); 
  // const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');

  return (
    <TestPageLayout
      title="Admin Panel"
      description="Pusat manajemen data pegawai, user, role, dan hak akses aplikasi."
      icon={<Settings className="w-6 h-6" />}
      permissionCode="access_admin"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="employees" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Permissions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionManagement />
          </TabsContent>
        </Tabs>

      </div>
    </TestPageLayout>
  );
}