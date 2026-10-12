import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';
import { checkPermission } from '../types/auth';

const router = Router();

// GET /api/ehr/:patientId
router.get('/:patientId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { patientId } = req.params;

  const canViewRecords = checkPermission(user.role, 'canViewMedicalRecords');
  if (!canViewRecords) {
    return res.status(403).json({
      error: `ACCESO DENEGADO: Por confidencialidad y secreto médico, el rol ${user.role} no tiene autorización para acceder a historias clínicas confidenciales.`,
      accessDenied: true,
    });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        clinicalRecord: {
          include: {
            entries: {
              orderBy: { createdAt: 'desc' },
              include: {
                doctor: {
                  select: { id: true, name: true, specialty: true, licenseNumber: true },
                },
                prescriptions: true,
              },
            },
          },
        },
        vitalSigns: {
          orderBy: { createdAt: 'desc' },
          include: {
            recordedBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        appointments: {
          orderBy: { dateTime: 'desc' },
          take: 5,
          include: {
            doctor: {
              select: { id: true, name: true, specialty: true },
            },
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    let record = patient.clinicalRecord;
    if (!record) {
      record = await prisma.clinicalRecord.create({
        data: {
          patientId: patient.id,
          bloodType: patient.bloodType,
          allergiesSummary: patient.allergies,
          chronicSummary: patient.chronicConditions,
        },
        include: {
          entries: {
            include: {
              doctor: {
                select: { id: true, name: true, specialty: true, licenseNumber: true },
              },
              prescriptions: true,
            },
          },
        },
      });
    }

    return res.json({
      patient,
      clinicalRecord: record,
      userRole: user.role,
      canPrescribe: checkPermission(user.role, 'canPrescribe'),
      canEditClinicalEvolution: checkPermission(user.role, 'canEditClinicalEvolution'),
      canRecordVitalSigns: checkPermission(user.role, 'canRecordVitalSigns'),
    });
  } catch (error) {
    console.error('Error al obtener historia clínica:', error);
    return res.status(500).json({ error: 'Error al consultar historia clínica' });
  }
});

// POST /api/ehr/entries
router.post('/entries', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const canEdit = checkPermission(user.role, 'canEditClinicalEvolution');
  if (!canEdit) {
    return res.status(403).json({
      error: `El rol ${user.role} no tiene privilegios para firmar evoluciones médicas.`,
    });
  }

  try {
    const {
      recordId,
      appointmentId,
      reason,
      anamnesis,
      physicalExam,
      diagnosis,
      diagnosisCode,
      treatmentPlan,
      prescriptions,
    } = req.body;

    if (!recordId || !reason || !anamnesis || !diagnosis || !treatmentPlan) {
      return res.status(400).json({
        error: 'Campos clínicos requeridos: motivo, anamnesis, diagnóstico y plan.',
      });
    }

    const entry = await prisma.consultationEntry.create({
      data: {
        recordId,
        doctorId: user.id,
        appointmentId: appointmentId || null,
        reason: reason.trim(),
        anamnesis: anamnesis.trim(),
        physicalExam: physicalExam ? physicalExam.trim() : null,
        diagnosis: diagnosis.trim(),
        diagnosisCode: diagnosisCode ? diagnosisCode.trim() : null,
        treatmentPlan: treatmentPlan.trim(),
        prescriptions:
          prescriptions && Array.isArray(prescriptions) && prescriptions.length > 0
            ? {
                create: prescriptions.map((p: any) => ({
                  medication: p.medication.trim(),
                  dosage: p.dosage.trim(),
                  quantity: p.quantity ? p.quantity.trim() : null,
                  instructions: p.instructions ? p.instructions.trim() : null,
                  status: 'ACTIVA',
                })),
              }
            : undefined,
      },
      include: {
        doctor: {
          select: { id: true, name: true, specialty: true, licenseNumber: true },
        },
        prescriptions: true,
      },
    });

    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETADO' },
      });
    }

    return res.status(201).json({ success: true, entry });
  } catch (error) {
    console.error('Error al registrar evolución:', error);
    return res.status(500).json({ error: 'Error al guardar evolución médica' });
  }
});

// POST /api/ehr/vitals
router.post('/vitals', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const canRecordVitals = checkPermission(user.role, 'canRecordVitalSigns');
  if (!canRecordVitals) {
    return res.status(403).json({
      error: `El rol ${user.role} no tiene privilegios para registrar signos vitales.`,
    });
  }

  try {
    const {
      patientId,
      systolicPressure,
      diastolicPressure,
      heartRate,
      temperature,
      oxygenSaturation,
      glucose,
      weight,
      height,
      nursingNotes,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'ID de paciente requerido' });
    }

    const vitals = await prisma.vitalSigns.create({
      data: {
        patientId,
        recordedById: user.id,
        systolicPressure: systolicPressure ? parseInt(systolicPressure) : null,
        diastolicPressure: diastolicPressure ? parseInt(diastolicPressure) : null,
        heartRate: heartRate ? parseInt(heartRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
        glucose: glucose ? parseInt(glucose) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        nursingNotes: nursingNotes ? nursingNotes.trim() : null,
      },
      include: {
        recordedBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json({ success: true, vitals });
  } catch (error) {
    console.error('Error al registrar signos vitales:', error);
    return res.status(500).json({ error: 'Error al registrar signos vitales' });
  }
});

export default router;
