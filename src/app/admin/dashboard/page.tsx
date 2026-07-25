import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { can, adminHomePath } from '@/lib/auth';
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

  // Dashboard menampilkan ringkasan booking — akun tanpa modul 'dashboard'
  // (mis. Content Admin blog-only) dialihkan ke halaman pertama yang memang
  // boleh diakses, TANPA memanggil dashboard.php sama sekali (endpoint itu
  // sekarang 403 tanpa modul ini, dan data=null di bawah akan melempar ke
  // /admin/login — bukan yang kita mau untuk akun yang sebenarnya sah).
  if (!can(session, 'dashboard', 'view')) {
    const home = adminHomePath(session);
    // home !== sini kecuali akun benar-benar tanpa modul apa pun
    // (mis-konfigurasi) — kalau begitu jangan redirect ke diri sendiri,
    // biarkan AdminLayoutClient yang membungkus halaman ini menunjukkan
    // sidebar kosong; render pesan sederhana saja di sini.
    if (home !== '/admin/dashboard') redirect(home);
    return (
      <div className="admin-page">
        <div className="alert alert-error">
          Akun ini belum diberi akses ke modul manapun. Hubungi Super Admin.
        </div>
      </div>
    );
  }

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
