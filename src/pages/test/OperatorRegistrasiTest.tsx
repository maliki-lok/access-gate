import { TestPageLayout } from '@/components/TestPageLayout';
import { ClipboardList } from 'lucide-react';

export default function OperatorRegistrasiTest() {
  return (
    <TestPageLayout
      title="Operator Registrasi"
      description="Fitur untuk operator registrasi narapidana dan tahanan"
      permissionCode="access_operator_registrasi"
      icon={<ClipboardList className="w-8 h-8 text-primary" />}
    />
  );
}
