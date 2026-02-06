const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// 📱 Importar sistema de notificações Telegram
const { getTelegramNotifier } = require('./telegram-notifier');
const telegramNotifier = getTelegramNotifier();

console.log('🌐 Iniciando servidor CLIENTE - MacDavis...');
console.log('Node version:', process.version);
console.log('Diretório:', __dirname);

const app = express();
const PORT = 3000;

// Desativar logs de CSS inline e requisições CSS
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

console.log = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('.css') || (msg.includes('inline') && msg.includes('style'))) return;
  originalLog.apply(console, args);
};

console.warn = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('.css') || msg.includes('inline') || (msg.includes('style') && msg.includes('attribute'))) return;
  originalWarn.apply(console, args);
};

console.error = function(...args) {
  const msg = args.join(' ');
  if (msg.includes('.css') && !msg.includes('erro')) return;
  originalError.apply(console, args);
};

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Anti-cache headers + Mobile optimizations
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  // Headers otimizados para mobile
  res.set('Connection', 'keep-alive');
  res.set('Keep-Alive', 'timeout=65');
  next();
});

// Serve catalog.html with injected APP_VERSION from package.json (prevents manual updates)
app.get('/catalog.html', (req, res, next) => {
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    let appVersion = '0.0.0';
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg && pkg.version) appVersion = String(pkg.version);
      } catch (e) {
        console.warn('Could not read package.json for version injection:', e.message);
      }
    }

    const htmlPath = path.join(__dirname, 'catalog.html');
    if (!fs.existsSync(htmlPath)) return next();
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Replace any APP_VERSION definition in the file with the package.json version
    html = html.replace(/const\s+APP_VERSION\s*=\s*['"][^'"]*['"];?/, `const APP_VERSION = '${appVersion}';`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Error serving catalog.html with version injection:', err && err.message);
    next();
  }
});

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Arquivos de dados
const DATA_FILE = path.join(__dirname, 'data.json');
const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');

// Sistema de lock para evitar race conditions no writeData
let isWritingData = false;
const writeQueue = [];

// Funções auxiliares
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('❌ Erro lendo data.json:', e.message);
    return [];
  }
}

function writeData(list) {
  return new Promise((resolve) => {
    writeQueue.push({ list, resolve });
    processWriteQueue();
  });
}

function processWriteQueue() {
  if (isWritingData || writeQueue.length === 0) return;
  
  isWritingData = true;
  const { list, resolve } = writeQueue.shift();
  
  try {
    // Validar JSON antes de escrever
    const jsonString = JSON.stringify(list, null, 2);
    JSON.parse(jsonString); // Validação
    
    fs.writeFileSync(DATA_FILE, jsonString, 'utf8');
    console.log('✅ data.json salvo com sucesso');
    resolve(true);
  } catch (e) {
    console.error('❌ Erro escrevendo data.json:', e.message);
    resolve(false);
  } finally {
    isWritingData = false;
    // Processar próximo da fila
    setTimeout(processWriteQueue, 10);
  }
}

function readMotorcycles() {
  try {
    if (!fs.existsSync(MOTORCYCLES_FILE)) {
      console.log('⚠️ Arquivo motorcycles.json não existe');
      return [];
    }
    const raw = fs.readFileSync(MOTORCYCLES_FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    console.log('✅ Motocicletas carregadas:', data.length);
    return data;
  } catch (e) {
    console.error('❌ Erro lendo motorcycles.json:', e.message);
    return [];
  }
}

// ============= ROTAS API - APENAS LEITURA PARA CLIENTES =============

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'client',
    timestamp: new Date().toISOString(),
    message: 'API Cliente funcionando'
  });
});

// GET - Listar motocicletas (somente leitura) - APENAS DISPONÍVEIS
app.get('/api/motorcycles', (req, res) => {
  try {
    console.log('📡 [CLIENTE] GET /api/motorcycles');
    const motorcycles = readMotorcycles();
    // Filtrar apenas motocicletas disponíveis (status !== 'vendido')
    const availableMotorcycles = motorcycles.filter(moto => {
      return moto.status !== 'vendido';
    });
    console.log('✅ Total de motos:', motorcycles.length);
    console.log('✅ Motos disponíveis:', availableMotorcycles.length);
    console.log('🚫 Motos vendidas (ocultas):', motorcycles.length - availableMotorcycles.length);
    res.json(availableMotorcycles);
  } catch (e) {
    console.error('❌ Erro na API motorcycles:', e.message);
    res.status(500).json({ error: 'Erro ao carregar motocicletas' });
  }
});

// GET - Listar agendamentos
app.get('/api/appointments', (req, res) => {
  try {
    console.log('📡 [CLIENTE] GET /api/appointments');
    const appointments = readData();
    console.log('✅ Enviando', appointments.length, 'agendamentos');
    res.json(appointments);
  } catch (e) {
    console.error('❌ Erro na API appointments:', e.message);
    res.status(500).json({ error: 'Erro ao carregar agendamentos' });
  }
});

