const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

// Now server.js lives in server/, data lives in ../data, public static in ../public
const DATA_FILE = path.join(__dirname, '..', 'data', 'data.json');
const MOTORCYCLES_FILE = path.join(__dirname, '..', 'data', 'motorcycles.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve the frontend from ../public
app.use(express.static(path.join(__dirname, '..', 'public')));
// Also serve images/ from the repo root at /images
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('Erro lendo data.json', e);
    return [];
  }
}

function writeData(list) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Erro escrevendo data.json', e);
  }
}

app.get('/api/appointments', (req, res) => {
  const list = readData();
  res.json(list);
});

app.get('/api/motorcycles', (req, res) => {
  try {
    if (!fs.existsSync(MOTORCYCLES_FILE)) return res.status(404).json({ error: 'motorcycles.json not found' });
    const raw = fs.readFileSync(MOTORCYCLES_FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    return res.json(data);
  } catch (e) {
    console.error('Erro lendo motorcycles.json', e);
    return res.status(500).json({ error: 'Erro lendo motorcycles.json' });
  }
});

app.post('/api/appointments', (req, res) => {
  const appt = req.body || {};
  const motorcycle = appt.motorcycle || appt.service;
  if (!appt.name || !motorcycle || !appt.date || !appt.time) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const list = readData();
  const conflict = list.find(a => {
    const m = a.motorcycle || a.service;
    return m === motorcycle && a.date === appt.date && a.time === appt.time;
  });
  if (conflict) {
    return res.status(409).json({ error: 'Conflito: já existe agendamento para esta moto nesta data/horário' });
  }

  const id = appt.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2));
  const record = { id, name: appt.name, phone: appt.phone || '', motorcycle, date: appt.date, time: appt.time, notes: appt.notes || '' };
  list.push(record);
  writeData(list);
  res.status(201).json(record);
});

app.delete('/api/appointments/:id', (req, res) => {
  const id = req.params.id;
  const list = readData();
  const idx = list.findIndex(a => a.id === id);
  const idxByNumber = Number(id);
  const indexToUse = idx >= 0 ? idx : (Number.isInteger(idxByNumber) && idxByNumber >= 0 && idxByNumber < list.length ? idxByNumber : -1);
  if (indexToUse === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado' });
  }
  const removed = list.splice(indexToUse, 1)[0];
  writeData(list);
  res.json(removed);
});

app.delete('/api/appointments', (req, res) => {
  writeData([]);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
