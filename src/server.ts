import 'dotenv/config';

import App from 'app';

import { HealthCheckController } from 'health-check/health-check.controller';
import { VerifyController } from 'verify/verify.controller';

const app = new App([new HealthCheckController(), new VerifyController()]);

app.listen();
