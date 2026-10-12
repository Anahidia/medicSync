import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/bot/check-availability
router.get('/check-availability', async (req, res) => {
  const specialty = req.query.specialty as string;
  const doctorId = req.query.doctorId as string;
  const dateStr = req.query.date as string;

  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: { in: ['MEDICO', 'ADMIN'] },
        active: true,
        ...(specialty ? { specialty: { contains: specialty } } : {}),
        ...(doctorId ? { id: doctorId } : {}),
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        licenseNumber: true,
      },
    });

    if (doctors.length === 0) {
      return res.json({
        available: false,
        message: 'No se encontraron profesionales para la especialidad solicitada.',
        slots: [],
      });
    }

    const startDate = dateStr ? new Date(`${dateStr}T08:00:00Z`) : new Date();
    const endDate = dateStr
      ? new Date(`${dateStr}T20:00:00Z`)
      : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: { in: doctors.map((d) => d.id) },
        status: { notIn: ['CANCELADO', 'AUSENTE'] },
        dateTime: { gte: startDate, lte: endDate },
      },
      select: { doctorId: true, dateTime: true, durationMinutes: true },
    });

    const availableSlots = [];
    for (const doc of doctors) {
      const daysToCheck = dateStr
        ? [new Date(dateStr)]
        : [0, 1, 2].map((i) => {
            const d = new Date();
            d.setDate(d.getDate() + i + 1);
            return d;
          });

      for (const day of daysToCheck) {
        const hours = [9, 10, 11, 14, 15, 16, 17];
        for (const hour of hours) {
          const slotTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
          const isTaken = appointments.some(
            (a) =>
              a.doctorId === doc.id &&
              Math.abs(new Date(a.dateTime).getTime() - slotTime.getTime()) < 25 * 60 * 1000
          );

          if (!isTaken) {
            availableSlots.push({
              doctorId: doc.id,
              doctorName: doc.name,
              specialty: doc.specialty,
              dateTime: slotTime.toISOString(),
              timeFormatted: `${slotTime.toLocaleDateString('es-AR')} ${slotTime.getHours().toString().padStart(2, '0')}:00 hs`,
            });
          }
        }
      }
    }

    return res.json({
      available: true,
      doctorsCount: doctors.length,
      availableSlots: availableSlots.slice(0, 15),
    });
  } catch (error) {
    console.error('Error bot disponibilidad:', error);
    return res.status(500).json({ error: 'Error al consultar disponibilidad' });
  }
});

// POST /api/bot/book-appointment
router.post('/book-appointment', async (req, res) => {
  try {
    const { documentId, firstName, lastName, phone, doctorId, dateTime, reason } = req.body;

    if (!documentId || !firstName || !lastName || !phone || !doctorId || !dateTime) {
      return res.status(400).json({
        error: 'Datos incompletos para agendar el turno (DNI, Nombre, Apellido, Teléfono, Médico y Fecha)',
      });
    }

    let patient = await prisma.patient.findUnique({
      where: { documentId: documentId.trim() },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          documentId: documentId.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          birthDate: new Date('1995-01-01'),
          gender: 'OTRO',
          clinicalRecord: {
            create: {},
          },
        },
      });
    }

    const targetDate = new Date(dateTime);
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { notIn: ['CANCELADO', 'AUSENTE'] },
        dateTime: {
          gte: new Date(targetDate.getTime() - 20 * 60000),
          lte: new Date(targetDate.getTime() + 20 * 60000),
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'El horario seleccionado ya ha sido reservado por otro paciente.',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        dateTime: targetDate,
        durationMinutes: 30,
        reason: reason || 'Consulta agendada por Asistente Virtual WhatsApp',
        consultingRoom: 'Consultorio Asignado',
        status: 'CONFIRMADO',
        bookedVia: 'BOT_WHATSAPP',
      },
      include: {
        doctor: { select: { name: true, specialty: true } },
        patient: { select: { firstName: true, lastName: true, phone: true } },
      },
    });

    return res.json({
      success: true,
      message: `¡Turno confirmado para ${patient.firstName} ${patient.lastName} con ${appointment.doctor.name}!`,
      appointmentId: appointment.id,
      appointment,
    });
  } catch (error) {
    console.error('Error bot agendamiento:', error);
    return res.status(500).json({ error: 'Error al procesar reserva de turno' });
  }
});

