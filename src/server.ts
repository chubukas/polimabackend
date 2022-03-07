// MODULE IMPORTS
import express, { Application, RequestHandler } from 'express';
import cors from 'cors';
import http from 'http';
import morgan from 'morgan';
import config from './config/config';
import database from './database/connection';

//  ERROR HANDLER MIDDLEWARE
import errorHandler from './server/middlewares/errorHandler';
import adminRoute from './server/routes/adminRoute';

// ROUTERS
import authRouter from './server/routes/authRoute';
import userRoute from './server/routes/userRoute';

import { corsOptions, errorRequest, logger } from './utils';

const app: Application = express();

//*  MIDDLEWARES */
app.use(express.urlencoded({ extended: false, limit: '50mb' }) as RequestHandler);
app.use(express.json({ limit: '50mb' }) as RequestHandler);
app.use(cors(corsOptions));

//ROUTES
const baseRoute = '/api/v1';
app.use(`${baseRoute}/auth`, authRouter);
app.use(`${baseRoute}/admin`, adminRoute);
app.use(`${baseRoute}/user`, userRoute);

app.use(errorHandler);

// ERROR LOG HANDLER
app.use(
    morgan('combined', { stream: { write: (message) => logger.info(message) } }) as RequestHandler
);
app.use(errorRequest);

//* SERVER */
const httpServer = http.createServer(app);

database
    .then(function (res: any) {
        console.log('Database connected::successfully');
    })
    .catch(function (err: any) {
        console.log('Database error:', err);
    });

try {
    httpServer.listen(config.server.port, () => {
        console.info(`Server running on port: ${config.server.port}`);
    });
} catch (err) {
    console.log(err);
}
// polima@2022
