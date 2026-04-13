import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../types";

type ActivateInput = {
  promoCode: string;
  email: string;
};

export const activatePromoCode = async ({ promoCode, email }: ActivateInput) => {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      {
        id: string;
        expires_at: Date;
        activation_limit: number;
      }[]
    >(
      Prisma.sql`SELECT id, "expiresAt" AS expires_at, "activationLimit" AS activation_limit
                 FROM "PromoCode"
                 WHERE code = ${promoCode}
                 FOR UPDATE`
    );

    if (rows.length === 0) {
      throw new ApiError(404, "PROMO_NOT_FOUND", "Promo code not found.");
    }

    const promo = rows[0];

    if (promo.expires_at.getTime() <= Date.now()) {
      throw new ApiError(409, "PROMO_EXPIRED", "Promo code has expired.");
    }

    const activationCount = await tx.activation.count({
      where: { promoCodeId: promo.id }
    });

    if (activationCount >= promo.activation_limit) {
      throw new ApiError(409, "PROMO_LIMIT_REACHED", "Promo code activation limit reached.");
    }

    try {
      const activation = await tx.activation.create({
        data: {
          promoCodeId: promo.id,
          email
        }
      });

      return activation;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ApiError(
          409,
          "PROMO_ALREADY_ACTIVATED",
          "Email has already activated this promo code."
        );
      }

      throw error;
    }
  });
};
