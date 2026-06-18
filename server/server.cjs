const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { resetState } = require('./state');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

resetState(1000);

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
