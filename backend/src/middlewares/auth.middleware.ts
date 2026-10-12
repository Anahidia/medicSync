import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUser, checkPermission, ROLE_PERMISSIONS } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'medisync_super_secret_jwt_key_2026_clinic_secure';
const COOKIE_NAME = 'medisync_session';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token =
    req.cookies?.[COOKIE_NAME] ||
    req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch {
      // Token inválido o vencido
      req.user = undefined;
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'No autorizado. Se requiere iniciar sesión.' });
  }
  next();
}

export function requirePermission(permission: keyof (typeof ROLE_PERMISSIONS)['ADMIN']) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const hasPerm = checkPermission(req.user.role, permission);
    if (!hasPerm) {
      return res.status(403).json({
        error: `ACCESO DENEGADO: El rol ${req.user.role} no tiene permisos para esta operación.`,
      });
    }
    next();
  };
}
