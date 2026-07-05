import { NextResponse } from "next/server";
import { OtStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type OtPayload = {
  deposant: string;
  agentName: string;
  service: string;
  email?: string;
  lieu: string;
  trainRef?: string;
  trainOperator?: string;
  trainNumber?: string;
  destination?: string;
  departureTime?: string;
  platform?: string;
  carNumber?: string;
  seatNumber?: string;
  foundDate: string;
  objectType: string;
  category: string;
  colorState: string;
  brand?: string;
  description: string;
  items?: Array<{
    name: string;
    color?: string;
    brand?: string;
    quantity?: string;
    notes?: string;
  }>;
  documents: string[];
  documentName?: string;
  hasMoney: boolean;
  moneyAmount?: string;
  photos: string[];
  sigDeposant: string;
  sigRde: string;
  obotoNumber?: string;
  status: OtStatus;
  closingReason?: string;
};

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

async function nextOtNumber() {
  const year = new Date().getFullYear();
  const latest = await prisma.lostItemRecord.findFirst({
    where: { id: { startsWith: `OT-${year}-` } },
    orderBy: { id: "desc" },
    select: { id: true }
  });
  const current = latest?.id.match(/^OT-\d{4}-(\d+)$/)?.[1];
  return `OT-${year}-${String((Number(current) || 0) + 1).padStart(4, "0")}`;
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const records = await prisma.lostItemRecord.findMany({
    include: { auditLogs: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
    take: 500
  });
  return NextResponse.json(records.map(toClient));
}

export async function POST(request: Request) {
  const body = (await request.json()) as OtPayload;
  if (!body.photos?.length) return badRequest("Photo obligatoire.");
  if (!body.sigDeposant || !body.sigRde) return badRequest("Les deux signatures sont obligatoires.");
  if (body.description.length > 6000) return badRequest("La description ne peut pas dépasser 6000 caractères.");
  if (!body.deposant || !body.agentName || !body.service || !body.lieu || !body.foundDate || !body.objectType || !body.category || !body.colorState) {
    return badRequest("Des champs obligatoires sont manquants.");
  }

  const id = await nextOtNumber();
  const record = await prisma.lostItemRecord.create({
    data: {
      id,
      deposant: body.deposant,
      agentName: body.agentName,
      service: body.service,
      email: body.email || null,
      lieu: body.lieu,
      trainRef: body.trainRef || null,
      trainOperator: body.trainOperator || null,
      trainNumber: body.trainNumber || null,
      destination: body.destination || null,
      departureTime: body.departureTime || null,
      platform: body.platform || null,
      carNumber: body.carNumber || null,
      seatNumber: body.seatNumber || null,
      foundDate: new Date(`${body.foundDate}T00:00:00.000Z`),
      objectType: body.objectType,
      category: body.category,
      colorState: body.colorState,
      brand: body.brand || null,
      description: body.description,
      items: body.items ?? [],
      documents: body.documents ?? [],
      documentName: body.documentName || null,
      hasMoney: body.hasMoney,
      moneyAmount: body.moneyAmount || null,
      photos: body.photos,
      sigDeposant: body.sigDeposant,
      sigRde: body.sigRde,
      obotoNumber: body.obotoNumber || null,
      status: body.status,
      closingReason: body.closingReason || null,
      auditLogs: {
        create: {
          action: "Création de la fiche",
          userName: "RDE connecté"
        }
      }
    },
    include: { auditLogs: { orderBy: { createdAt: "desc" } } }
  });

  return NextResponse.json(toClient(record), { status: 201 });
}
