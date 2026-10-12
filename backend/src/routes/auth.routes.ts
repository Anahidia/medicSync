import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';
import { AuthUser, ROLE_PERMISSIONS, UserRole } from '../types/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'medisync_super_secret_jwt_key_2026_clinic_secure';
const COOKIE_NAME = 'medisync_session';

function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      clinicId: user.clinicId,
      clinicName: user.clinicName,
      department: user.department,
      isDepartmentHead: user.isDepartmentHead,
      positionTitle: user.positionTitle,
      specialty: user.specialty,
      licenseNumber: user.licenseNumber,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ==========================================
// 1. LOGIN NORMAL (Correo y Contraseña)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { clinic: true },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      clinicId: user.clinicId,
      clinicName: user.clinic?.name || null,
      department: user.department,
      isDepartmentHead: user.isDepartmentHead,
      positionTitle: user.positionTitle,
      specialty: user.specialty,
      licenseNumber: user.licenseNumber,
    };

    const token = signToken(authUser);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, user: authUser, token });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==========================================
// 1.1 REGISTRO PROFESIONAL DIRECTO (Imagen 2)
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, role, licenseNumber, email, password, clinicName } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son obligatorios.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con este correo.' });
    }

    let defaultClinic = await prisma.clinic.findFirst();
    if (!defaultClinic) {
      defaultClinic = await prisma.clinic.create({
        data: {
          name: clinicName || 'MediSync Policonsultorios Central',
          taxId: '30-71458920-4',
          facilityType: 'Policonsultorio y Centro Ambulatorio',
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRole: UserRole = ['ADMIN', 'MEDICO', 'ENFERMERO', 'RECEPCION', 'FARMACIA'].includes(role)
      ? role
      : 'MEDICO';

    let department = 'Medicina General';
    let positionTitle = 'Médico de Staff';
    if (validRole === 'ADMIN') {
      department = 'Dirección Médica';
      positionTitle = 'Director/a Médico';
    } else if (validRole === 'ENFERMERO') {
      department = 'Enfermería';
      positionTitle = 'Enfermero/a';
    } else if (validRole === 'RECEPCION') {
      department = 'Recepción y Admisión';
      positionTitle = 'Recepcionista';
    } else if (validRole === 'FARMACIA') {
      department = 'Farmacia';
      positionTitle = 'Responsable de Farmacia';
    }

    const newUser = await prisma.user.create({
      data: {
        clinicId: defaultClinic.id,
        email: email.toLowerCase().trim(),
        password: passwordHash,
        name: `${firstName.trim()} ${lastName.trim()}`,
        role: validRole,
        department,
        positionTitle,
        licenseNumber: licenseNumber ? licenseNumber.trim() : null,
      },
      include: { clinic: true },
    });

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as UserRole,
      clinicId: newUser.clinicId,
      clinicName: defaultClinic.name,
      department: newUser.department,
      isDepartmentHead: newUser.isDepartmentHead,
      positionTitle: newUser.positionTitle,
      licenseNumber: newUser.licenseNumber,
      phone: newUser.phone,
    };

    const token = signToken(authUser);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada con éxito.',
      user: authUser,
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error interno al crear cuenta.' });
  }
});

