import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, Plus, Shield, X, Key } from 'lucide-react';
import type { Employee, Role } from '@/types/auth';

interface UserWithDetails {
  id: string;
  employee_id: string;
  created_at: string;
  employee: Employee;
  roles: Role[];
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Create User
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [employeesWithoutUser, setEmployeesWithoutUser] = useState<Employee[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // State Change Password
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<UserWithDetails | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all users with their employee data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          employee_id,
          created_at,
          employees (*)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get all roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*');

      if (rolesError) throw rolesError;

      setAllRoles(rolesData || []);

      // Get user roles for each user
      const usersWithRoles: UserWithDetails[] = [];
      for (const user of usersData || []) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id);

        const roles = (rolesData || []).filter(r => 
          userRoles?.some(ur => ur.role_id === r.id)
        );

        usersWithRoles.push({
          id: user.id,
          employee_id: user.employee_id,
          created_at: user.created_at,
          employee: user.employees as unknown as Employee,
          roles,
        });
      }

      setUsers(usersWithRoles);

      // Get employees without user accounts
      const { data: allEmployees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('nama');

      if (empError) throw empError;

      const userEmployeeIds = new Set(usersData?.map(u => u.employee_id) || []);
      const available = (allEmployees || []).filter(emp => !userEmployeeIds.has(emp.id));
      setEmployeesWithoutUser(available);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async () => {
    if (!selectedEmployee || !password) {
      toast.error('Employee dan password wajib diisi');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsCreating(true);
    try {
      // Get employee email
      const employee = employeesWithoutUser.find(e => e.id === selectedEmployee);
      if (!employee?.email) {
        toast.error('Employee harus memiliki email untuk membuat akun');
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: employee.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            employee_id: selectedEmployee,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          employee_id: selectedEmployee,
        });

      if (userError) throw userError;

      // Assign roles
      if (selectedRoles.length > 0) {
        const roleAssignments = selectedRoles.map(roleId => ({
          user_id: authData.user!.id,
          role_id: roleId,
        }));

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(roleAssignments);

        if (roleError) throw roleError;
      }

      toast.success('User berhasil dibuat');
      setShowCreateDialog(false);
      setSelectedEmployee('');
      setPassword('');
      setSelectedRoles([]);
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Gagal membuat user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userToUpdate || !newPassword) return;
    if (newPassword.length < 6) {
        toast.error('Password minimal 6 karakter');
        return;
    }

    setIsUpdatingPassword(true);
    try {
        // Panggilan ke Edge Function untuk update password user lain
        // Pastikan Anda sudah deploy function 'admin-update-user'
        const { data, error } = await supabase.functions.invoke('admin-update-user', {
            body: {
                userId: userToUpdate.id,
                password: newPassword
            }
        });

        if (error) throw error;

        toast.success(`Password untuk ${userToUpdate.employee.nama} berhasil diubah`);
        setShowPasswordDialog(false);
        setNewPassword('');
        setUserToUpdate(null);
    } catch (error: any) {
        console.error('Error updating password:', error);
        toast.error('Gagal mengubah password. Pastikan Edge Function tersedia.');
    } finally {
        setIsUpdatingPassword(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;

      toast.success('Role berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Gagal menghapus role');
    }
  };

  const handleAddRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId });

      if (error) {
        if (error.code === '23505') {
          toast.error('User sudah memiliki role ini');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Role berhasil ditambahkan');
      fetchData();
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Gagal menambahkan role');
    }
  };

  const filteredUsers = users.filter(user =>
    user.employee.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee.nip.includes(searchTerm)
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Manajemen User</CardTitle>
            <CardDescription>
              Kelola akun aplikasi dan assign role
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button disabled={employeesWithoutUser.length === 0}>
                <Plus className="w-4 h-4 mr-2" />
                Buat User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat User Baru</DialogTitle>
                <DialogDescription>
                  Pilih employee dan buat akun aplikasi
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Pilih Employee *</Label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesWithoutUser.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.nama} ({emp.nip})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assign Roles (opsional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {allRoles.map(role => (
                      <Badge
                        key={role.id}
                        variant={selectedRoles.includes(role.id) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          if (selectedRoles.includes(role.id)) {
                            setSelectedRoles(selectedRoles.filter(r => r !== role.id));
                          } else {
                            setSelectedRoles([...selectedRoles, role.id]);
                          }
                        }}
                      >
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Buat User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari berdasarkan nama atau NIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Tambah Role</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada user yang cocok' : 'Belum ada user'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.employee.nama}</TableCell>
                      <TableCell className="font-mono">{user.employee.nip}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map(role => (
                            <Badge key={role.id} variant="default" className="gap-1">
                              {role.name}
                              <X
                                className="w-3 h-3 cursor-pointer hover:text-destructive"
                                onClick={() => handleRemoveRole(user.id, role.id)}
                              />
                            </Badge>
                          ))}
                          {user.roles.length === 0 && (
                            <span className="text-sm text-muted-foreground">Tidak ada role</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(roleId) => handleAddRole(user.id, roleId)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="+ Role" />
                          </SelectTrigger>
                          <SelectContent>
                            {allRoles
                              .filter(r => !user.roles.some(ur => ur.id === r.id))
                              .map(role => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                                setUserToUpdate(user);
                                setShowPasswordDialog(true);
                            }}
                            title="Ganti Password"
                        >
                            <Key className="w-4 h-4 text-amber-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Total: {filteredUsers.length} user • {employeesWithoutUser.length} employee belum punya akun
        </div>
      </CardContent>

      {/* Dialog Ganti Password */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Ganti Password User</DialogTitle>
                <DialogDescription>
                    Masukkan password baru untuk user <strong>{userToUpdate?.employee.nama}</strong>.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label>Password Baru</Label>
                    <Input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                    Batal
                </Button>
                <Button onClick={handleChangePassword} disabled={isUpdatingPassword}>
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan Password
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}