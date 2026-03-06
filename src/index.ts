import express from 'express';
import cors from 'cors';
import chalk from 'chalk';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import chemicalsRoutes from './routes/chemicalsRoutes';
import equipmentInstancesRoutes from './routes/equipmentInstancesRoutes';
import equipmentTypesRoutes from './routes/equipmentTypesRoutes';
import favoritesRoutes from './routes/favoritesRoutes';
import workspacesRoutes from './routes/workspacesRoutes';
import reactionsRoutes from './routes/reactionsRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/chemicals', chemicalsRoutes);
app.use('/equipment-instances', equipmentInstancesRoutes);
app.use('/equipment-types', equipmentTypesRoutes);
app.use('/favorites', favoritesRoutes);
app.use('/workspaces', workspacesRoutes);
app.use('/reactions', reactionsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.listen(port, () => {
  console.log(chalk.green(`✓ Server listening at http://localhost:${port}`));
});