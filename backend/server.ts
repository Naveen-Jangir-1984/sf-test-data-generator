import express from 'express';
import cors from 'cors';
import salesforceRoutes from './routes/salesforce';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/salesforce', salesforceRoutes);

app.listen(5000, () => console.log('Server running on port 5000'));