// ==========================================
// 2. REGISTER INSTITUCIONAL (Estilo UConnect: Clínica + Admin)
// ==========================================
router.post('/register-clinic', async (req, res) => {
  try {
    const {
      // Datos de la Clínica / Centro de Salud
      clinicName,
      taxId,
      clinicPhone,
      clinicEmail,
      address,
      city,
      facilityType,
      // Datos del Administrador Responsable
      adminName,
      email,
      password,
      positionTitle,
      licenseNumber,
      adminPhone,
    } = req.body;

    if (!clinicName || !adminName || !email || !password) {
      return res.status(400).json({
        error: 'Datos obligatorios incompletos: Nombre de clínica, Administrador, Email y Contraseña.',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario registrado con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Transacción: crear Clínica y crear Usuario Administrador
    const [clinic, adminUser] = await prisma.$transaction(async (tx) => {
      const newClinic = await tx.clinic.create({
        data: {
          name: clinicName.trim(),
          taxId: taxId ? taxId.trim() : null,
          phone: clinicPhone ? clinicPhone.trim() : null,
          email: clinicEmail ? clinicEmail.toLowerCase().trim() : null,
          address: address ? address.trim() : null,
          city: city ? city.trim() : null,
          facilityType: facilityType || 'Policonsultorio',
        },
      });

      const newAdmin = await tx.user.create({
        data: {
          clinicId: newClinic.id,
          email: email.toLowerCase().trim(),
          password: passwordHash,
          name: adminName.trim(),
          role: 'ADMIN',
          department: 'Dirección Médica',
          isDepartmentHead: true,
          positionTitle: positionTitle || 'Director/a Médico General',
          licenseNumber: licenseNumber ? licenseNumber.trim() : null,
          phone: adminPhone ? adminPhone.trim() : null,
        },
        include: { clinic: true },
      });

      return [newClinic, newAdmin];
    });

    const authUser: AuthUser = {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: 'ADMIN',
      clinicId: clinic.id,
      clinicName: clinic.name,
      department: adminUser.department,
      isDepartmentHead: true,
      positionTitle: adminUser.positionTitle,
      licenseNumber: adminUser.licenseNumber,
      phone: adminUser.phone,
    };

    const token = signToken(authUser);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Institución y Administrador registrados con éxito.',
      user: authUser,
      clinic,
      token,
    });
  } catch (error) {
    console.error('Error al registrar clínica:', error);
    return res.status(500).json({ error: 'Error al procesar el registro institucional' });
  }
});

// ==========================================
// 3. GENERAR INVITACIÓN PARA EMPLEADO (Por Superiores)
// ==========================================
router.post('/invitations', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;

  // Solo ADMIN o Jefes de departamento pueden invitar personal
  const canInvite = user.role === 'ADMIN' || user.isDepartmentHead;
  if (!canInvite) {
    return res.status(403).json({
      error: 'Solo el Administrador o los Jefes de Departamento tienen permisos para emitir invitaciones.',
    });
  }

  try {
    const { recipientName, invitedEmail, role, department, positionTitle, isDepartmentHead } = req.body;

    if (!role || !department) {
      return res.status(400).json({ error: 'El rol y el departamento son obligatorios para la invitación.' });
    }

    // Si es Jefe de departamento pero no Admin, su invitación debe corresponder a su propio departamento
    if (user.role !== 'ADMIN' && user.department && department !== user.department) {
      return res.status(403).json({
        error: `Como Jefe/a de ${user.department}, solo puedes generar invitaciones para el departamento de ${user.department}.`,
      });
    }

    // Obtener clínica del usuario que invita
    let clinicId = user.clinicId;
    if (!clinicId) {
      const defaultClinic = await prisma.clinic.findFirst();
      clinicId = defaultClinic?.id || '';
    }

    // Token criptográfico único
    const inviteToken = `inv_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

    const invitation = await prisma.invitation.create({
      data: {
        token: inviteToken,
        clinicId,
        createdById: user.id,
        recipientName: recipientName ? recipientName.trim() : null,
        invitedEmail: invitedEmail ? invitedEmail.toLowerCase().trim() : null,
        role: role as string,
        department: department.trim(),
        positionTitle: positionTitle ? positionTitle.trim() : null,
        isDepartmentHead: !!isDepartmentHead,
        status: 'PENDIENTE',
        expiresAt,
      },
      include: {
        clinic: true,
        createdBy: { select: { name: true, role: true, department: true } },
      },
    });

    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/register?invite=${inviteToken}`;

    return res.status(201).json({
      success: true,
      message: 'Invitación creada exitosamente.',
      invitation,
      inviteUrl,
    });
  } catch (error) {
    console.error('Error al generar invitación:', error);
    return res.status(500).json({ error: 'Error al generar la invitación' });
  }
});

// GET /api/auth/invitations (Listar invitaciones)
router.get('/invitations', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  try {
    const invitations = await prisma.invitation.findMany({
      where: user.role === 'ADMIN' ? undefined : { createdById: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        clinic: { select: { name: true } },
        createdBy: { select: { name: true, department: true } },
      },
    });

    return res.json({ invitations });
  } catch (error) {
    console.error('Error al listar invitaciones:', error);
    return res.status(500).json({ error: 'Error al consultar invitaciones' });
  }
});

