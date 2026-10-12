import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/referrals (Listado de derivaciones a otros hospitales o interconsultas internas)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const status = req.query.status as string;
  const urgency = req.query.urgency as string;
  const patientId = req.query.patientId as string;
  const type = req.query.type as string; // 'INTERNA' | 'EXTERNA' | 'all'
  const scope = req.query.scope as string; // 'all' | 'received' | 'sent'

  try {
    const whereClause: any = {};
    if (status && status !== 'all') whereClause.status = status;
    if (urgency && urgency !== 'all') whereClause.urgency = urgency;
    if (patientId) whereClause.patientId = patientId;
    if (type && type !== 'all') whereClause.type = type;

    if (scope === 'received') {
      whereClause.targetDoctorId = user.id;
    } else if (scope === 'sent') {
      whereClause.referringDoctorId = user.id;
    }

    const [referrals, doctors] = await Promise.all([
      prisma.referral.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              documentId: true,
              phone: true,
              bloodType: true,
              healthInsurance: true,
              insuranceNumber: true,
              allergies: true,
              chronicConditions: true,
            },
          },
          referringDoctor: {
            select: {
              id: true,
              name: true,
              role: true,
              department: true,
              specialty: true,
              licenseNumber: true,
              positionTitle: true,
            },
          },
          targetDoctor: {
            select: {
              id: true,
              name: true,
              role: true,
              department: true,
              specialty: true,
              licenseNumber: true,
              positionTitle: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: {
          role: { in: ['MEDICO', 'ADMIN'] },
          active: true,
        },
        select: {
          id: true,
          name: true,
          role: true,
          department: true,
          specialty: true,
          positionTitle: true,
          isDepartmentHead: true,
        },
        orderBy: [{ department: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return res.json({ referrals, doctors });
  } catch (error) {
    console.error('Error al obtener derivaciones:', error);
    return res.status(500).json({ error: 'Error al consultar derivaciones' });
  }
});

// GET /api/referrals/doctors (Listado específico de médicos para interconsultas internas)
router.get('/doctors', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: { in: ['MEDICO', 'ADMIN'] },
        active: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
        specialty: true,
        positionTitle: true,
        isDepartmentHead: true,
      },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
    });

    return res.json({ doctors });
  } catch (error) {
    console.error('Error al obtener médicos para interconsulta:', error);
    return res.status(500).json({ error: 'Error al consultar médicos' });
  }
});

// POST /api/referrals (Crear nueva derivación médica - Interna o Externa)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  try {
    const {
      patientId,
      type = 'EXTERNA', // 'INTERNA' | 'EXTERNA'
      targetDoctorId,
      destinationFacility,
      destinationDepartment,
      specialistName,
      reason,
      clinicalSummary,
      urgency,
      transportType,
      notes,
    } = req.body;

    const isInternal = type === 'INTERNA';

    if (!patientId || !reason || !clinicalSummary) {
      return res.status(400).json({
        error: 'Campos obligatorios incompletos: Paciente, Motivo y Resumen clínico.',
      });
    }

    if (!isInternal && (!destinationFacility || !destinationDepartment)) {
      return res.status(400).json({
        error: 'Para derivaciones externas, debe indicar Hospital de destino y Departamento/Servicio.',
      });
    }

    if (isInternal && !targetDoctorId && !destinationDepartment) {
      return res.status(400).json({
        error: 'Para interconsultas internas, debe indicar al menos el Doctor destinatario o Departamento.',
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    let finalSpecialistName = specialistName ? specialistName.trim() : null;
    let finalDepartment = destinationDepartment ? destinationDepartment.trim() : '';
    let finalFacility = destinationFacility ? destinationFacility.trim() : '';

    if (isInternal) {
      if (targetDoctorId) {
        const targetDoctor = await prisma.user.findUnique({
          where: { id: targetDoctorId },
        });
        if (targetDoctor) {
          finalSpecialistName = targetDoctor.name;
          if (!finalDepartment) {
            finalDepartment = targetDoctor.department || targetDoctor.specialty || 'General';
          }
        }
      }
      if (!finalFacility) {
        finalFacility = user.clinicName ? `${user.clinicName} (Interna)` : 'Clínica MediSync (Interna)';
      }
    }

    const referral = await prisma.referral.create({
      data: {
        clinicId: user.clinicId || null,
        patientId,
        referringDoctorId: user.id,
        type: isInternal ? 'INTERNA' : 'EXTERNA',
        targetDoctorId: isInternal && targetDoctorId ? targetDoctorId : null,
        destinationFacility: finalFacility,
        destinationDepartment: finalDepartment || 'Medicina General',
        specialistName: finalSpecialistName,
        reason: reason.trim(),
        clinicalSummary: clinicalSummary.trim(),
        urgency: urgency || 'PROGRAMADA',
        transportType: transportType || (isInternal ? 'CONSULTORIO_INTERNO' : 'POR_SUS_MEDIOS'),
        status: 'PENDIENTE',
        notes: notes ? notes.trim() : null,
      },
      include: {
        patient: true,
        referringDoctor: {
          select: { name: true, department: true, specialty: true, licenseNumber: true, positionTitle: true },
        },
        targetDoctor: {
          select: { name: true, department: true, specialty: true, licenseNumber: true, positionTitle: true },
        },
      },
    });

    return res.status(201).json({ success: true, referral });
  } catch (error) {
    console.error('Error al registrar derivación:', error);
    return res.status(500).json({ error: 'Error al procesar derivación médica' });
  }
});

// PATCH /api/referrals/:id (Actualizar estado de derivación)
router.patch('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status, notes, destinationFacility, transportType, targetDoctorId } = req.body;

  try {
    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (destinationFacility) dataToUpdate.destinationFacility = destinationFacility;
    if (transportType) dataToUpdate.transportType = transportType;
    if (targetDoctorId) dataToUpdate.targetDoctorId = targetDoctorId;

    const updated = await prisma.referral.update({
      where: { id },
      data: dataToUpdate,
      include: {
        patient: true,
        referringDoctor: { select: { name: true, department: true, specialty: true } },
        targetDoctor: { select: { name: true, department: true, specialty: true } },
      },
    });

    return res.json({ success: true, referral: updated });
  } catch (error) {
    console.error('Error al actualizar derivación:', error);
    return res.status(500).json({ error: 'Error al actualizar derivación médica' });
  }
});

export default router;
