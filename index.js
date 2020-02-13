import express from 'express';
import cors from 'cors';
import router from './routes/summoner';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.options('*', cors());  // enable pre-flight

app.get('/', (req, res) => (
  res.send(`server running server port on ${PORT}`)
));

app.use('/api/summoner', router);

app.listen(PORT, () => (
  console.log(`your server running ${PORT}`)
))