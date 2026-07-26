import "server-only";

import { db } from "@/server/db";

import type { UpdateProfileValues } from "./schemas";

export interface ProfileView {
  name: string;
  email: string;
  image: string | null;
  displayName: string | null;
  headline: string | null;
  city: string | null;
  phone: string | null;
}

/** Reads the user plus their optional profile row as one view model. */
export async function getProfile(userId: string): Promise<ProfileView | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      profile: {
        select: {
          displayName: true,
          headline: true,
          city: true,
          phone: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    name: user.name,
    email: user.email,
    image: user.image,
    displayName: user.profile?.displayName ?? null,
    headline: user.profile?.headline ?? null,
    city: user.profile?.city ?? null,
    phone: user.profile?.phone ?? null,
  };
}

/**
 * The profile row is created on first save rather than at sign-up, so an
 * abandoned registration leaves nothing behind.
 */
export async function updateProfile(
  userId: string,
  values: UpdateProfileValues,
): Promise<void> {
  const { name, ...profile } = values;

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { name } }),
    db.profile.upsert({
      where: { userId },
      create: { userId, ...profile },
      update: profile,
    }),
  ]);
}
