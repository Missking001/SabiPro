import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — SabiPro',
  description: 'Your SabiPro dashboard. Search providers, browse services, and manage your inquiries.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
