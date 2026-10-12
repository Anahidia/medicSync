import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authMiddleware } from './middlewares/auth.middleware';

// Cargar variables de entorno
dotenv.config();

// Rutas
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import ehrRoutes from './routes/ehr.routes';
import appointmentRoutes from './routes/appointment.routes';
import shiftRoutes from './routes/shift.routes';
import timeclockRoutes from './routes/timeclock.routes';
import inventoryRoutes from './routes/inventory.routes';
import botRoutes from './routes/bot.routes';
import referralRoutes from './routes/referral.routes';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middlewares globales
app.use(
  cors({
    origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/ehr', ehrRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/timeclock', timeclockRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/referrals', referralRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'MediSync Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🏥 MediSync Backend API ejecutándose en http://localhost:${PORT}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/api/health`);
});
