const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const sources = ['Thiago', 'Bruno', 'Finclass'];
const pmps = ['PMP1', 'PMP2', 'PMP3', 'PMP4'];

function generateDynamicSummary() {
  return sources.map(source => {
    return {
      leadsource: source,
      items: pmps.map(pmp => {
        const total = Math.floor(Math.random() * 80) + 20; // 20 to 100
        const ja_existiam = -Math.floor(total * (Math.random() * 0.2 + 0.1)); 
        const varejo = -Math.floor(total * (Math.random() * 0.15 + 0.05));
        const rem = total + ja_existiam + varejo; 
        const elegiveis_portfel = Math.max(0, Math.floor(rem / 2) + Math.floor(Math.random() * 6 - 3));
        const elegiveis_g = rem - elegiveis_portfel;
        
        return {
          name: pmp,
          total,
          ja_existiam,
          varejo,
          elegiveis_portfel,
          elegiveis_g
        };
      })
    };
  });
}

app.get('/api/leads/summary', (req, res) => {
  res.json(generateDynamicSummary());
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
