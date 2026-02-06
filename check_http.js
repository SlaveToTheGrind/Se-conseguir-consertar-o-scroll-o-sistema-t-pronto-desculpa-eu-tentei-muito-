const http = require('http');
const opts = { host: 'localhost', port: 3000, path: '/' };
const req = http.get(opts, res => {
  console.log('STATUS:' + res.statusCode);
  res.on('data', ()=>{});
  res.on('end', ()=>process.exit(0));
});
req.on('error', err => { console.error('ERR:'+err.message); process.exit(2); });
