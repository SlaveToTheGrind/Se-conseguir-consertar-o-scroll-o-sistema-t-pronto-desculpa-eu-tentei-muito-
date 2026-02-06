const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

console.log('🌐 Iniciando servidor CLIENTE - MacDavis...');
console.log('Node version:', process.version);
console.log('Diretório:', __dirname);

const app = express();
const PORT = 3000;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Anti-cache headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Servir arquivos estáticos organizados
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/painel-administrador', express.static(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'painel-administrador')));
app.use('/vitrine-catalogo', express.static(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'vitrine-catalogo')));
app.use('/pagina-inicial', express.static(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'pagina-inicial')));
app.use('/sistema-agendamento', express.static(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'sistema-agendamento')));

// Arquivos de dados
const DATA_FILE = path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'dados-configuracao', 'data.json');
const MOTORCYCLES_FILE = path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'dados-configuracao', 'motorcycles.json');

// Rotas para páginas específicas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'pagina-inicial', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'pagina-inicial', 'login.html'));
});

app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'painel-administrador', 'admin-login.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'painel-administrador', 'admin.html'));
});

app.get('/catalog.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'vitrine-catalogo', 'catalog.html'));
});

app.get('/agendamento.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Agendamento_Versao_Funcional', 'sistema-agendamento', 'agendamento.html'));
});

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
    // Filtrar apenas motocicletas disponíveis (não vendidas)
    const availableMotorcycles = motorcycles.filter(moto => {
      const status = moto.status || 'disponivel';
      return status === 'disponivel';
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
app.post('/api/appointments', (req, res) => {
  try {
    console.log('📡 [CLIENTE] POST /api/appointments');
    const list = readData();
    const newItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...req.body,
      createdAt: new Date().toISOString()
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


// ============= ROTAS ADMINISTRATIVAS PARA MOTOS =============

// POST - Criar nova moto
app.post('/api/motorcycles', (req, res) => {
  try {
    const motorcycles = readMotorcycles();
    const newMoto = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    motorcycles.push(newMoto);
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(motorcycles, null, 2), 'utf8');
    console.log('✅ Moto criada:', newMoto.id);
    res.json(newMoto);
  } catch (e) {
    console.error('❌ Erro ao criar moto:', e.message);
    res.status(500).json({ error: 'Erro ao criar moto' });
  }
});

// PUT - Atualizar moto (status, dados, etc)
app.put('/api/motorcycles/:id', (req, res) => {
  try {
    const motorcycles = readMotorcycles();
    const idx = motorcycles.findIndex(m => m.id == req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Moto não encontrada' });
    }
    motorcycles[idx] = {
      ...motorcycles[idx],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(motorcycles, null, 2), 'utf8');
    console.log('✅ Moto atualizada:', motorcycles[idx].id);
    res.json(motorcycles[idx]);
  } catch (e) {
    console.error('❌ Erro ao atualizar moto:', e.message);
    res.status(500).json({ error: 'Erro ao atualizar moto' });
  }
});

// DELETE - Excluir moto
app.delete('/api/motorcycles/:id', (req, res) => {
  try {
    let motorcycles = readMotorcycles();
    const idx = motorcycles.findIndex(m => m.id == req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Moto não encontrada' });
    }
    const removed = motorcycles.splice(idx, 1)[0];
    fs.writeFileSync(MOTORCYCLES_FILE, JSON.stringify(motorcycles, null, 2), 'utf8');
    console.log('🗑️ Moto excluída:', removed.id);
    res.json({ success: true, removed });
  } catch (e) {
    console.error('❌ Erro ao excluir moto:', e.message);
    res.status(500).json({ error: 'Erro ao excluir moto' });
  }
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
const server = app.listen(PORT, () => {
    console.log('✅ Servidor CLIENTE rodando em http://localhost:' + PORT);
    console.log('📁 Servindo arquivos de:', __dirname);
    console.log('🔗 API disponível em /api/*');
    console.log('👥 Acesso: Clientes (somente leitura de motos + agendamento)');
    console.log('🔄 Use Ctrl+C para parar');
    
    // Teste rápido
    setTimeout(() => {
        console.log('🧪 Testando funcionalidades...');
        const motorcycles = readMotorcycles();
        console.log('🏍️ Motocicletas disponíveis:', motorcycles.length);
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
