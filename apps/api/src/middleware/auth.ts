import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

const AUTH_SECRET = process.env.AUTH_SECRET || '';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as JwtPayload;
    request.user = decoded;
  } catch {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user || request.user.role !== 'ADMIN') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}

export async function optionalAuth(request: FastifyRequest) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as JwtPayload;
    request.user = decoded;
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
}
