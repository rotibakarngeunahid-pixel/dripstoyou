import { prisma } from './prisma';
import { AuditAction } from '@prisma/client';
import { createHash } from 'crypto';

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.SESSION_SECRET ?? '')).digest('hex').slice(0, 16);
}

export async function auditLog(params: {
  actorAdminId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorAdminId:  params.actorAdminId ?? null,
        action:        params.action,
        entityType:    params.entityType ?? null,
        entityId:      params.entityId ?? null,
        metadataJson:  params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddressHash: params.ip ? hashIp(params.ip) : null,
        userAgentHash: params.userAgent ? createHash('sha256').update(params.userAgent).digest('hex').slice(0, 16) : null,
      },
    });
  } catch {
    // Never throw from audit — log to stderr but don't fail the request
    console.error('[audit] Failed to write audit log for action:', params.action);
  }
}
