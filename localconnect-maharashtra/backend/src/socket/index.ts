import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { config } from '../config';

export function initSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as Socket & { userId: string }).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const authSocket = socket as Socket & { userId: string };
    authSocket.join(`user:${authSocket.userId}`);

    socket.on('join:conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('message:send', async (data: { conversationId: string; content: string; mediaUrl?: string }) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: {
            conversationId_userId: {
              conversationId: data.conversationId,
              userId: authSocket.userId,
            },
          },
        });
        if (!member) return;

        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: authSocket.userId,
            content: data.content,
            mediaUrl: data.mediaUrl,
          },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${data.conversationId}`).emit('message:new', message);

        const members = await prisma.conversationMember.findMany({
          where: { conversationId: data.conversationId, userId: { not: authSocket.userId } },
        });
        for (const m of members) {
          await prisma.notification.create({
            data: {
              userId: m.userId,
              type: 'MESSAGE',
              title: 'New message',
              body: data.content.slice(0, 100),
              link: `/messages/${data.conversationId}`,
            },
          });
          io.to(`user:${m.userId}`).emit('notification:new', { type: 'MESSAGE' });
        }
      } catch (err) {
        console.error('Socket message error:', err);
      }
    });

    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: authSocket.userId,
        conversationId,
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: authSocket.userId,
        conversationId,
      });
    });
  });

  return io;
}
