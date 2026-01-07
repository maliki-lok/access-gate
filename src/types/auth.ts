// RBAC Types for the application

export interface Employee {
  id: string;
  nip: string;
  nama: string;
  nama_gelar: string | null;
  nik: string | null;
  jenis_kelamin: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  agama: string | null;
  pangkat_golongan: string | null;
  tmt_pangkat: string | null;
  jabatan: string | null;
  jenis_jabatan: string | null;
  tmt_jabatan: string | null;
  pendidikan: string | null;
  jurusan_pendidikan: string | null;
  unit_kerja: string | null;
  alamat: string | null;
  telepon: string | null;
  telepon_khusus: string | null;
  email: string | null;
  foto_url: string | null;
  foto_thumbnail: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  employee_id: string;
  created_at: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at: string;
}

// Auth context types
export interface AuthUser {
  id: string;
  employee: Employee;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (nip: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}
