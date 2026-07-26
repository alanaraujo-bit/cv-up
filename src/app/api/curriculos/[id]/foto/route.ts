import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";

import { getResumeForUser } from "@/features/resume/service";
import { db } from "@/server/db";
import { requireSession } from "@/server/session";
import {
  deletePrivateObject,
  getPrivateObject,
  putPrivateObject,
} from "@/server/storage";

/** sharp needs the Node runtime; it cannot run on the Edge. */
export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** Print at 300dpi never needs more than this for a resume headshot. */
const MAX_DIMENSION = 900;

type Params = { params: Promise<{ id: string }> };

/**
 * Photos are personal data belonging to the user's clients, so they are never
 * served from a public URL. Every read re-checks that the requester owns the
 * resume the photo belongs to.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await requireSession();
  const { id } = await params;

  const resume = await getResumeForUser(session.user.id, id);
  const photo = resume?.document.personal.photo;
  if (!photo) return new NextResponse(null, { status: 404 });

  const object = await getPrivateObject(photo.pathname);
  if (!object) return new NextResponse(null, { status: 404 });

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": object.headers.get("content-type") ?? "image/webp",
      // Private: a shared cache must never hold someone's photograph.
      "Cache-Control": "private, max-age=300, must-revalidate",
    },
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireSession();
  const { id } = await params;

  const resume = await getResumeForUser(session.user.id, id);
  if (!resume)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (!ACCEPTED.includes(file.type)) {
    return NextResponse.json({ error: "unsupported_type" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  // Re-encoding through sharp also strips EXIF, which carries GPS coordinates
  // and camera serials the person did not intend to share.
  const input = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;
  let width: number;
  let height: number;

  try {
    const pipeline = sharp(input)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 88 });

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    processed = data;
    width = info.width;
    height = info.height;
  } catch {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  const stored = await putPrivateObject(
    `curriculos/${id}/foto.webp`,
    processed,
    "image/webp",
  );

  // Drop the replaced photo rather than retaining someone's face indefinitely.
  const previous = resume.document.personal.photo?.pathname;
  if (previous && previous !== stored.pathname) {
    await deletePrivateObject(previous);
  }

  return NextResponse.json({ pathname: stored.pathname, width, height });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await requireSession();
  const { id } = await params;

  const resume = await getResumeForUser(session.user.id, id);
  if (!resume)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const pathname = resume.document.personal.photo?.pathname;
  if (pathname) await deletePrivateObject(pathname);

  // Persist the removal immediately: the blob is already gone, so leaving the
  // reference behind would render a broken image after a reload.
  await db.resume.updateMany({
    where: { id, userId: session.user.id, deletedAt: null },
    data: {
      content: {
        ...resume.document,
        personal: { ...resume.document.personal, photo: null },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
