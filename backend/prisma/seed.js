const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba para MediSync...');

  // Limpiar datos existentes en orden de dependencia
  await prisma.referral.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultationEntry.deleteMany();
  await prisma.vitalSigns.deleteMany();
  await prisma.clinicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.onCallShift.deleteMany();
  await prisma.timeClockEntry.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.stockBatch.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinic.deleteMany();

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Crear Clínica Principal
  console.log('🏥 Creando institución / clínica principal...');
  const clinic = await prisma.clinic.create({
    data: {
      name: 'MediSync Policonsultorios Central',
      taxId: '30-71458920-4',
      phone: '+54 11 4555-0100',
      email: 'contacto@medisync.com',
      address: 'Av. San Martín 1420',
      city: 'Ciudad Autónoma de Buenos Aires',
      facilityType: 'Policonsultorio y Centro Ambulatorio',
    },
  });

  // 2. Crear Usuarios con departamentos y cargos jerárquicos
  console.log('👤 Creando usuarios, jefes de departamento y profesionales...');
  const admin = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'admin@medisync.com',
      password: passwordHash,
      name: 'Dr. Roberto Rossi',
      role: 'ADMIN',
      department: 'Dirección Médica',
      isDepartmentHead: true,
      positionTitle: 'Director Médico General',
      specialty: 'Clínica Médica / Dirección',
      licenseNumber: 'MN 88.420',
      phone: '+54 11 4555-0101',
    },
  });

  const medico1 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'medico1@medisync.com',
      password: passwordHash,
      name: 'Dra. Clara Benítez',
      role: 'MEDICO',
      department: 'Cardiología',
      isDepartmentHead: true,
      positionTitle: 'Jefa de Cardiología',
      specialty: 'Cardiología Clínica e Intervencionista',
      licenseNumber: 'MN 142.580',
      phone: '+54 11 4555-0102',
    },
  });

  const medico2 = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'medico2@medisync.com',
      password: passwordHash,
      name: 'Dr. Martín Gómez',
      role: 'MEDICO',
      department: 'Pediatría',
      isDepartmentHead: true,
      positionTitle: 'Jefe de Pediatría',
      specialty: 'Pediatría General',
      licenseNumber: 'MN 159.204',
      phone: '+54 11 4555-0103',
    },
  });

  const enfermero = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'enfermero@medisync.com',
      password: passwordHash,
      name: 'Lic. Lucas Fernández',
      role: 'ENFERMERO',
      department: 'Enfermería',
      isDepartmentHead: true,
      positionTitle: 'Jefe de Enfermería y Triaje',
      specialty: 'Enfermería Crítica y Triaje',
      licenseNumber: 'MP 8.420',
      phone: '+54 11 4555-0104',
    },
  });

  const recepcion = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'recepcion@medisync.com',
      password: passwordHash,
      name: 'Mariana López',
      role: 'RECEPCION',
      department: 'Recepción y Admisión',
      isDepartmentHead: false,
      positionTitle: 'Recepcionista y Coordinadora de Turnos',
      specialty: 'Admisión y Atención al Paciente',
      phone: '+54 11 4555-0105',
    },
  });

  const farmacia = await prisma.user.create({
    data: {
      clinicId: clinic.id,
      email: 'farmacia@medisync.com',
      password: passwordHash,
      name: 'Farm. Carlos Méndez',
      role: 'FARMACIA',
      department: 'Farmacia y Depósito',
      isDepartmentHead: true,
      positionTitle: 'Jefe de Farmacia y Stock',
      specialty: 'Farmacia Hospitalaria',
      licenseNumber: 'MN 33.109',
      phone: '+54 11 4555-0106',
    },
  });

  // 3. Crear Invitaciones Demo generadas por superiores
  console.log('✉️ Creando invitaciones de empleados por sus superiores...');
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Invitación creada por la Jefa de Enfermería para un nuevo enfermero
  await prisma.invitation.create({
    data: {
      token: 'demo-invitacion-enfermeria-2026',
      clinicId: clinic.id,
      createdById: enfermero.id,
      recipientName: 'Enfermero/a de Cuidados Intermedios',
      invitedEmail: 'nuevo.enfermero@medisync.com',
      role: 'ENFERMERO',
      department: 'Enfermería',
      positionTitle: 'Enfermero/a de Piso y Triaje',
      status: 'PENDIENTE',
      expiresAt: in30Days,
    },
  });

  // Invitación creada por la Jefa de Cardiología para un cardiólogo
  await prisma.invitation.create({
    data: {
      token: 'demo-invitacion-cardiologia-2026',
      clinicId: clinic.id,
      createdById: medico1.id,
      recipientName: 'Médico/a Cardiólogo/a de Guardia',
      invitedEmail: 'cardio.guardia@medisync.com',
      role: 'MEDICO',
      department: 'Cardiología',
      positionTitle: 'Médico Cardiólogo de Guardia y Consultorio',
      status: 'PENDIENTE',
      expiresAt: in30Days,
    },
  });

  // 4. Crear Pacientes
  console.log('🩺 Creando pacientes...');
  const paciente1 = await prisma.patient.create({
    data: {
      documentId: '40123456',
      firstName: 'Juan Ignacio',
      lastName: 'Pérez',
      birthDate: new Date('1990-04-15'),
      gender: 'M',
      phone: '+54 9 11 2345-6789',
      email: 'juan.perez@example.com',
      address: 'Av. Corrientes 3450, CABA',
      bloodType: 'A+',
      healthInsurance: 'OSDE 310',
      insuranceNumber: '892345012',
      emergencyContact: 'Laura Gómez (Esposa) - 11 9876-5432',
      allergies: 'Penicilina, Sulfamidas',
      chronicConditions: 'Hipertensión arterial esencial',
    },
  });

  const paciente2 = await prisma.patient.create({
    data: {
      documentId: '32987654',
      firstName: 'María Laura',
      lastName: 'González',
      birthDate: new Date('1984-08-22'),
      gender: 'F',
      phone: '+54 9 11 8765-4321',
      email: 'marialaura.gonzalez@example.com',
      address: 'Calle 50 N° 120, La Plata',
      bloodType: 'O+',
      healthInsurance: 'Swiss Medical',
      insuranceNumber: 'SM-458921',
      emergencyContact: 'Marcelo Díaz (Hermano) - 221 445-6789',
      allergies: 'Aspirina (AINEs)',
      chronicConditions: 'Asma bronquial leve persistente',
    },
  });

  const paciente3 = await prisma.patient.create({
    data: {
      documentId: '48654321',
      firstName: 'Sofía Martina',
      lastName: 'Díaz',
      birthDate: new Date('2017-11-05'),
      gender: 'F',
      phone: '+54 9 11 3456-7890',
      email: 'madre.sofia@example.com',
      address: 'Belgrano 890, Quilmes',
      bloodType: 'B+',
      healthInsurance: 'Galeno Azul',
      insuranceNumber: 'GAL-99234',
      emergencyContact: 'Patricia Torres (Madre) - 11 3456-7890',
      allergies: 'Ninguna conocida',
      chronicConditions: 'Ninguna',
    },
  });

  const paciente4 = await prisma.patient.create({
    data: {
      documentId: '18234567',
      firstName: 'Carlos Alberto',
      lastName: 'Romero',
      birthDate: new Date('1956-02-10'),
      gender: 'M',
      phone: '+54 9 11 6543-2109',
      address: 'San Martín 1540, Vicente López',
      bloodType: 'O-',
      healthInsurance: 'PAMI',
      insuranceNumber: 'PAMI-003492817',
      emergencyContact: 'Esteban Romero (Hijo) - 11 2233-4455',
      allergies: 'Iodo de contraste radiológico',
      chronicConditions: 'Diabetes Mellitus Tipo 2, Cardiopatía Isquémica',
    },
  });

  // 5. Crear Derivaciones Médicas (Internas a otros doctores y Externas a otros centros)
  console.log('🚑 Creando derivaciones médicas internas y externas...');
  await prisma.referral.create({
    data: {
      clinicId: clinic.id,
      patientId: paciente1.id,
      referringDoctorId: medico1.id,
      type: 'EXTERNA',
      destinationFacility: 'Hospital Universitario Fundación Favaloro',
      destinationDepartment: 'Hemodinamia y Cardiología Intervencionista',
      specialistName: 'Dr. Alejandro Fernández',
      reason: 'Angioplastia coronaria y cateterismo diagnóstico por angina recurrente.',
      clinicalSummary: 'Paciente masculino de 34 años con HTA y dolor precordial opresivo atípico con prueba ergométrica positiva para isquemia miocárdica. Requiere estudio cinecoronariográfico.',
      urgency: 'PRIORITARIA',
      transportType: 'AMBULANCIA_COMUN',
      status: 'ACEPTADA',
      notes: 'Cama reservada en Unidad Coronaria 3er piso.',
    },
  });

  await prisma.referral.create({
    data: {
      clinicId: clinic.id,
      patientId: paciente4.id,
      referringDoctorId: admin.id,
      type: 'EXTERNA',
      destinationFacility: 'Hospital General de Agudos Dr. Cosme Argerich',
      destinationDepartment: 'Nefrología y Terapia Renal Sustitutiva',
      reason: 'Evaluación de insuficiencia renal crónica avanzada y necesidad de fístula arteriovenosa.',
      clinicalSummary: 'Paciente de 68 años diabético e hipertenso de larga data. Clearance de creatinina 18 ml/min. Proteinuria en rango nefrótico.',
      urgency: 'PROGRAMADA',
      transportType: 'POR_SUS_MEDIOS',
      status: 'PENDIENTE',
      notes: 'Turno solicitado para interconsulta con especialista externo.',
    },
  });

  // Interconsulta interna a otro doctor de la clínica
  await prisma.referral.create({
    data: {
      clinicId: clinic.id,
      patientId: paciente2.id,
      referringDoctorId: admin.id,
      type: 'INTERNA',
      targetDoctorId: medico1.id,
      destinationFacility: `${clinic.name} (Interna)`,
      destinationDepartment: 'Cardiología',
      specialistName: medico1.name,
      reason: 'Interconsulta cardiológica por taquicardia sinusal y palpitaciones asociadas a medicación broncodilatadora.',
      clinicalSummary: 'Paciente de 40 años asmática bajo tratamiento con Beta-2 agonistas. Refiere taquicardia persistente post-dosis. Se solicita ECG y evaluación para ajuste farmacológico conjunto.',
      urgency: 'PRIORITARIA',
      transportType: 'CONSULTORIO_INTERNO',
      status: 'PENDIENTE',
      notes: 'Paciente aguardando en consultorio contiguo. Pase de ficha clínica realizado.',
    },
  });

  await prisma.referral.create({
    data: {
      clinicId: clinic.id,
      patientId: paciente3.id,
      referringDoctorId: medico1.id,
      type: 'INTERNA',
      targetDoctorId: medico2.id,
      destinationFacility: `${clinic.name} (Interna)`,
      destinationDepartment: 'Pediatría',
      specialistName: medico2.name,
      reason: 'Valoración pediátrica integral por soplo inocuo detectado en control.',
      clinicalSummary: 'Niña de 8 años asintomática con soplo protomesosistólico grado I/VI en foco pulmonar, sin irradiación. Se solicita seguimiento por su pediatra de cabecera.',
      urgency: 'PROGRAMADA',
      transportType: 'CONSULTORIO_INTERNO',
      status: 'ACEPTADA',
      notes: 'Interconsulta aceptada por Pediatría para el turno de mañana.',
    },
  });

  // 6. Historias Clínicas (EHR)
  console.log('📋 Generando Historias Clínicas y Evoluciones...');
  const hceJuan = await prisma.clinicalRecord.create({
    data: {
      patientId: paciente1.id,
      bloodType: 'A+',
      allergiesSummary: 'Alergia severa a Penicilina (urticaria y angioedema). Evitar beta-lactámicos.',
      chronicSummary: 'HTA controlada con Enalapril 10mg/día desde 2021.',
      surgicalHistory: 'Apendicectomía laparoscópica en 2012 sin complicaciones.',
      familyHistory: 'Padre con IAM a los 62 años. Madre hipertensa.',
    },
  });

  const evolJuan = await prisma.consultationEntry.create({
    data: {
      recordId: hceJuan.id,
      doctorId: medico1.id,
      reason: 'Control periódico de hipertensión y palpitaciones ocasionales',
      anamnesis: 'Paciente de 34 años con antecedentes de HTA. Refiere episodios esporádicos de palpitaciones vespertinas relacionadas a estrés laboral. Niega dolor precordial o disnea.',
      physicalExam: 'TA: 135/85 mmHg. FC: 78 lpm. R1 y R2 normofonéticos en 4 focos. Silencios libres. Sin edemas periféricos. Murmullo vesicular conservado bilateralmente.',
      diagnosis: 'Hipertensión arterial esencial controlada',
      diagnosisCode: 'I10',
      treatmentPlan: 'Se solicita ECG de reposo y laboratorio de rutina con perfil lipídico. Derivación programada a Favaloro para cateterismo preventivo.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
  });

  await prisma.prescription.create({
    data: {
      entryId: evolJuan.id,
      medication: 'Enalapril 10 mg comprimidos',
      dosage: '1 comprimido cada mañana en ayunas',
      quantity: '60 comprimidos (2 cajas)',
      instructions: 'Controlar TA semanalmente y registrar en libreta.',
      status: 'ACTIVA',
    },
  });

  await prisma.vitalSigns.create({
    data: {
      patientId: paciente1.id,
      recordedById: enfermero.id,
      systolicPressure: 135,
      diastolicPressure: 85,
      heartRate: 78,
      temperature: 36.5,
      oxygenSaturation: 98,
      glucose: 92,
      weight: 78.5,
      height: 177,
      nursingNotes: 'Paciente lúcido, afebril, colaborador. Se realiza triaje previo a consulta cardiológica.',
    },
  });

  const hceMaria = await prisma.clinicalRecord.create({
    data: {
      patientId: paciente2.id,
      bloodType: 'O+',
      allergiesSummary: 'Intolerancia gástrica a AINEs (Aspirina, Ketorolac).',
      chronicSummary: 'Asma bronquial con crisis estacionales.',
      familyHistory: 'Madre asmática.',
    },
  });

  await prisma.consultationEntry.create({
    data: {
      recordId: hceMaria.id,
      doctorId: admin.id,
      reason: 'Crisis asmática moderada post cuadro gripal',
      anamnesis: 'Paciente refiere 48 hs de evolución de tos seca, disnea de esfuerzo y sibilancias nocturnas.',
      physicalExam: 'TA: 120/75 mmHg. FR: 22 rpm. SatO2: 95% al aire ambiental. Sibilancias espiratorias bilaterales.',
      diagnosis: 'Asma con exacerbación aguda',
      diagnosisCode: 'J45.9',
      treatmentPlan: 'Nebulizaciones regladas con Salbutamol. Corticoterapia oral por 5 días.',
    },
  });

  // 7. Crear Turnos
  console.log('📅 Creando turnos de la agenda...');
  const hoy = new Date();
  const hoyManana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 30);
  const hoyTarde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0);
  const hoyTarde2 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 15, 30);
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 10, 0);

  await prisma.appointment.create({
    data: {
      patientId: paciente1.id,
      doctorId: medico1.id,
      dateTime: hoyTarde,
      durationMinutes: 30,
      reason: 'Control de estudios cardiológicos y coordinación de derivación',
      consultingRoom: 'Consultorio 2 (Cardiología)',
      status: 'EN_ESPERA',
      receptionNotes: 'Paciente arribó 13:50 hs. Cobertura OSDE validada.',
      bookedVia: 'RECEPCION',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: paciente2.id,
      doctorId: medico1.id,
      dateTime: hoyTarde2,
      durationMinutes: 30,
      reason: 'Ajuste de medicación broncodilatadora',
      consultingRoom: 'Consultorio 2 (Cardiología)',
      status: 'CONFIRMADO',
      bookedVia: 'BOT_WHATSAPP',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: paciente3.id,
      doctorId: medico2.id,
      dateTime: manana,
      durationMinutes: 30,
      reason: 'Control anual de niño sano y certificado escolar',
      consultingRoom: 'Consultorio 4 (Pediatría)',
      status: 'RESERVADO',
      bookedVia: 'RECEPCION',
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: paciente4.id,
      doctorId: admin.id,
      dateTime: hoyManana,
      durationMinutes: 30,
      reason: 'Renovación de recetas crónicas PAMI y derivación renal',
      consultingRoom: 'Consultorio 1',
      status: 'COMPLETADO',
      bookedVia: 'RECEPCION',
    },
  });

  // 8. Crear Guardias y Fichajes
  console.log('⏱️ Creando guardias y fichajes de asistencia...');
  const inicioGuardia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 8, 0);
  const finGuardia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 20, 0);

  await prisma.onCallShift.create({
    data: {
      userId: medico1.id,
      serviceArea: 'Guardia Médica Adultos',
      startDateTime: inicioGuardia,
      endDateTime: finGuardia,
      status: 'EN_CURSO',
      notes: 'Turno diurno 12 hs. Cobertura de emergencias cardiología y shockroom.',
    },
  });

  await prisma.onCallShift.create({
    data: {
      userId: enfermero.id,
      serviceArea: 'Enfermería Central & Shockroom',
      startDateTime: inicioGuardia,
      endDateTime: finGuardia,
      status: 'EN_CURSO',
      notes: 'Turno diurno. Responsable de carro de paro y coordinación de enfermería.',
    },
  });

  await prisma.timeClockEntry.create({
    data: {
      userId: medico1.id,
      clockIn: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 7, 55),
      shiftType: 'GUARDIA',
      deviceOrIp: 'Terminal Guardia 01',
      notes: 'Ingreso puntual a guardia.',
    },
  });

  // 9. Inventario de Insumos y Farmacia
  console.log('📦 Creando inventario de insumos y farmacia...');
  const item1 = await prisma.inventoryItem.create({
    data: {
      name: 'Jeringas Descartables 5ml c/ Aguja 21G',
      code: 'JER-005ML',
      category: 'DESCARTABLE',
      unit: 'unidad',
      minStockAlert: 100,
      currentStock: 450,
      location: 'Depósito Central - Estante A1',
      batches: {
        create: [
          {
            batchNumber: 'LOT-2026-991',
            expirationDate: new Date('2028-12-31'),
            initialQuantity: 500,
            remainingQuantity: 450,
          },
        ],
      },
    },
  });

  const item2 = await prisma.inventoryItem.create({
    data: {
      name: 'Guantes de Examen Látex Talle M (Caja x100)',
      code: 'GUA-LAT-M',
      category: 'DESCARTABLE',
      unit: 'caja',
      minStockAlert: 15,
      currentStock: 8,
      location: 'Depósito Central - Estante B2',
      batches: {
        create: [
          {
            batchNumber: 'LOT-G-404',
            expirationDate: new Date('2027-06-30'),
            initialQuantity: 20,
            remainingQuantity: 8,
          },
        ],
      },
    },
  });

  const item3 = await prisma.inventoryItem.create({
    data: {
      name: 'Amoxicilina + Ácido Clavulánico 875/125mg',
      code: 'MED-AMOX-CLAV',
      category: 'MEDICAMENTO',
      unit: 'caja',
      minStockAlert: 20,
      currentStock: 5,
      location: 'Farmacia Interna - Estante Antibióticos',
      batches: {
        create: [
          {
            batchNumber: 'VENC-PROX-12',
            expirationDate: new Date('2026-11-30'),
            initialQuantity: 30,
            remainingQuantity: 5,
          },
        ],
      },
    },
  });

  console.log('✅ Base de datos sembrada con clínica, roles jerárquicos, invitaciones y derivaciones.');
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
