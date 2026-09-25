const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/cotizar', (req, res) => {
  const { peso, largo, ancho, alto } = req.body;

  const volumen = (largo * ancho * alto) / 6000;
  const pesoFinal = Math.max(peso, volumen);
  const total = 3500 + pesoFinal * 1200;

  res.json({ precio: total });
});

app.listen(3001, () => {
  console.log('Backend funcionando');
});