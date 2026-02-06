const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

console.log('🔧 Iniciando servidor MacDavis...');
console.log('Node version:', process.version);
console.log('Diretório:', __dirname);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Arquivos de dados
const DATA_FILE = path.join(__dirname, 'data.json');
const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');

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