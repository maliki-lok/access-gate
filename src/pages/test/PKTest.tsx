import { TestPageLayout } from '@/components/TestPageLayout';
import { User } from 'lucide-react';

export default function PKTest() {
  return (
    <TestPageLayout
      title="Pembinaan Kepribadian"
      description="Fitur untuk pengelolaan program pembinaan kepribadian"
      permissionCode="access_pk"
      icon={<User className="w-8 h-8 text-primary" />}
    />
  );
}
