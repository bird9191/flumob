import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "./prisma";
import { activatePromoCode } from "./services/promoService";
import { ApiError } from "./types";

const app = express();

app.use(cors());
app.use(express.json());

const createPromoSchema = z.object({
  code: z.string().trim().min(1).max(64).transform((value) => value.toUpperCase()),
  discountPercent: z.number().int().min(1).max(100),
  activationLimit: z.number().int().min(1),
  expiresAt: z.coerce.date()
});

const activationSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  promoCode: z.string().trim().min(1).max(64).transform((value) => value.toUpperCase())
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/promocodes", async (req, res, next) => {
  try {
    const payload = createPromoSchema.parse(req.body);

    if (payload.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "expiresAt must be in the future."
      });
    }

    const promoCode = await prisma.promoCode.create({
      data: payload
    });

    return res.status(201).json(promoCode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        issues: error.issues
      });
    }

    return next(error);
  }
});

app.get("/promocodes", async (_req, res, next) => {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            activations: true
          }
        }
      }
    });

    return res.json(promoCodes);
  } catch (error) {
    return next(error);
  }
});

app.get("/promocodes/:code", async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
      include: {
        _count: {
          select: {
            activations: true
          }
        }
      }
    });

    if (!promoCode) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    return res.json(promoCode);
  } catch (error) {
    return next(error);
  }
});

app.post("/activations", async (req, res, next) => {
  try {
    const payload = activationSchema.parse(req.body);
    const activation = await activatePromoCode(payload);

    return res.status(201).json(activation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        issues: error.issues
      });
    }

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message
      });
    }

    return next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({
    message: "Internal server error."
  });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`API started on port ${port}`);
});
