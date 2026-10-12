# MediSync — Sistema de Gestión para Policonsultorios y Clínicas

Arquitectura desacoplada en carpetas separadas: **Frontend (Next.js)** y **Backend (Express + Prisma)**.

---

## 📁 Estructura del Proyecto

```text
medicSync/
├── frontend/                     # Aplicación Web Frontend (Next.js, React 19, Tailwind CSS)
│   ├── src/
│   │   ├── app/                  # Páginas y vistas clínicas (EHR, Turnos, Guardias, Recepción, Farmacia)
│   │   ├── components/           # Componentes UI (Sidebar con RBAC, Header con Fichaje en vivo)
│   │   ├── context/              # AuthContext (Sesión y selector de roles)
│   │   └── types/                # Tipos de TypeScript e interfaces
│   ├── next.config.ts            # Proxy rewrites hacia http://localhost:4000/api
│   ├── .env.local
│   └── package.json
│
├── backend/                      # Servidor API REST (Express, Node.js, Prisma ORM)
│   ├── prisma/
│   │   ├── schema.prisma         # Modelos: Pacientes, EHR, Turnos, Guardias, Fichaje, Insumos
│   │   ├── seed.js               # Sembrado con datos clínicos realistas
│   │   └── dev.db                # Base de datos SQLite
│   ├── src/
│   │   ├── routes/               # Rutas REST (/auth, /patients, /ehr, /appointments, /shifts, /timeclock, /inventory, /bot)
│   │   ├── middlewares/          # Autenticación JWT y control estricto RBAC
│   │   ├── lib/                  # PrismaClient singleton
│   │   └── server.ts             # Servidor Express (Puerto 4000)
│   ├── .env                      # Configuración de base de datos y puertos
│   └── package.json
│
├── docker-compose.yml            # Orquestación de PostgreSQL y n8n (opcional para producción)
├── n8n-medisync-workflow.json    # Plantilla de automatización n8n lista para importar
└── package.json                  # Scripts del espacio de trabajo raíz
```

---

## 🚀 Cómo Iniciar el Proyecto

Puedes iniciar los servicios desde la raíz o directamente dentro de cada carpeta:

### Opción A: Desde la Raíz del Proyecto

1. **Iniciar el Backend (Puerto 4000)**:
   ```bash
   npm run dev:back
   ```

2. **Iniciar el Frontend (Puerto 3000)** (en otra terminal):
   ```bash
   npm run dev:front
   ```

---

### Opción B: Entrando a cada carpeta

1. **Backend**:
   ```bash
   cd backend
   npm run dev
   ```
   > API disponible en `http://localhost:4000/api` (Healthcheck en `/api/health`).

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   > Abre tu navegador en **`http://localhost:3000`**.

---

## 🗄️ Base de Datos y Datos de Prueba

La base de datos SQLite en `backend/prisma/dev.db` ya está creada y sembrada con pacientes, historias clínicas, turnos, guardias e insumos.

Para volver a sembrar los datos de prueba en cualquier momento:
```bash
npm run db:seed
```

Para abrir el explorador visual de la base de datos (Prisma Studio):
```bash
npm run db:studio
```

---

## 🔑 Credenciales de Acceso por Roles (Demostración)

| Rol Clínico | Correo | Contraseña | Permisos Destacados |
|---|---|---|---|
| **Director Médico (Admin)** | `admin@medisync.com` | `123456` | Acceso global a todos los módulos y auditoría. |
| **Médico (Cardiología)** | `medico1@medisync.com` | `123456` | Historias Clínicas (EHR), diagnóstico CIE-10, recetas y agenda. |
| **Enfermero (Triaje)** | `enfermero@medisync.com` | `123456` | Signos vitales, triaje, notas de enfermería y fichaje de guardia. |
| **Recepción / Admisión** | `recepcion@medisync.com` | `123456` | Admisión, turnos, recepción 1-click y llamador de sala. *(EHR bloqueado)* |
| **Farmacia y Stock** | `farmacia@medisync.com` | `123456` | Control de stock, lotes, caducidades y egresos de insumos. |

*Nota: También puedes alternar de rol al instante con 1 click usando el **Selector de Rol Activo** en la barra superior.*
