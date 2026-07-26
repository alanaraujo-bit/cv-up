import "server-only";

import { del, get, put } from "@vercel/blob";

import { env } from "@/lib/env";

/**
 * Object storage for user uploads.
 *
 * Everything is written to a **private** store: these are photographs of the
 * user's clients, so there is no public URL anywhere. Reads go through an
 * ownership-checked route handler which streams the object back.
 *
 * The surface is intentionally tiny so swapping Vercel Blob for S3/R2 later is
 * one file.
 */

const token = env.BLOB_READ_WRITE_TOKEN;

export async function putPrivateObject(
  pathname: string,
  body: Buffer,
  contentType: string,
): Promise<{ pathname: string }> {
  const result = await put(pathname, body, {
    access: "private",
    contentType,
    // Prevents one upload from silently overwriting another.
    addRandomSuffix: true,
    token,
  });

  return { pathname: result.pathname };
}

export async function getPrivateObject(pathname: string) {
  return get(pathname, { access: "private", token });
}

export async function deletePrivateObject(pathname: string): Promise<void> {
  try {
    await del(pathname, { token });
  } catch {
    // A missing object is the desired end state; never fail the request for it.
  }
}
