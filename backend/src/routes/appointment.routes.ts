import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/appointments
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const doctorId = req.query.doctorId as string;
  const dateStr = req.query.date as string;
  const status = req.query.status as string;

  try {
    const whereClause: any = {};

    if (doctorId && doctorId !== 'all') {
      whereClause.doctorId = doctorId;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (dateStr) {
      const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      whereClause.dateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: { dateTime: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            documentId: true,
            firstName: true,
            lastName: true,
            phone: true,
            healthInsurance: true,
            insuranceNumber: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    });

    const doctors = await prisma.user.findMany({
      where: { role: { in: ['MEDICO', 'ADMIN'] }, active: true },
      select: { id: true, name: true, specialty: true },
    });

    return res.json({ appointments, doctors });
  } catch (error) {
    console.error('Error al consultar turnos:', error);
    return res.status(500).json({ error: 'Error al consultar turnos' });
  }
});

// POST /api/appointments
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { patientId, doctorId, dateTime, durationMinutes, reason, consultingRoom, bookedVia } = req.body;

    if (!patientId || !doctorId || !dateTime || !reason) {
      return res.status(400).json({ error: 'Datos obligatorios del turno incompletos' });
    }

    const targetDate = new Date(dateTime);
    const duration = durationMinutes ? parseInt(durationMinutes) : 20;

    const collision = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { notIn: ['CANCELADO', 'AUSENTE'] },
        dateTime: {
          gte: new Date(targetDate.getTime() - 15 * 60000),
          lte: new Date(targetDate.getTime() + 15 * 60000),
        },
      },
    });

    if (collision) {
      return res.status(409).json({
        error: 'El profesional ya posee un turno asignado en ese horario o muy próximo.',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        dateTime: targetDate,
        durationMinutes: duration,
        reason: reason.trim(),
        consultingRoom: consultingRoom || 'Consultorio General',
        status: 'RESERVADO',
        bookedVia: bookedVia || 'RECEPCION',
      },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    });

    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error('Error al agendar turno:', error);
    return res.status(500).json({ error: 'Error al registrar turno' });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, dateTime, consultingRoom, receptionNotes, reason } = req.body;

  try {
    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (dateTime) dataToUpdate.dateTime = new Date(dateTime);
    if (consultingRoom !== undefined) dataToUpdate.consultingRoom = consultingRoom;
    if (receptionNotes !== undefined) dataToUpdate.receptionNotes = receptionNotes;
    if (reason !== undefined) dataToUpdate.reason = reason;

    const updated = await prisma.appointment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    });

    return res.json({ success: true, appointment: updated });
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    return res.status(500).json({ error: 'Error al actualizar el turno' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELADO' },
    });
    return res.json({ success: true, message: 'Turno cancelado correctamente' });
  } catch (error) {
    console.error('Error al cancelar turno:', error);
    return res.status(500).json({ error: 'Error al cancelar el turno' });
  }
});

export default router;
