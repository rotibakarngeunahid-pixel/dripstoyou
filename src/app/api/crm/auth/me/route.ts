import { NextResponse } from 'next/server';
import { getCRMSession } from '@/lib/crm-session';
import { crmEffectiveModules } from '@/lib/crm-permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCRMSession();
    if (!session.staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      staff: {
        id: session.staffId,
        email: session.email,
        role: session.role,
        name: session.name,
        modules: session.modules?.length ? session.modules : crmEffectiveModules(session.role),
        isWebsiteAdmin: Boolean(session.isWebsiteAdmin),
      },
    });
  } catch (error) {
    console.error('[crm auth/me]', error);
    return NextResponse.json({ error: 'CRM session is not configured.' }, { status: 503 });
  }
}
