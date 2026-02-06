const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { initBackupScheduler, getBackupScheduler } = require('./backup-scheduler');

console.log('🔧 Iniciando servidor MacDavis...');
console.log('Node version:', process.version);
console.log('Diretório:', __dirname);

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use(express.urlencoded({ extended: true })); // Para processar FormData

// Anti-cache headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Servir arquivos estáticos
app.use(express.static(__dirname));

// Servir PDFs da pasta DOCS Motos
app.use('/DOCS Motos', express.static(path.join(__dirname, 'DOCS Motos')));

// Arquivos de dados
const DATA_FILE = path.join(__dirname, 'data.json');
const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const ADMIN_USERS_FILE = path.join(__dirname, 'admin_users.json');

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
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('❌ Erro escrevendo data.json:', e.message);
    return false;
  }
}

function readMotorcycles() {
  try {
    if (!fs.existsSync(MOTORCYCLES_FILE)) {
      console.log('⚠️ Arquivo motorcycles.json não existe, criando vazio...');
      writeMotorcycles([]);
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

function writeMotorcycles(list) {
  try {
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(list, null, 2), 'utf8');
    console.log('✅ Motocicletas salvas:', list.length);
    return true;
  } catch (e) {
    console.error('❌ Erro escrevendo motorcycles.json:', e.message);
    return false;
  }
}

// Função para garantir que as imagens existam na pasta images/
function ensureImageExists(imagePath) {
  if (!imagePath || !imagePath.startsWith('images/')) return;
  
  const fullImagePath = path.join(__dirname, imagePath);
  
  // Se a imagem já existe, não precisa fazer nada
  if (fs.existsSync(fullImagePath)) {
    console.log('✅ Imagem já existe:', imagePath);
    return;
  }
  
  console.log('🔍 Imagem não encontrada em images/, procurando em Fotos motos...');
  
  // Extrair o caminho relativo após images/
  const relativePath = imagePath.replace('images/', '');
  const sourcePath = path.join(__dirname, 'Fotos motos', relativePath);
  
  // Verificar se existe na pasta "Fotos motos"
  if (fs.existsSync(sourcePath)) {
    // Criar diretório de destino se não existir
    const destDir = path.dirname(fullImagePath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      console.log('📁 Diretório criado:', destDir);
    }
    
    // Copiar arquivo
    fs.copyFileSync(sourcePath, fullImagePath);
    console.log('✅ Imagem copiada:', sourcePath, '→', fullImagePath);
  } else {
    console.warn('⚠️ Imagem não encontrada em nenhum lugar:', imagePath);
  }
}

// Funções para Admin Users
function readAdminUsers() {
  try {
    if (!fs.existsSync(ADMIN_USERS_FILE)) {
      // Criar arquivo com usuário padrão
      const defaultUser = [{
        id: 'admin-001',
        username: 'admin',
        password: 'admin123',
        fullName: 'Administrador Principal',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        active: true
      }];
      fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(defaultUser, null, 2), 'utf8');
      return defaultUser;
    }
    const raw = fs.readFileSync(ADMIN_USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('❌ Erro lendo admin_users.json:', e.message);
    return [];
  }
}

function writeAdminUsers(list) {
  try {
    fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('❌ Erro escrevendo admin_users.json:', e.message);
    return false;
  }
}

// Rotas da API
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'API funcionando'
  });
});

app.get('/api/motorcycles', (req, res) => {
  try {
    console.log('📡 Requisição para /api/motorcycles');
    const motorcycles = readMotorcycles();
    console.log('✅ Enviando', motorcycles.length, 'motocicletas');
    res.json(motorcycles);
  } catch (e) {
    console.error('❌ Erro na API motorcycles:', e.message);
    res.status(500).json({ error: 'Erro ao carregar motocicletas' });
  }
});

