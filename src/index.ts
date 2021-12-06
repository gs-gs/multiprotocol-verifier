import express, { Application, Request, Response } from 'express';

import router from './router';

const app: Application = express();
const port = 8000;

// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health-check', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use(router);

try {
  app.listen(port, (): void => {
    console.log(`Server started on port ${port}`);
  });
} catch (error) {
  console.error(`Error occured: ${error.message}`);
}
