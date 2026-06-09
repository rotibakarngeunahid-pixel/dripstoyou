import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import DashboardClient from './DashboardClient';

interface RecentBooking {
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_last4: string;
  booking_date: string;
  booking_time: string;
  location_type: string;
  service_area_name: string | null;
  status: string;
  product_name: string;
}

interface DashboardData {
  totalBookings: number;
  pendingBookings: number;
  todayBookings: number;
  monthBookings: number;
  previousMonthBookings: number;
  recentBookings: RecentBooking[];
}

async function getDashboardData(token: string): Promise<DashboardData | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dashboard.php`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ login?: string }>;
}) {
  const session = await getSession();
  if (!session.adminId) redirect('/admin/login');
  const query = await searchParams;

  const data = await getDashboardData(session.adminToken);
  if (!data) redirect('/admin/login');

  return (
    <DashboardClient
      data={data}
      sessionName={session.name ?? ''}
      loginSuccess={query.login === 'success'}
    />
  );
}