// ==========================================
// 4. VALIDAR LINK DE INVITACIÓN
// ==========================================
router.get('/invitations/validate/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        clinic: true,
        createdBy: { select: { name: true, department: true, positionTitle: true } },
      },
    });

    if (!invitation) {
      return res.status(404).json({ valid: false, error: 'Enlace de invitación no encontrado o inválido.' });
    }

    if (invitation.status !== 'PENDIENTE') {
      return res.status(400).json({ valid: false, error: `Esta invitación ya fue ${invitation.status.toLowerCase()}.` });
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return res.status(400).json({ valid: false, error: 'La invitación ha expirado. Solicita un nuevo enlace a tu superior.' });
    }

    return res.json({
      valid: true,
      invitation: {
        token: invitation.token,
        clinicName: invitation.clinic.name,
        role: invitation.role,
        department: invitation.department,
        positionTitle: invitation.positionTitle,
        recipientName: invitation.recipientName,
        invitedEmail: invitation.invitedEmail,
        createdByName: invitation.createdBy.name,
        createdByDepartment: invitation.createdBy.department,
      },
    });
  } catch (error) {
    console.error('Error al validar invitación:', error);
    return res.status(500).json({ valid: false, error: 'Error al verificar la invitación' });
  }
});

// ==========================================
// 5. REGISTRO DE EMPLEADO CON INVITACIÓN
// ==========================================
router.post('/register-invite', async (req, res) => {
  try {
    const { token, name, email, password, licenseNumber, specialty, phone } = req.body;

    if (!token || !name || !email || !password) {
      return res.status(400).json({ error: 'Token de invitación, nombre, email y contraseña requeridos.' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { clinic: true },
    });

    if (!invitation || invitation.status !== 'PENDIENTE' || new Date() > new Date(invitation.expiresAt)) {
      return res.status(400).json({ error: 'La invitación no es válida o ha expirado.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Ya existe un usuario con este correo electrónico.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          clinicId: invitation.clinicId,
          email: email.toLowerCase().trim(),
          password: passwordHash,
          name: name.trim(),
          role: invitation.role,
          department: invitation.department,
          isDepartmentHead: invitation.isDepartmentHead,
          positionTitle: invitation.positionTitle,
          specialty: specialty ? specialty.trim() : null,
          licenseNumber: licenseNumber ? licenseNumber.trim() : null,
          phone: phone ? phone.trim() : null,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACEPTADA',
          acceptedAt: new Date(),
        },
      }),
    ]);

    const authUser: AuthUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as any,
      clinicId: newUser.clinicId,
      clinicName: invitation.clinic.name,
      department: newUser.department,
      isDepartmentHead: newUser.isDepartmentHead,
      positionTitle: newUser.positionTitle,
      specialty: newUser.specialty,
      licenseNumber: newUser.licenseNumber,
    };

    const jwtToken = signToken(authUser);

    res.cookie(COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: '¡Registro de empleado completado con éxito! Bienvenido al equipo.',
      user: authUser,
      token: jwtToken,
    });
  } catch (error) {
    console.error('Error en registro de empleado:', error);
    return res.status(500).json({ error: 'Error al registrar credenciales de empleado' });
  }
});

// ==========================================
// 6. USUARIO ACTUAL & LOGOUT
// ==========================================
router.get('/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false, user: null });
  }
  const permissions = ROLE_PERMISSIONS[req.user.role];
  return res.json({
    authenticated: true,
    user: req.user,
    permissions,
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'Sesión cerrada' });
});

// Switch rápido para pruebas demo
router.post('/switch-demo', async (req, res) => {
  try {
    const { role } = req.body;
    let targetEmail = 'admin@medisync.com';
    if (role === 'MEDICO') targetEmail = 'medico1@medisync.com';
    else if (role === 'ENFERMERO') targetEmail = 'enfermero@medisync.com';
    else if (role === 'RECEPCION') targetEmail = 'recepcion@medisync.com';
    else if (role === 'FARMACIA') targetEmail = 'farmacia@medisync.com';
    else if (role === 'ADMIN') targetEmail = 'admin@medisync.com';

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { clinic: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado para el rol' });
    }

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      clinicId: user.clinicId,
      clinicName: user.clinic?.name || null,
      department: user.department,
      isDepartmentHead: user.isDepartmentHead,
      positionTitle: user.positionTitle,
      specialty: user.specialty,
      licenseNumber: user.licenseNumber,
    };

    const token = signToken(authUser);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true, user: authUser, token });
  } catch (error) {
    console.error('Error al cambiar rol demo:', error);
    return res.status(500).json({ error: 'Error al cambiar de rol' });
  }
});

export default router;
