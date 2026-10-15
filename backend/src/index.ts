import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import counselorRoutes from './routes/counselorRoutes';
import bookingRoutes from './routes/bookingRoutes';
import enrollmentRoutes from './routes/enrollmentRoutes';
import courseRoutes from './routes/courseRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/api/courses', courseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/counselors', counselorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
