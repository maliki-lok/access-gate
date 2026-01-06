import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Search, Plus, UserCheck, UserX, Upload } from 'lucide-react';
import type { Employee } from '@/types/auth';

interface EmployeeWithUser extends Employee {
  has_user: boolean;
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<EmployeeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ nip: '', nama: '', jabatan: '', unit_kerja: '', email: '' });
  const [isAdding, setIsAdding] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      // Get all employees
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('nama');

      if (empError) throw empError;

      // Get all users to check which employees have accounts
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('employee_id');

      if (usersError) throw usersError;

      const userEmployeeIds = new Set(usersData?.map(u => u.employee_id) || []);

      const employeesWithUsers: EmployeeWithUser[] = (employeesData || []).map(emp => ({
        ...emp,
        has_user: userEmployeeIds.has(emp.id),
      }));

      setEmployees(employeesWithUsers);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Gagal memuat data employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployee.nip || !newEmployee.nama) {
      toast.error('NIP dan Nama wajib diisi');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('employees')
        .insert({
          nip: newEmployee.nip,
          nama: newEmployee.nama,
          jabatan: newEmployee.jabatan || null,
          unit_kerja: newEmployee.unit_kerja || null,
          email: newEmployee.email || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('NIP sudah terdaftar');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Employee berhasil ditambahkan');
      setShowAddDialog(false);
      setNewEmployee({ nip: '', nama: '', jabatan: '', unit_kerja: '', email: '' });
      fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Gagal menambahkan employee');
    } finally {
      setIsAdding(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nip.includes(searchTerm) ||
    emp.jabatan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.unit_kerja?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Manajemen Employee</CardTitle>
            <CardDescription>
              Kelola data pegawai (single source of truth)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Employee</DialogTitle>
                  <DialogDescription>
                    Tambahkan data pegawai baru
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP *</Label>
                    <Input
                      id="nip"
                      value={newEmployee.nip}
                      onChange={(e) => setNewEmployee({ ...newEmployee, nip: e.target.value })}
                      placeholder="Masukkan NIP"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama *</Label>
                    <Input
                      id="nama"
                      value={newEmployee.nama}
                      onChange={(e) => setNewEmployee({ ...newEmployee, nama: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jabatan">Jabatan</Label>
                    <Input
                      id="jabatan"
                      value={newEmployee.jabatan}
                      onChange={(e) => setNewEmployee({ ...newEmployee, jabatan: e.target.value })}
                      placeholder="Masukkan jabatan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_kerja">Unit Kerja</Label>
                    <Input
                      id="unit_kerja"
                      value={newEmployee.unit_kerja}
                      onChange={(e) => setNewEmployee({ ...newEmployee, unit_kerja: e.target.value })}
                      placeholder="Masukkan unit kerja"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (untuk login)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddEmployee} disabled={isAdding}>
                    {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Cari berdasarkan NIP, nama, jabatan, atau unit kerja..."
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
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Unit Kerja</TableHead>
                  <TableHead>Status Akun</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Tidak ada employee yang cocok' : 'Belum ada data employee'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-mono">{employee.nip}</TableCell>
                      <TableCell className="font-medium">{employee.nama}</TableCell>
                      <TableCell>{employee.jabatan || '-'}</TableCell>
                      <TableCell>{employee.unit_kerja || '-'}</TableCell>
                      <TableCell>
                        {employee.has_user ? (
                          <Badge variant="default" className="gap-1">
                            <UserCheck className="w-3 h-3" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <UserX className="w-3 h-3" />
                            Belum Punya Akun
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Total: {filteredEmployees.length} employee
        </div>
      </CardContent>
    </Card>
  );
}
