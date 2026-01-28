"use server";

import { db } from "@/lib/db";

export async function getUserByEmail(email: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    return user;
  } catch (error) {
    return null;
  }
}

export const getUserById = async (id?: string) => {
  if (!id) {
    return null;
  }

  try {
    const userFound = await db.user.findUnique({
      where: {
        id,
      },
    });

    return userFound;
  } catch (error) {
    return null;
  }
};
