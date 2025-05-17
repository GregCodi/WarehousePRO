import { User, roles } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "./storage";

// JWT secret key - in production, this would be an environment variable
const JWT_SECRET = "warehouse-management-secret-key";
const JWT_EXPIRES_IN = "24h";

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  // Compare the provided password with the stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  return user;
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Express middleware to authenticate JWT token
export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  const token = authHeader.split(" ")[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

// Role-based access control middleware
export function authorizeRoles(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await storage.getUser(req.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (allowedRoles.includes(user.role)) {
        req.user = user;
        next();
      } else {
        res.status(403).json({ message: "Access denied: insufficient permissions" });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Middleware to check if the user is admin
export const isAdmin = authorizeRoles(roles.ADMIN);

// Middleware to check if the user is admin or manager
export const isAdminOrManager = authorizeRoles(roles.ADMIN, roles.MANAGER);

// Middleware to check if the user is any authenticated user (admin, manager, or worker)
export const isAuthenticated = authorizeRoles(roles.ADMIN, roles.MANAGER, roles.WORKER);

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      userId: number;
      user?: User;
    }
  }
}