// POST /api/bot/cancel-appointment
router.post('/cancel-appointment', async (req, res) => {
  try {
    const { appointmentId, documentId } = req.body;

    if (!appointmentId && !documentId) {
      return res.status(400).json({ error: 'Se requiere ID de turno o DNI del paciente' });
    }

    let appointment;

    if (appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
    } else if (documentId) {
      const patient = await prisma.patient.findUnique({
        where: { documentId: documentId.trim() },
      });

      if (!patient) {
        return res.status(404).json({ error: 'No se encontró paciente con ese DNI' });
      }

      appointment = await prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          status: { in: ['RESERVADO', 'CONFIRMADO'] },
          dateTime: { gte: new Date() },
        },
        orderBy: { dateTime: 'asc' },
      });
    }

    if (!appointment) {
      return res.status(404).json({ error: 'No se encontró un turno activo próximo para cancelar' });
    }

    const cancelled = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELADO',
        receptionNotes: 'Cancelado por el paciente a través del Asistente Virtual.',
      },
    });

    return res.json({
      success: true,
      message: 'El turno ha sido cancelado exitosamente.',
      appointment: cancelled,
    });
  } catch (error) {
    console.error('Error bot cancelación:', error);
    return res.status(500).json({ error: 'Error al cancelar turno' });
  }
});

// GET /api/bot/reminders
router.get('/reminders', async (req, res) => {
  try {
    const now = new Date();
    const futureWindow = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const appointmentsPendingReminder = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: now,
          lte: futureWindow,
        },
        reminderSent24h: false,
        status: { in: ['RESERVADO', 'CONFIRMADO'] },
      },
      include: {
        patient: { select: { firstName: true, lastName: true, phone: true } },
        doctor: { select: { name: true, specialty: true } },
      },
    });

    const messages = appointmentsPendingReminder.map((apt) => {
      const dateFormatted = new Date(apt.dateTime).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      const timeFormatted = new Date(apt.dateTime).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return {
        appointmentId: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        phone: apt.patient.phone,
        doctorName: apt.doctor.name,
        specialty: apt.doctor.specialty,
        consultingRoom: apt.consultingRoom || 'Consultorio Asignado',
        scheduledFor: `${dateFormatted} a las ${timeFormatted} hs`,
        messageTemplate: `¡Hola ${apt.patient.firstName}! Le recordamos su turno médico en MediSync para ${dateFormatted} a las ${timeFormatted} hs con ${apt.doctor.name} (${apt.doctor.specialty}) en ${apt.consultingRoom || 'Consultorio'}. Por favor responda 1 para CONFIRMAR o 2 para CANCELAR.`,
      };
    });

    return res.json({
      count: messages.length,
      pendingReminders: messages,
    });
  } catch (error) {
    console.error('Error al obtener recordatorios:', error);
    return res.status(500).json({ error: 'Error al consultar recordatorios' });
  }
});

// POST /api/bot/reminders
router.post('/reminders', async (req, res) => {
  try {
    const { appointmentIds } = req.body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return res.status(400).json({ error: 'Se requiere array de appointmentIds' });
    }

    const updated = await prisma.appointment.updateMany({
      where: { id: { in: appointmentIds } },
      data: { reminderSent24h: true },
    });

    return res.json({
      success: true,
      message: `${updated.count} recordatorios marcados como despachados.`,
      updatedCount: updated.count,
    });
  } catch (error) {
    console.error('Error al marcar recordatorios:', error);
    return res.status(500).json({ error: 'Error al procesar despacho de recordatorios' });
  }
});

export default router;
