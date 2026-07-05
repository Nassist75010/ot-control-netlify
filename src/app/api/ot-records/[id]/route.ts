import { NextResponse } from "next/server";
import { OtStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type LostItemWithAudit = Prisma.LostItemRecordGetPayload<{ include: { auditLogs: true } }>;

function toClient(record: LostItemWithAudit) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    foundDate: record.foundDate.toISOString().slice(0, 10),
    documents: Array.isArray(record.documents) ? record.documents : [],
    items: Array.isArray(record.items) ? record.items : [],
    photos: Array.isArray(record.photos) ? record.photos : [],
    audit: record.auditLogs.map((log) => ({
      at: log.createdAt.toISOString(),
      action: log.action,
      user: log.userName
    }))
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status?: OtStatus; auditAction?: string; obotoNumber?: string; closingReason?: string };
  const record = await prisma.lostItemRecord.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.obotoNumber !== undefined ? { obotoNumber: body.obotoNumber || null } : {}),
      ...(body.closingReason !== undefined ? { closingReason: body.closingReason || null } : {}),
      auditLogs: body.auditAction
        ? {
            create: {
              action: body.auditAction,
              userName: "RDE connecté"
            }
          }
        : undefined
    },
    include: { auditLogs: { orderBy: { createdAt: "desc" } } }
  });
  return NextResponse.json(toClient(record));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.lostItemRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
