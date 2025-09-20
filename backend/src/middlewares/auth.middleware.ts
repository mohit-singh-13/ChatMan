import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Payload } from "../types";
import { PrismaClient } from "@prisma/client";

export const isUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "You're unauthorized",
    });
    return;
  }

  const prisma = new PrismaClient();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as Payload;
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "You're unauthorized",
      });
      return;
    }

    req.userId = user.id;
    next();
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "You're unauthorized",
    });
  } finally {
    await prisma.$disconnect();
  }
};