// POST - Criar novo agendamento (clientes podem agendar)
app.post('/api/appointments', async (req, res) => {
  try {
    console.log('📡 [CLIENTE] POST /api/appointments');
    console.log('📦 Dados recebidos (req.body):', JSON.stringify(req.body, null, 2));
    const list = readData();
    
    // Normalizar campos (aceitar tanto inglês quanto português)
    const appointmentData = req.body.data || req.body.date;
    const appointmentHorario = req.body.horario || req.body.time;
    
    // Verificar se o horário já está ocupado (independente da moto)
    // Apenas agendamentos PENDENTES/AGENDADOS bloqueiam o horário
    const duplicate = list.find(item => {
      const status = item.status || 'agendado';
      return (item.data || item.date) === appointmentData &&
             (item.horario || item.time) === appointmentHorario &&
             status !== 'cancelado' &&
             status !== 'realizado';
    });
    
    if (duplicate) {
      console.log('⚠️ Horário já ocupado:', {
        data: appointmentData,
        horario: appointmentHorario
      });
      return res.status(409).json({ 
        error: 'Este horário já está ocupado. Por favor, escolha outro horário.' 
      });
    }
    
    // Criar objeto normalizado com campos em português
    const newItem = {
      id: req.body.id || (Date.now() + '-' + Math.random().toString(36).substr(2, 9)),
      cliente: req.body.cliente || req.body.name || 'Cliente',
      email: req.body.email || '',
      telefone: req.body.telefone || req.body.phone || '',
      servico: req.body.servico || '',
      servicoId: req.body.servicoId || req.body.motorcycle || '',
      data: appointmentData,
      horario: appointmentHorario,
      observacoes: req.body.observacoes || req.body.notes || '',
      timestamp: req.body.timestamp || new Date().toISOString(),
      status: req.body.status || 'agendado',
      createdAt: new Date().toISOString()
    };
    list.push(newItem);
    
    const success = await writeData(list);
    if (success) {
      console.log('✅ Agendamento salvo:', newItem.id);
      
      // 📱 Enviar notificação via Telegram
      if (telegramNotifier && telegramNotifier.enabled) {
        await telegramNotifier.notifyNewAppointment(newItem);
        console.log('📱 Notificação Telegram enviada');
      }
      
      res.json(newItem);
    } else {
      res.status(500).json({ error: 'Erro ao salvar agendamento' });
    }
  } catch (e) {
    console.error('❌ Erro salvando agendamento:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH - Cliente confirmar presença
app.patch('/api/appointments/:id/confirm', async (req, res) => {
  try {
    console.log('📡 [CLIENTE] PATCH /api/appointments/' + req.params.id + '/confirm');
    
    const appointments = readData();
    const index = appointments.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    // Verificar se já está confirmado
    if (appointments[index].confirmedByClient) {
      return res.status(400).json({ error: 'Você já confirmou presença neste agendamento' });
    }
    
    // Verificar se está cancelado
    if (appointments[index].status === 'cancelado') {
      return res.status(400).json({ error: 'Não é possível confirmar agendamento cancelado' });
    }
    
    // Marcar confirmação do cliente (MAS MANTER STATUS COMO PENDING/AGENDADO)
    const currentStatus = appointments[index].status || 'pending';
    
    appointments[index] = {
      ...appointments[index],
      status: currentStatus, // FORÇAR manter o status original
      confirmedByClient: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: req.body.confirmedBy || 'Cliente',
      updatedAt: new Date().toISOString()
    };
    
    console.log('📋 Status MANTIDO:', appointments[index].status);
    console.log('📋 confirmedByClient:', appointments[index].confirmedByClient);
    
    const success = await writeData(appointments);
    if (success) {
      console.log('✅ Presença confirmada:', appointments[index].id);
      console.log('✅ Status FINAL:', appointments[index].status);
      res.json(appointments[index]);
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao confirmar agendamento:', e.message);
    res.status(500).json({ error: 'Erro ao confirmar agendamento: ' + e.message });
  }
});

// PATCH - Cliente cancelar agendamento
app.patch('/api/appointments/:id/cancel', async (req, res) => {
  try {
    console.log('📡 [CLIENTE] PATCH /api/appointments/' + req.params.id + '/cancel');
    console.log('📦 Motivo:', req.body.cancelReason || 'Não informado');
    
    const appointments = readData();
    const index = appointments.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    // Verificar se já está cancelado
    if (appointments[index].status === 'cancelado') {
      return res.status(400).json({ error: 'Agendamento já está cancelado' });
    }
    
    // Verificar se já foi realizado
    if (appointments[index].status === 'realizado') {
      return res.status(400).json({ error: 'Não é possível cancelar agendamento já realizado' });
    }
    
    // Marcar como cancelado
    appointments[index] = {
      ...appointments[index],
      status: 'cancelado',
      canceledAt: new Date().toISOString(),
      cancelReason: req.body.cancelReason || 'Cancelado pelo cliente',
      canceledBy: req.body.canceledBy || 'Cliente',
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeData(appointments);
    if (success) {
      console.log('❌ Agendamento cancelado pelo cliente:', appointments[index].id);
      console.log('📝 Motivo:', appointments[index].cancelReason);
      
      // 📱 Notificar admin via Telegram sobre cancelamento
      telegramNotifier.notifyCanceledAppointment({
        id: appointments[index].id,
        name: appointments[index].cliente || appointments[index].name,
        phone: appointments[index].telefone || appointments[index].phone,
        date: appointments[index].data || appointments[index].date,
        time: appointments[index].horario || appointments[index].time,
        cancelReason: appointments[index].cancelReason,
        canceledBy: appointments[index].canceledBy
      }).catch(err => {
        console.error('⚠️ Erro ao enviar notificação Telegram:', err.message);
      });
      
      res.json(appointments[index]);
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao cancelar agendamento:', e.message);
    res.status(500).json({ error: 'Erro ao cancelar agendamento: ' + e.message });
  }
});

// Bloquear rotas administrativas
app.post('/api/motorcycles', (req, res) => {
  console.log('🚫 [CLIENTE] Tentativa de POST em motorcycles bloqueada');
  res.status(403).json({ error: 'Operação não permitida. Use o painel administrativo.' });
});

app.put('/api/motorcycles/:id', (req, res) => {
  console.log('🚫 [CLIENTE] Tentativa de PUT em motorcycles bloqueada');
  res.status(403).json({ error: 'Operação não permitida. Use o painel administrativo.' });
});

app.delete('/api/motorcycles/:id', (req, res) => {
  console.log('🚫 [CLIENTE] Tentativa de DELETE em motorcycles bloqueada');
  res.status(403).json({ error: 'Operação não permitida. Use o painel administrativo.' });
});

// Rota raiz redireciona para login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Erro no middleware:', error.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
  console.log('⚠️ Página não encontrada:', req.url);
  res.status(404).send(`
    <h1>404 - Página não encontrada</h1>
    <p>URL: ${req.url}</p>
    <a href="/">← Voltar ao início</a>
  `);
});

// Iniciar servidor
console.log('🚀 Iniciando servidor CLIENTE na porta', PORT);
const server = app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // Encontrar IP local na rede
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIP = net.address;
                break;
            }
        }
    }
    
    console.log('✅ Servidor CLIENTE rodando!');
    console.log('📁 Servindo arquivos de:', __dirname);
    console.log('🔗 API disponível em /api/*');
    console.log('👥 Acesso: Clientes (somente leitura de motos + agendamento)');
    console.log('');
    console.log('🌐 ACESSO LOCAL:');
    console.log('   http://localhost:' + PORT);
    console.log('   http://127.0.0.1:' + PORT);
    console.log('');
    console.log('📱 ACESSO VIA REDE (CELULAR):');
    console.log('   http://' + localIP + ':' + PORT);
    console.log('');
    console.log('🔄 Use Ctrl+C para parar');
    
    // ⚙️ Configurações de timeout para dispositivos móveis
    server.timeout = 120000; // 2 minutos
    server.keepAliveTimeout = 65000; // 65 segundos
    server.headersTimeout = 66000; // 66 segundos (maior que keepAlive)
    console.log('⚙️ Timeouts configurados para mobile (120s)');
    console.log('🔥 Keep-alive habilitado (65s)');
    console.log('📶 Headers timeout: 66s');
    
    // Teste rápido
    setTimeout(() => {
        console.log('🧪 Testando funcionalidades...');
        const allMotorcycles = readMotorcycles();
        const availableMotorcycles = allMotorcycles.filter(m => m.status !== 'vendido');
        console.log('✅ Motocicletas carregadas:', allMotorcycles.length);
        console.log('🏍️ Motocicletas disponíveis:', availableMotorcycles.length);
        console.log('🚫 Motos vendidas (ocultas):', allMotorcycles.length - availableMotorcycles.length);
        const appointments = readData();
        console.log('📅 Agendamentos existentes:', appointments.length);
        console.log('✅ Servidor CLIENTE pronto!');
    }, 1000);
    
}).on('error', (err) => {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error('💡 Porta', PORT, 'já está em uso');
    }
    process.exit(1);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
    console.error('❌ Erro não tratado:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Promise rejeitada:', reason);
});

console.log('🎯 Configuração do servidor CLIENTE concluída!');
