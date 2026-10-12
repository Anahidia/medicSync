const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando carga de datos de prueba para MediSync...');

  // Limpiar datos existentes en orden de dependencia
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

  const passwordHash = await bcrypt.hash('123456', 10);

  // 1. Crear Usuarios de diversos roles
  console.log('👤 Creando usuarios y profesionales...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@medisync.com',
      password: passwordHash,
      name: 'Dr. Roberto Rossi',
      role: 'ADMIN',
      specialty: 'Director Médico / Clínica Médica',
      licenseNumber: 'MN 88.420',
      phone: '+54 11 4555-0101',
    },
  });

  const medico1 = await prisma.user.create({
    data: {
      email: 'medico1@medisync.com',
      password: passwordHash,
      name: 'Dra. Clara Benítez',
      role: 'MEDICO',
      specialty: 'Cardiología',
      licenseNumber: 'MN 142.580',
      phone: '+54 11 4555-0102',
    },
  });

  const medico2 = await prisma.user.create({
    data: {
      email: 'medico2@medisync.com',
      password: passwordHash,
      name: 'Dr. Martín Gómez',
      role: 'MEDICO',
      specialty: 'Pediatría',
      licenseNumber: 'MN 159.204',
      phone: '+54 11 4555-0103',
    },
  });

  const enfermero = await prisma.user.create({
    data: {
      email: 'enfermero@medisync.com',
      password: passwordHash,
      name: 'Lic. Lucas Fernández',
      role: 'ENFERMERO',
      specialty: 'Enfermería General y Triaje',
      licenseNumber: 'MP 8.420',
      phone: '+54 11 4555-0104',
    },
  });

  const recepcion = await prisma.user.create({
    data: {
      email: 'recepcion@medisync.com',
      password: passwordHash,
      name: 'Mariana López',
      role: 'RECEPCION',
      specialty: 'Admisión y Atención al Paciente',
      phone: '+54 11 4555-0105',
    },
  });

  const farmacia = await prisma.user.create({
    data: {
      email: 'farmacia@medisync.com',
      password: passwordHash,
      name: 'Farm. Carlos Méndez',
      role: 'FARMACIA',
      specialty: 'Jefe de Farmacia y Depósito',
      licenseNumber: 'MN 33.109',
      phone: '+54 11 4555-0106',
    },
  });

  // 2. Crear Pacientes
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

  // 3. Crear Historias Clínicas (EHR) y Evoluciones
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
      treatmentPlan: 'Se solicita ECG de reposo y laboratorio de rutina con perfil lipídico. Se ajusta estilo de vida con reducción de sodio. Continuar con medicación habitual.',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // hace 7 días
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

  // Signos vitales registrados por enfermero
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
      anamnesis: 'Paciente refiere 48 hs de evolución de tos seca, disnea de esfuerzo y sibilancias nocturnas luego de catarro de vías aéreas superiores.',
      physicalExam: 'TA: 120/75 mmHg. FR: 22 rpm. SatO2: 95% al aire ambiental. Auscultación pulmonar con sibilancias espiratorias bilaterales difusas.',
      diagnosis: 'Asma con exacerbación aguda',
      diagnosisCode: 'J45.9',
      treatmentPlan: 'Nebulizaciones regladas con Salbutamol. Corticoterapia oral por 5 días.',
    },
  });

  // 4. Crear Turnos
  console.log('📅 Creando turnos de la agenda...');
  const hoy = new Date();
  const hoyManana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 30);
  const hoyTarde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0);
  const hoyTarde2 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 15, 30);
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1, 10, 0);

  // Turno en espera (recepcionado hoy)
  await prisma.appointment.create({
    data: {
      patientId: paciente1.id,
      doctorId: medico1.id,
      dateTime: hoyTarde,
      durationMinutes: 30,
      reason: 'Control de estudios de laboratorio cardiológico',
      consultingRoom: 'Consultorio 2',
      status: 'EN_ESPERA',
      receptionNotes: 'Paciente arribó 13:50 hs. Cobertura OSDE validada correctamente.',
      bookedVia: 'RECEPCION',
    },
  });

  // Turno confirmado para hoy
  await prisma.appointment.create({
    data: {
      patientId: paciente2.id,
      doctorId: medico1.id,
      dateTime: hoyTarde2,
      durationMinutes: 30,
      reason: 'Ajuste de medicación broncodilatadora',
      consultingRoom: 'Consultorio 2',
      status: 'CONFIRMADO',
      bookedVia: 'BOT_WHATSAPP',
    },
  });

  // Turno pediátrico para mañana
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

  // Turno completado
  await prisma.appointment.create({
    data: {
      patientId: paciente4.id,
      doctorId: admin.id,
      dateTime: hoyManana,
      durationMinutes: 30,
      reason: 'Renovación de recetas crónicas PAMI',
      consultingRoom: 'Consultorio 1',
      status: 'COMPLETADO',
      bookedVia: 'RECEPCION',
    },
  });

  // 5. Crear Guardias y Fichajes
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
      notes: 'Turno diurno 12 hs. Cobertura de emergencias piso 1.',
    },
  });

  await prisma.onCallShift.create({
    data: {
      userId: enfermero.id,
      serviceArea: 'Enfermería Central & Shockroom',
      startDateTime: inicioGuardia,
      endDateTime: finGuardia,
      status: 'EN_CURSO',
      notes: 'Turno diurno. Responsable de carro de paro.',
    },
  });

  // Fichaje en curso de la Dra. Clara
  await prisma.timeClockEntry.create({
    data: {
      userId: medico1.id,
      clockIn: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 7, 55),
      shiftType: 'GUARDIA',
      deviceOrIp: 'Terminal Guardia 01',
      notes: 'Ingreso puntual a guardia diurna.',
    },
  });

  // Fichaje cerrado del día anterior del Enfermero Lucas
  await prisma.timeClockEntry.create({
    data: {
      userId: enfermero.id,
      clockIn: new Date(Date.now() - 1000 * 60 * 60 * 28),
      clockOut: new Date(Date.now() - 1000 * 60 * 60 * 20),
      durationHours: 8.0,
      shiftType: 'ENFERMERIA',
      deviceOrIp: 'Terminal Enfermería',
      notes: 'Jornada completa sin novedades.',
    },
  });

  // 6. Inventario de Insumos y Farmacia
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
      currentStock: 8, // ¡Alerta! Por debajo del mínimo
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
      name: 'Solución Fisiológica 0.9% 500ml',
      code: 'SOL-FIS-500',
      category: 'SOLUCION',
      unit: 'sachet',
      minStockAlert: 50,
      currentStock: 120,
      location: 'Farmacia - Heladera y Racks Sueros',
      batches: {
        create: [
          {
            batchNumber: 'SOL-8821',
            expirationDate: new Date('2027-10-15'),
            initialQuantity: 150,
            remainingQuantity: 120,
          },
        ],
      },
    },
  });

  const item4 = await prisma.inventoryItem.create({
    data: {
      name: 'Amoxicilina + Ácido Clavulánico 875/125mg',
      code: 'MED-AMOX-CLAV',
      category: 'MEDICAMENTO',
      unit: 'caja',
      minStockAlert: 20,
      currentStock: 5, // ¡Alerta de reposición crítica!
      location: 'Farmacia Interna - Estante Antibióticos',
      batches: {
        create: [
          {
            batchNumber: 'VENC-PROX-12',
            expirationDate: new Date('2026-11-30'), // Próximo a vencer
            initialQuantity: 30,
            remainingQuantity: 5,
          },
        ],
      },
    },
  });

  const item5 = await prisma.inventoryItem.create({
    data: {
      name: 'Gasas Hidrófilas Estériles 10x10 (Sobre x5)',
      code: 'GAS-EST-1010',
      category: 'MATERIAL_CURACION',
      unit: 'sobre',
      minStockAlert: 80,
      currentStock: 210,
      location: 'Depósito Central - Estante A4',
      batches: {
        create: [
          {
            batchNumber: 'GAS-0021',
            expirationDate: new Date('2029-01-01'),
            initialQuantity: 300,
            remainingQuantity: 210,
          },
        ],
      },
    },
  });

  // Movimientos de prueba
  await prisma.inventoryMovement.create({
    data: {
      itemId: item1.id,
      userId: enfermero.id,
      type: 'EGRESO_GUARDIA',
      quantity: 50,
      reference: 'Reposición de Shockroom y Box de Curaciones',
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      itemId: item4.id,
      userId: farmacia.id,
      type: 'EGRESO_CONSULTA',
      quantity: 2,
      reference: 'Dispensación a paciente en guardia nocturna',
    },
  });

  console.log('✅ Base de datos poblada exitosamente con registros clínicos y operativos de prueba.');
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
