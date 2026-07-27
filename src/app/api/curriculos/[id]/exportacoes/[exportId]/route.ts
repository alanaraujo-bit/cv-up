import { NextResponse, type NextRequest } from "next/server";

import { getExport } from "@/features/export/service";
import { requireUserId } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The status of one export, polled by the editor while it renders. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ exportId: string }> },
) {
  const userId = await requireUserId();
  const { exportId } = await params;

  const record = await getExport(userId, exportId);
  if (!record) return new NextResponse(null, { status: 404 });

  return NextResponse.json(
    {
      id: record.id,
      status: record.status,
      pageCount: record.pageCount,
      error: record.error,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
