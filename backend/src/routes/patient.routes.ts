import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/patients
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const q = (req.query.q as string) || '';

  try {
    const patients = await prisma.patient.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { documentId: { contains: q } },
              { healthInsurance: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { lastName: 'asc' },
      include: {
        clinicalRecord: {
          select: { id: true, allergiesSummary: true, chronicSummary: true, bloodType: true },
        },
        _count: {
          select: { appointments: true, vitalSigns: true },
        },
      },
    });

    return res.json({ patients });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    return res.status(500).json({ error: 'Error al consultar pacientes' });
  }
});

// POST /api/patients
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      documentId,
      firstName,
      lastName,
      birthDate,
      gender,
      phone,
      email,
      address,
      bloodType,
      healthInsurance,
      insuranceNumber,
      emergencyContact,
      allergies,
      chronicConditions,
    } = req.body;

    if (!documentId || !firstName || !lastName || !birthDate || !phone) {
      return res.status(400).json({ error: 'Datos obligatorios incompletos' });
    }

    const existing = await prisma.patient.findUnique({
      where: { documentId: documentId.trim() },
    });

    if (existing) {
      return res.status(409).json({ error: 'Ya existe un paciente con este DNI/Documento' });
    }

    const patient = await prisma.patient.create({
      data: {
        documentId: documentId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate: new Date(birthDate),
        gender: gender || 'OTRO',
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        bloodType: bloodType || null,
        healthInsurance: healthInsurance || null,
        insuranceNumber: insuranceNumber || null,
        emergencyContact: emergencyContact || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
        clinicalRecord: {
          create: {
            bloodType: bloodType || null,
            allergiesSummary: allergies || null,
            chronicSummary: chronicConditions || null,
          },
        },
      },
      include: {
        clinicalRecord: true,
      },
    });

    return res.status(201).json({ success: true, patient });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    return res.status(500).json({ error: 'Error al registrar paciente' });
  }
});

export default router;
