const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const sources = ['Thiago', 'Bruno', 'Finclass'];
const pmps = ['PMP1', 'PMP2', 'PMP3', 'PMP4'];

let simulationInterval = null;
let isRunning = false;

function generatePhone() {
  return `(11) 9${Math.floor(Math.random() * 8999) + 1000}-${Math.floor(Math.random() * 8999) + 1000}`;
}

async function simulateIncomingLeads() {
  const leadsToInsert = [];
  
  // Reduce generation flow drastically: only 1 to 3 leads *total* per tick (every 5s)
  const numLeadsThisTick = Math.floor(Math.random() * 3) + 1; 
  
  for(let i=0; i<numLeadsThisTick; i++) {
    // Pick a completely random source and pmp for this tiny batch
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const randomPmp = pmps[Math.floor(Math.random() * pmps.length)];
    
    const r = Math.random();
    let canal = 'Elegíveis G'; 
    if (r < 0.15) canal = 'Já existiam';
    else if (r < 0.30) canal = 'Varejo';
    else if (r < 0.65) canal = 'Elegíveis Portfel';

    leadsToInsert.push({
      nome: `Lead C-${Math.floor(Math.random() * 99999)}`,
      canal: canal,
      pmp: randomPmp,
      leadsource: randomSource,
      renda: 'R$ ' + (Math.floor(Math.random() * 10) + 5) + 'k',
      patrimonio: 'R$ ' + (Math.floor(Math.random() * 100) + 50) + 'k',
      telefone: generatePhone()
    });
  }

  if (leadsToInsert.length > 0) {
    const { error } = await supabase.from('leads').insert(leadsToInsert);
    if (error) console.error("Error inserting leads to Supabase:", error);
  }
}

function startSimulation() {
  if (!simulationInterval) {
    simulationInterval = setInterval(simulateIncomingLeads, 5000);
    isRunning = true;
  }
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    isRunning = false;
  }
}

// Leave it off initially until user clicks the play button to prevent DB flood.
// startSimulation();

app.get('/api/leads/summary', async (req, res) => {
  // Query Supabase for real data aggregation
  const { data, error } = await supabase.from('leads').select('leadsource, pmp, canal');
  if (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }

  const summary = {};
  
  sources.forEach(s => {
    summary[s] = {};
    pmps.forEach(p => {
      summary[s][p] = {
        name: p,
        total: 0,
        ja_existiam: 0,
        varejo: 0,
        elegiveis_portfel: 0,
        elegiveis_g: 0
      };
    });
  });

  if(data) {
    data.forEach(row => {
      const s = row.leadsource;
      const p = row.pmp;
      const c = row.canal;
      
      if(summary[s] && summary[s][p]) {
        summary[s][p].total += 1;
        // The dashboard expects drops as negative
        if(c === 'Já existiam') summary[s][p].ja_existiam -= 1;
        else if(c === 'Varejo') summary[s][p].varejo -= 1;
        else if(c === 'Elegíveis Portfel') summary[s][p].elegiveis_portfel += 1;
        else if(c === 'Elegíveis G') summary[s][p].elegiveis_g += 1;
      }
    });
  }

  // Convert map to array the frontend reads
  const result = sources.map(s => {
    return {
      leadsource: s,
      items: pmps.map(p => summary[s][p])
    }
  });

  res.json(result);
});

app.get('/api/simulation/status', (req, res) => {
  res.json({ isRunning });
});

app.post('/api/simulation/toggle', (req, res) => {
  if (isRunning) {
    stopSimulation();
  } else {
    startSimulation();
  }
  res.json({ isRunning });
});

// Protect against uncaught exceptions crashing the Railway container
process.on('uncaughtException', err => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', err => console.error('Unhandled Rejection:', err));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
