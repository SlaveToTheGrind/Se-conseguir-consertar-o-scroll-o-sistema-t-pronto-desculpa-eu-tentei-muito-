const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000';

async function run() {
  console.log('Creating appointment...');
  const appt = { name: 'API Test', phone: '(99) 99999-9999', motorcycle: 'honda-cb500', date: '2025-12-12', time: '09:00', notes: 'automated test' };
  let res = await fetch(BASE + '/api/appointments', { method: 'POST', body: JSON.stringify(appt), headers: { 'Content-Type': 'application/json' } });
  console.log('POST status', res.status);
  const created = await res.json();
  console.log('Created', created);

  res = await fetch(BASE + '/api/appointments');
  console.log('GET status', res.status);
  const list = await res.json();
  console.log('List length', list.length || list.value?.length || 0);

  const id = created.id;
  res = await fetch(BASE + '/api/appointments/' + id, { method: 'DELETE' });
  console.log('DELETE status', res.status);
  const removed = await res.json();
  console.log('Removed', removed);

  console.log('data.json content:');
  console.log(fs.readFileSync(path.join(__dirname, '..', 'data', 'data.json'),'utf8'));
}

run().catch(e => console.error(e));
