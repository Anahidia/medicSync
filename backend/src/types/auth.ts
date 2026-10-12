export type UserRole = 'ADMIN' | 'MEDICO' | 'ENFERMERO' | 'RECEPCION' | 'FARMACIA';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clinicId?: string | null;
  clinicName?: string | null;
  department?: string | null;
  isDepartmentHead?: boolean;
  positionTitle?: string | null;
  specialty?: string | null;
  licenseNumber?: string | null;
  phone?: string | null;
}

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canViewMedicalRecords: true,
    canEditClinicalEvolution: true,
    canPrescribe: true,
    canRecordVitalSigns: true,
    canManageAppointments: true,
    canReceptionCheckIn: true,
    canManageShifts: true,
    canClockInOut: true,
    canManageInventory: true,
    canViewAdminPanel: true,
    canInviteStaff: true,
    canManageReferrals: true,
  },
  MEDICO: {
    canViewMedicalRecords: true,
    canEditClinicalEvolution: true,
    canPrescribe: true,
    canRecordVitalSigns: true,
    canManageAppointments: true,
    canReceptionCheckIn: true,
    canManageShifts: false,
    canClockInOut: true,
    canManageInventory: false,
    canViewAdminPanel: false,
    canInviteStaff: true, // Si es Jefe de Departamento puede invitar a su equipo
    canManageReferrals: true, // Puede crear y seguir derivaciones médicas
  },
  ENFERMERO: {
    canViewMedicalRecords: true,
    canEditClinicalEvolution: false,
    canPrescribe: false,
    canRecordVitalSigns: true,
    canManageAppointments: true,
    canReceptionCheckIn: true,
    canManageShifts: false,
    canClockInOut: true,
    canManageInventory: true,
    canViewAdminPanel: false,
    canInviteStaff: true, // Si es Jefa de Enfermería puede invitar a su equipo
    canManageReferrals: false,
  },
  RECEPCION: {
    canViewMedicalRecords: false,
    canEditClinicalEvolution: false,
    canPrescribe: false,
    canRecordVitalSigns: false,
    canManageAppointments: true,
    canReceptionCheckIn: true,
    canManageShifts: false,
    canClockInOut: true,
    canManageInventory: false,
    canViewAdminPanel: false,
    canInviteStaff: false,
    canManageReferrals: false,
  },
  FARMACIA: {
    canViewMedicalRecords: false,
    canEditClinicalEvolution: false,
    canPrescribe: false,
    canRecordVitalSigns: false,
    canManageAppointments: false,
    canReceptionCheckIn: false,
    canManageShifts: false,
    canClockInOut: true,
    canManageInventory: true,
    canViewAdminPanel: false,
    canInviteStaff: false,
    canManageReferrals: false,
  },
};

export function checkPermission(
  role: UserRole,
  permission: keyof (typeof ROLE_PERMISSIONS)['ADMIN']
): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}
