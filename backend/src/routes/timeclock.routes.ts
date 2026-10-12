import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/timeclock
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  try {
    const activeEntry = await prisma.timeClockEntry.findFirst({
      where: {
        userId: user.id,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    const recentEntries = await prisma.timeClockEntry.findMany({
      where: user.role === 'ADMIN' ? undefined : { userId: user.id },
      orderBy: { clockIn: 'desc' },
      take: 20,
      include: {
        user: {
          select: { id: true, name: true, role: true, specialty: true },
        },
      },
    });

    const activeStaff = await prisma.timeClockEntry.findMany({
      where: { clockOut: null },
      include: {
        user: { select: { id: true, name: true, role: true, specialty: true } },
      },
    });

    return res.json({
      isClockedIn: !!activeEntry,
      activeEntry,
      recentEntries,
      activeStaff,
    });
  } catch (error) {
    console.error('Error al consultar fichaje:', error);
    return res.status(500).json({ error: 'Error al consultar fichaje' });
  }
});

// POST /api/timeclock
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  try {
    const { action, shiftType, notes } = req.body;

    if (action === 'CLOCK_IN') {
      const existing = await prisma.timeClockEntry.findFirst({
        where: {
          userId: user.id,
          clockOut: null,
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Ya tienes una jornada iniciada sin registrar salida.' });
      }

      const newEntry = await prisma.timeClockEntry.create({
        data: {
          userId: user.id,
          clockIn: new Date(),
          shiftType: shiftType || 'CONSULTORIO',
          notes: notes ? notes.trim() : null,
          deviceOrIp: 'Estación MediSync Web',
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });

      return res.json({
        success: true,
        message: 'Fichaje de ENTRADA registrado con éxito.',
        entry: newEntry,
      });
    } else if (action === 'CLOCK_OUT') {
      const existing = await prisma.timeClockEntry.findFirst({
        where: {
          userId: user.id,
          clockOut: null,
        },
        orderBy: { clockIn: 'desc' },
      });

      if (!existing) {
        return res.status(400).json({ error: 'No tienes una jornada activa para registrar salida.' });
      }

      const now = new Date();
      const diffMs = now.getTime() - new Date(existing.clockIn).getTime();
      const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

      const updated = await prisma.timeClockEntry.update({
        where: { id: existing.id },
        data: {
          clockOut: now,
          durationHours: hours,
          notes: notes ? `${existing.notes ? existing.notes + ' | ' : ''}${notes.trim()}` : existing.notes,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });

      return res.json({
        success: true,
        message: `Fichaje de SALIDA registrado. Horas computadas: ${hours} hs.`,
        entry: updated,
      });
    } else {
      return res.status(400).json({ error: 'Acción no válida (use CLOCK_IN o CLOCK_OUT)' });
    }
  } catch (error) {
    console.error('Error al registrar fichada:', error);
    return res.status(500).json({ error: 'Error al procesar fichada de personal' });
  }
});

export default router;
