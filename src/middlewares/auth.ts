import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth as betterAuth } from "../lib/auth";

export enum UserRole {
  STUDENT = "STUDENT",
  TUTOR = "TUTOR",
  ADMIN = "ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
        status: string;
      };
    }
  }
}

const auth = (...roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // get user session
      const session = await betterAuth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        return res.status(401).json({
          success: false,
          message: "You are not authorized!",
        });
      }

      if (!session.user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: "Email verification required. Please verfiy your email!",
        });
      }

      if (session.user.status !== UserStatus.ACTIVE) {
        return res.status(403).json({
          success: false,
          message: "Your account is not active. Please contact support.",
        });
      }

      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as string,
        emailVerified: session.user.emailVerified,
        status: session.user.status as string,
      };

      if (roles.length && !roles.includes(req.user.role as UserRole)) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden! You don't have permission to access this resources!",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
