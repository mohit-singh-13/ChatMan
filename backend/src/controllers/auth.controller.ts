import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Payload } from "../types";

export const login = async (req: Request, res: Response) => {
  const LoginSchema = z.object({
    email: z.email({ error: "Invalid Email ID" }),
    password: z.string(),
  });

  const parsedBody = LoginSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0].message,
    });
    return;
  }

  const { email, password } = parsedBody.data;
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    if (!bcrypt.compareSync(password, user.password)) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const payload: Payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
      },
    });
  } catch (err) {
    console.log("Error login :", err);

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

export const signup = async (req: Request, res: Response) => {
  const SignupSchema = z.object({
    name: z.string().min(1, { error: "Name is required" }),
    email: z.email({ error: "Invalid Email ID" }),
    password: z
      .string()
      .min(6, { error: "Password must be at least 6 characters" }),
  });

  const parsedBody = SignupSchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      success: false,
      message: parsedBody.error.issues[0].message,
    });
    return;
  }

  const { name, email, password } = parsedBody.data;
  const prisma = new PrismaClient();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email already registered",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: {
        token,
      },
    });
  } catch (err) {
    console.log("Error signup :", err);

    if (err instanceof Error) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    await prisma.$disconnect();
  }
};