// POST - Adicionar nova motocicleta
app.post('/api/motorcycles', (req, res) => {
  try {
    console.log('📡 POST /api/motorcycles');
    const motorcycles = readMotorcycles();
    const newMoto = {
      id: req.body.id || `moto-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    motorcycles.push(newMoto);
    
    // Garantir que a imagem existe (copiar de Fotos motos se necessário)
    if (newMoto.image) ensureImageExists(newMoto.image);
    if (newMoto.thumb) ensureImageExists(newMoto.thumb);
    if (newMoto.images && Array.isArray(newMoto.images)) {
      newMoto.images.forEach(img => ensureImageExists(img));
    }
    
    if (writeMotorcycles(motorcycles)) {
      console.log('✅ Motocicleta adicionada:', newMoto.name);
      res.status(201).json(newMoto);
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao adicionar motocicleta:', e.message);
    res.status(500).json({ error: 'Erro ao adicionar motocicleta: ' + e.message });
  }
});

// PUT - Atualizar motocicleta
app.put('/api/motorcycles/:id', (req, res) => {
  try {
    console.log('📡 PUT /api/motorcycles/' + req.params.id);
    console.log('📦 Dados recebidos:', JSON.stringify(req.body, null, 2));
    const motorcycles = readMotorcycles();
    const index = motorcycles.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Motocicleta não encontrada' });
    }
    
    motorcycles[index] = {
      ...motorcycles[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    console.log('💾 Dados salvos:', JSON.stringify(motorcycles[index], null, 2));
    
    // Garantir que a imagem existe (copiar de Fotos motos se necessário)
    const moto = motorcycles[index];
    if (moto.image) ensureImageExists(moto.image);
    if (moto.thumb) ensureImageExists(moto.thumb);
    if (moto.images && Array.isArray(moto.images)) {
      moto.images.forEach(img => ensureImageExists(img));
    }
    
    if (writeMotorcycles(motorcycles)) {
      console.log('✅ Motocicleta atualizada:', motorcycles[index].name);
      res.json(motorcycles[index]);
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao atualizar motocicleta:', e.message);
    res.status(500).json({ error: 'Erro ao atualizar motocicleta: ' + e.message });
  }
});

// DELETE - Remover motocicleta
app.delete('/api/motorcycles/:id', (req, res) => {
  try {
    console.log('📡 DELETE /api/motorcycles/' + req.params.id);
    const motorcycles = readMotorcycles();
    const initialLength = motorcycles.length;
    const filteredMotorcycles = motorcycles.filter(m => m.id !== req.params.id);
    
    if (filteredMotorcycles.length === initialLength) {
      return res.status(404).json({ error: 'Motocicleta não encontrada' });
    }
    
    if (writeMotorcycles(filteredMotorcycles)) {
      console.log('✅ Motocicleta removida:', req.params.id);
      res.json({ message: 'Motocicleta removida com sucesso' });
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao remover motocicleta:', e.message);
    res.status(500).json({ error: 'Erro ao remover motocicleta: ' + e.message });
  }
});

app.get('/api/appointments', (req, res) => {
  try {
    console.log('📡 Requisição para /api/appointments');
    const appointments = readData();
    console.log('✅ Enviando', appointments.length, 'agendamentos');
    res.json(appointments);
  } catch (e) {
    console.error('❌ Erro na API appointments:', e.message);
    res.status(500).json({ error: 'Erro ao carregar agendamentos' });
  }
});

app.post('/api/appointments', (req, res) => {
  try {
    console.log('📡 POST /api/appointments');
    const list = readData();
    const newItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...req.body
    };
    list.push(newItem);
    
    if (writeData(list)) {
      console.log('✅ Agendamento salvo:', newItem.id);
      res.json(newItem);
    } else {
      res.status(500).json({ error: 'Erro ao salvar agendamento' });
    }
  } catch (e) {
    console.error('❌ Erro salvando agendamento:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH - Cancelar agendamento
app.patch('/api/appointments/:id/cancel', (req, res) => {
  try {
    console.log('📡 PATCH /api/appointments/:id/cancel');
    const { id } = req.params;
    const { cancelReason, canceledBy } = req.body;
    
    const appointments = readData();
    const appointment = appointments.find(a => a.id === id);
    
    if (!appointment) {
      console.log('❌ Agendamento não encontrado:', id);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    // Atualizar status para cancelado
    appointment.status = 'cancelado';
    appointment.canceledAt = new Date().toISOString();
    appointment.cancelReason = cancelReason || 'Não informado';
    appointment.canceledBy = canceledBy || 'Desconhecido';
    
    if (writeData(appointments)) {
      console.log('✅ Agendamento cancelado:', id);
      console.log('📝 Motivo:', cancelReason);
      console.log('👤 Cancelado por:', canceledBy);
      res.json(appointment);
    } else {
      res.status(500).json({ error: 'Erro ao salvar cancelamento' });
    }
  } catch (e) {
    console.error('❌ Erro ao cancelar agendamento:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH - Confirmar agendamento
app.patch('/api/appointments/:id/confirm', (req, res) => {
  try {
    console.log('📡 PATCH /api/appointments/:id/confirm');
    const { id } = req.params;
    
    const appointments = readData();
    const appointment = appointments.find(a => a.id === id);
    
    if (!appointment) {
      console.log('❌ Agendamento não encontrado:', id);
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    // Atualizar status para confirmado
    appointment.status = 'confirmado';
    appointment.confirmedAt = new Date().toISOString();
    
    if (writeData(appointments)) {
      console.log('✅ Agendamento confirmado:', id);
      res.json(appointment);
    } else {
      res.status(500).json({ error: 'Erro ao salvar confirmação' });
    }
  } catch (e) {
    console.error('❌ Erro ao confirmar agendamento:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ====== ROTAS DE BACKUP ======

// Criar backup manual
app.post('/api/backup/create', async (req, res) => {
  try {
    console.log('📡 POST /api/backup/create');
    const { reason } = req.body;
    const scheduler = getBackupScheduler();
    const result = await scheduler.createBackup(reason || 'manual');
    res.json(result);
  } catch (e) {
    console.error('❌ Erro ao criar backup:', e.message);
    res.status(500).json({ error: 'Erro ao criar backup: ' + e.message });
  }
});

// Listar backups
app.get('/api/backup/list', (req, res) => {
  try {
    console.log('📡 GET /api/backup/list');
    const scheduler = getBackupScheduler();
    const backups = scheduler.listBackups();
    res.json(backups);
  } catch (e) {
    console.error('❌ Erro ao listar backups:', e.message);
    res.status(500).json({ error: 'Erro ao listar backups: ' + e.message });
  }
});

// Restaurar backup
app.post('/api/backup/restore', async (req, res) => {
  try {
    console.log('📡 POST /api/backup/restore');
    const { backupName } = req.body;
    
    if (!backupName) {
      return res.status(400).json({ error: 'Nome do backup é obrigatório' });
    }
    
    const scheduler = getBackupScheduler();
    const result = await scheduler.restoreBackup(backupName);
    res.json(result);
  } catch (e) {
    console.error('❌ Erro ao restaurar backup:', e.message);
    res.status(500).json({ error: 'Erro ao restaurar backup: ' + e.message });
  }
});

// ====== ROTAS DE GERENCIAMENTO DE ADMINISTRADORES ======

// Listar todos os administradores
app.get('/api/admin-users', (req, res) => {
  try {
    console.log('📡 GET /api/admin-users');
    const users = readAdminUsers();
    // Remover senhas antes de enviar
    const safeUsers = users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });
    res.json(safeUsers);
  } catch (e) {
    console.error('❌ Erro listando admins:', e.message);
    res.status(500).json({ error: 'Erro ao carregar administradores' });
  }
});

// Autenticar administrador
app.post('/api/admin-users/login', (req, res) => {
  try {
    console.log('📡 POST /api/admin-users/login');
    const { username, password } = req.body;
    const users = readAdminUsers();
    
    const user = users.find(u => u.username === username && u.password === password && u.active);
    
    if (user) {
      // Atualizar último login
      user.lastLogin = new Date().toISOString();
      writeAdminUsers(users);
      
      const { password: _, ...safeUser } = user;
      console.log('✅ Login bem-sucedido:', username);
      res.json({ success: true, user: safeUser });
    } else {
      console.log('❌ Login falhou:', username);
      res.status(401).json({ success: false, error: 'Usuário ou senha inválidos' });
    }
  } catch (e) {
    console.error('❌ Erro no login:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo administrador
app.post('/api/admin-users', (req, res) => {
  try {
    console.log('📡 POST /api/admin-users');
    const { username, password, fullName } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    
    const users = readAdminUsers();
    
    // Verificar se usuário já existe
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Nome de usuário já existe' });
    }
    
    const newUser = {
      id: 'admin-' + Date.now(),
      username,
      password,
      fullName: fullName || '',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      active: true
    };
    
    users.push(newUser);
    
    if (writeAdminUsers(users)) {
      const { password: _, ...safeUser } = newUser;
      console.log('✅ Administrador criado:', username);
      res.json(safeUser);
    } else {
      res.status(500).json({ error: 'Erro ao salvar administrador' });
    }
  } catch (e) {
    console.error('❌ Erro criando admin:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar administrador
app.put('/api/admin-users/:id', (req, res) => {
  try {
    console.log('📡 PUT /api/admin-users/:id');
    const { id } = req.params;
    const { username, password, fullName, active } = req.body;
    
    const users = readAdminUsers();
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }
    
    // Verificar se novo username já existe (exceto o próprio usuário)
    if (username && users.find(u => u.username === username && u.id !== id)) {
      return res.status(400).json({ error: 'Nome de usuário já existe' });
    }
    
    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }
    
    const user = users[userIndex];
    if (username) user.username = username;
    if (password) user.password = password;
    if (fullName !== undefined) user.fullName = fullName;
    if (active !== undefined) user.active = active;
    
    if (writeAdminUsers(users)) {
      const { password: _, ...safeUser } = user;
      console.log('✅ Administrador atualizado:', id);
      res.json(safeUser);
    } else {
      res.status(500).json({ error: 'Erro ao atualizar administrador' });
    }
  } catch (e) {
    console.error('❌ Erro atualizando admin:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar administrador
app.delete('/api/admin-users/:id', (req, res) => {
  try {
    console.log('📡 DELETE /api/admin-users/:id');
    const { id } = req.params;
    
    const users = readAdminUsers();
    
    // Não permitir deletar o último admin
    const activeAdmins = users.filter(u => u.active);
    if (activeAdmins.length === 1 && activeAdmins[0].id === id) {
      return res.status(400).json({ error: 'Não é possível deletar o último administrador ativo' });
    }
    
    const filtered = users.filter(u => u.id !== id);
    
    if (filtered.length === users.length) {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }
    
    if (writeAdminUsers(filtered)) {
      console.log('✅ Administrador deletado:', id);
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Erro ao deletar administrador' });
    }
  } catch (e) {
    console.error('❌ Erro deletando admin:', e.message);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para redirecionar index.html para vitrine
app.get('/index.html', (req, res) => {
    console.log('🔄 Redirecionamento: index.html → catalog.html');
    const timestamp = Date.now();
    res.redirect(`/catalog.html?v=${timestamp}&redirect=index`);
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

// Inicializar sistema de backup
initBackupScheduler({
    backupDir: path.join(__dirname, 'backups'),
    dataFiles: ['data.json', 'motorcycles.json', 'admin_users.json'],
    retentionDays: 7,
    autoBackupTime: '23:00',
    enabled: true
});

// Iniciar servidor
console.log('🚀 Iniciando servidor na porta', PORT);
const server = app.listen(PORT, () => {
    console.log('✅ Servidor rodando em http://localhost:' + PORT);
    console.log('📁 Servindo arquivos de:', __dirname);
    console.log('🔗 API disponível em /api/*');
    console.log('🔄 Use Ctrl+C para parar');
    
    // Teste rápido das funções
    setTimeout(() => {
        console.log('🧪 Testando funcionalidades...');
        const motorcycles = readMotorcycles();
        console.log('🏍️ Motocicletas disponíveis:', motorcycles.length);
        const appointments = readData();
        console.log('📅 Agendamentos existentes:', appointments.length);
        console.log('✅ Sistema pronto para uso!');
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

console.log('🎯 Configuração do servidor concluída!');