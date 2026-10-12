import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/shifts
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const serviceArea = req.query.serviceArea as string;

  try {
    const whereClause: any = {};
    if (serviceArea && serviceArea !== 'all') {
      whereClause.serviceArea = serviceArea;
    }

    const shifts = await prisma.onCallShift.findMany({
      where: whereClause,
      orderBy: { startDateTime: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, role: true, specialty: true, licenseNumber: true },
        },
      },
    });

    const staff = await prisma.user.findMany({
      where: { role: { in: ['MEDICO', 'ENFERMERO', 'ADMIN'] }, active: true },
      select: { id: true, name: true, role: true, specialty: true },
      orderBy: { name: 'asc' },
    });

    return res.json({ shifts, staff });
  } catch (error) {
    console.error('Error al obtener guardias:', error);
    return res.status(500).json({ error: 'Error al consultar guardias' });
  }
});

// POST /api/shifts
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, serviceArea, startDateTime, endDateTime, notes } = req.body;

    if (!userId || !serviceArea || !startDateTime || !endDateTime) {
      return res.status(400).json({ error: 'Datos obligatorios de guardia incompletos' });
    }

    const shift = await prisma.onCallShift.create({
      data: {
        userId,
        serviceArea,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        notes: notes ? notes.trim() : null,
        status: 'PROGRAMADA',
      },
      include: {
        user: {
          select: { id: true, name: true, role: true, specialty: true },
        },
      },
    });

    return res.status(201).json({ success: true, shift });
  } catch (error) {
    console.error('Error al registrar guardia:', error);
    return res.status(500).json({ error: 'Error al programar guardia' });
  }
});

export default router;
