import express, { type Request, type Response } from 'express';
import config from './config/config.js';
import sequelize from './db.js';
import initializeRoutes from './routes/index.js';

const app: express.Application = express();

const { port } = config;

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Congratulations Server is running!' });
});

app.listen(port, async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (err) {
    console.error('Unable to connect to the database:', err);
  }

  console.log(`Server is listening at http://localhost:${port}`);
});

initializeRoutes(app);

app.use(
  (err: Error, req: Request, res: Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  },
);

export default app;
