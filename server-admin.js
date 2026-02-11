const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const crypto = require('crypto');
const { initBackupScheduler, getBackupScheduler } = require('./backup-scheduler');
const { getTelegramNotifier } = require('./telegram-notifier');

// Inicializar notificador do Telegram (singleton)
const telegramNotifier = getTelegramNotifier();

console.log('🔐 Iniciando servidor ADMIN - MacDavis...');
console.log('Node version:', process.version);
console.log('Diretório:', __dirname);

const app = express();
const PORT = 3001;

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

// Debug: log all incoming API requests to help diagnose 404s and routing
app.use((req, res, next) => {
  try {
    if (req.path && req.path.startsWith('/api/')) {
      console.log(`➡️ Incoming API request: ${req.method} ${req.path} from ${req.ip}`);
    }
  } catch (e) {
    // ignore logging failures
  }
  return next();
});

// Anti-cache headers (mais agressivo para JS e CSS) + Mobile optimizations
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '-1');
  
  // Headers extras para arquivos JS e CSS (SEM limpar storage)
  if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.set('Last-Modified', new Date().toUTCString());
    res.set('ETag', Date.now().toString());
  }
  
  // Headers otimizados para mobile
  res.set('Connection', 'keep-alive');
  res.set('Keep-Alive', 'timeout=65');
  
  next();
});

// Middleware para redirecionar páginas de cliente no servidor admin
app.use((req, res, next) => {
  const blockedPagesForAdmin = [
    '/login.html',
    '/index.html',
    '/catalog.html',
    '/agendamento.html',
    '/catalog.html'
  ];
  
  if (blockedPagesForAdmin.includes(req.path)) {
    console.log('🔀 [ADMIN] Redirecionando de', req.path, '→ /admin-login.html');
    return res.redirect('/admin-login.html');
  }
  next();
});

// Serve `admin.html` with injected CURRENT_VERSION from package.json
app.get('/admin.html', (req, res, next) => {
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    let appVersion = '0.0.0';
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg && pkg.version) appVersion = String(pkg.version);
      } catch (e) {
        console.warn('Could not read package.json for admin version injection:', e.message);
      }
    }

    const htmlPath = path.join(__dirname, 'admin.html');
    if (!fs.existsSync(htmlPath)) return next();
    let html = fs.readFileSync(htmlPath, 'utf8');

    // Replace any CURRENT_VERSION definition in the file with the package.json version
    html = html.replace(/const\s+CURRENT_VERSION\s*=\s*['\"][^'\"]*['\"];?/, `const CURRENT_VERSION = '${appVersion}';`);

    // Also replace the adminVersion badge content if present (fallback for direct HTML injection)
    try {
      html = html.replace(/<span\s+id=(?:"|')adminVersion(?:"|')[^>]*>.*?<\/span>/i, `<span id="adminVersion">${appVersion}</span>`);
    } catch (e) {
      // non-fatal
    }

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    return;
  } catch (err) {
    console.error('Error serving admin.html with version injection:', err && err.message);
    return next();
  }
});

// Servir arquivos estáticos (necessário para CSS, JS, imagens)
app.use(express.static(__dirname));

// Servir pasta de documentos PDF
app.use('/docs', express.static(path.join(__dirname, 'DOCS Motos')));

// Servir pasta de documentos PDFs
app.use('/documents', express.static(path.join(__dirname, 'documents')));

// Servir pasta de contratos (usuário pode apontar um diretório customizado)
// Mapeamos as rotas históricas '/docs/Contratos' e '/Contratos' para o diretório absoluto fornecido pelo usuário.
app.use('/docs/Contratos', express.static(path.resolve('C:\\Users\\W10\\Documents\\TCC - teste\\Contratos')));
app.use('/Contratos', express.static(path.resolve('C:\\Users\\W10\\Documents\\TCC - teste\\Contratos')));

// Fallback: se um pedido direto a /docs/Contratos/<filename> não encontrar o arquivo,
// procurar recursivamente dentro da pasta Contratos e servir o primeiro match.
app.get('/docs/Contratos/:fileName', (req, res, next) => {
  try {
    const contratosRoot = path.resolve('C:\\Users\\W10\\Documents\\TCC - teste\\Contratos');
    const requested = decodeURIComponent(req.params.fileName || '');
    const targetName = path.basename(requested);

    function findRecursive(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isFile() && e.name === targetName) return full;
        if (e.isDirectory()) {
          const found = findRecursive(full);
          if (found) return found;
        }
      }
      return null;
    }

    const foundPath = findRecursive(contratosRoot);
    if (foundPath) {
      return res.sendFile(foundPath);
    }
  } catch (err) {
    console.error('Erro no fallback de contratos:', err && err.message);
  }
  return next();
});

// Importar gerador de contratos
const contractGenerator = require('./contract-generator');

// Arquivos de dados
const DATA_FILE = path.join(__dirname, 'data.json');
const MOTORCYCLES_FILE = path.join(__dirname, 'motorcycles.json');
const ADMIN_USERS_FILE = path.join(__dirname, 'admin_users.json');
const STATUS_FILE = path.join(__dirname, 'system-status.json');
const CONFIG_FILE = path.join(__dirname, 'system-config.json');
const AUDIT_FILE = path.join(__dirname, 'system-config-audit.log');

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

// Normaliza um valor de tipo/categoria para chaves canônicas em minúsculas
function normalizeType(value) {
  if (!value && value !== 0) return '';
  const v = String(value).trim().toLowerCase();
  const map = {
    'streets': 'street',
    'street': 'street',
    'st': 'street',
    'sports': 'sport',
    'sport': 'sport',
    'scooters': 'scooter',
    'scooter': 'scooter',
    'naked': 'naked',
    'adventure': 'adventure',
    'adv': 'adventure',
    'custom': 'custom',
    'touring': 'touring',
    'cruiser': 'cruiser'
  };
  return map[v] || v;
}

// Gera slug seguro para nomes de pastas/URLs: remove acentos, caracteres inválidos
function slugify(input) {
  if (!input) return '';
  let s = String(input).normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); // remove diacritics
  s = s.replace(/[^a-zA-Z0-9\-\_ ]+/g, '');
  s = s.trim().toLowerCase().replace(/\s+/g, '-');
  if (s.length > 80) s = s.slice(0, 80);
  if (!s) s = 'moto';
  return s;
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
        password: 'MacDavis@2025',
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

// ============= ROTAS API - ACESSO COMPLETO ADMIN =============

app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'admin',
    timestamp: new Date().toISOString(),
    message: 'API Admin funcionando'
  });
});

// POST - Upload de imagens via multipart/form-data
// Recebe campos `images[]` (até 8 arquivos por requisição por segurança)
try {
  const multer = require('multer');
  const uploadDir = path.join(__dirname, 'images');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // prefixa timestamp para evitar colisões
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      cb(null, Date.now() + '-' + safeName);
    }
  });

  const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

  app.post('/api/upload-images', upload.array('images[]', 8), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      const paths = req.files.map(f => {
        // Caminho público relativo ao servidor
        const rel = path.relative(__dirname, f.path).replace(/\\/g, '/');
        return rel;
      });
      console.log('📁 Imagens recebidas via upload:', paths);
      return res.json({ paths });
    } catch (err) {
      console.error('❌ Erro em /api/upload-images:', err && err.message);
      return res.status(500).json({ error: 'Erro ao salvar imagens' });
    }
  });
} catch (e) {
  console.warn('⚠️ Multer não disponível para rota /api/upload-images:', e && e.message);
}

// POST - Upload de CRLV para uma motocicleta específica
try {
  const multerCr = require('multer');

  const storageCr = multerCr.diskStorage({
    destination: function (req, file, cb) {
      try {
        const id = req.params.id;
        const motorcycles = readMotorcycles();
        const moto = motorcycles.find(m => String(m.id) === String(id));
        let slug = moto && moto.docsFolder ? moto.docsFolder : null;
        if (!slug) {
          const nameForSlug = (moto && (moto.name || moto.nome || moto.modelo || moto.model)) || `moto-${Date.now()}`;
          slug = `${id || Date.now()}-${slugify(nameForSlug)}`;
        }
        const baseDocs = path.join(__dirname, 'DOCS Motos');
        const destDir = path.join(baseDocs, slug);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        return cb(null, destDir);
      } catch (err) {
        return cb(new Error('Erro ao determinar pasta de destino'));
      }
    },
    filename: function (req, file, cb) {
      const safe = file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, '_');
      const ext = path.extname(safe) || '.pdf';
      const name = 'CRLV' + '-' + Date.now() + ext;
      cb(null, name);
    }
  });

  const uploadCr = multerCr({ storage: storageCr, limits: { fileSize: 12 * 1024 * 1024 } });

  app.post('/api/motorcycles/:id/crlv', uploadCr.single('crlv'), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
      const id = req.params.id;
      const motorcycles = readMotorcycles();
      const idx = motorcycles.findIndex(m => String(m.id) === String(id));
      if (idx === -1) return res.status(404).json({ success: false, message: 'Motocicleta não encontrada' });

      // determinar slug/pasta
      const moto = motorcycles[idx];
      const slug = moto.docsFolder || `${moto.id || Date.now()}-${slugify(moto.name || moto.nome || moto.modelo || moto.model || moto.id)}`;

      // Atualizar caminho relativo público
      const rel = path.relative(__dirname, req.file.path).replace(/\\/g, '/');
      // Normalizar para o prefixo público /docs/
      let publicPath = rel;
      if (publicPath.startsWith('DOCS Motos/')) publicPath = publicPath.replace(/^DOCS Motos\//, '');
      publicPath = `docs/${publicPath}`;

      const absolutePath = req.file.path;
      // Public path served by the server
      const publicDocPath = `docs/${slug}/${req.file.filename}`;
      moto.documentoPDF = publicDocPath;
      moto.docsFolder = slug;
      moto.updatedAt = new Date().toISOString();

      if (!writeMotorcycles(motorcycles)) {
        return res.status(500).json({ success: false, message: 'Erro ao salvar referência da moto' });
      }

      console.log('✅ CRLV salvo:', req.file.path, '→ registro atualizado:', moto.id);
      return res.json({ success: true, file: { name: req.file.filename, path: publicDocPath, absolutePath } });
    } catch (err) {
      console.error('❌ Erro em /api/motorcycles/:id/crlv:', err && err.message);
      return res.status(500).json({ success: false, message: 'Erro no upload do CRLV' });
    }
  });

} catch (e) {
  console.warn('⚠️ Multer não disponível para rota /api/motorcycles/:id/crlv:', e && e.message);
}

// POST - Importar arquivo existente (caminho absoluto) para a pasta da moto
app.post('/api/motorcycles/:id/import-file', (req, res) => {
  try {
    const { path: srcPathRaw, type } = req.body || {};
    if (!srcPathRaw) return res.status(400).json({ success: false, message: 'Parâmetro path é obrigatório' });
    let srcPath = String(srcPathRaw).trim();

    // Tentar decodificar URIs (ex: %2F etc)
    try { srcPath = decodeURIComponent(srcPath); } catch (e) { /* ignore */ }

    // Permitir quando o usuário colou uma URL pública /docs/..., converter para caminho físico
    // Normalize barras e remover prefixos duplicados
    const normalized = srcPath.replace(/\\/g, '/').replace(/^\/+/,'').replace(/\\/g, '/');

    let resolvedSrc = null;

    // Caso o usuário tenha colado um URL completo (http://host/docs/...), extrair pathname
    if (/^https?:\/\//i.test(normalized)) {
      try {
        const u = new URL(normalized);
        srcPath = u.pathname || normalized;
      } catch (e) {
        // fallback: keep original
        srcPath = normalized;
      }
    }

    // Re-normalizar
    let candidate = String(srcPath).replace(/^file:\/\//i, '').replace(/^\/+/,'').replace(/\\/g, '/');

    // If starts with docs/ or /docs/, map to physical DOCS Motos folder
    if (/^docs\//i.test(candidate)) {
      let rel = candidate.replace(/^docs\//i, '');
      // collapse duplicated docs/docs
      rel = rel.replace(/^docs\//i, '');
      // If points to Contratos, try project Contratos first
      if (/^Contratos\//i.test(rel)) {
        const after = rel.replace(/^Contratos\//i, '');
        const c1 = path.join(__dirname, 'Contratos', after);
        const c2 = path.join(__dirname, 'DOCS Motos', 'Contratos', after);
        if (fs.existsSync(c1)) resolvedSrc = c1;
        else if (fs.existsSync(c2)) resolvedSrc = c2;
        else resolvedSrc = c2; // fallback
      } else {
        resolvedSrc = path.join(__dirname, 'DOCS Motos', rel);
      }
    }

    // If contains literal "DOCS Motos" path (user pasted Windows absolute), map accordingly
    if (!resolvedSrc && /docs\s*motos/i.test(candidate)) {
      const idx = candidate.toLowerCase().indexOf('docs motos');
      const rel = candidate.substring(idx + 'DOCS Motos'.length).replace(/^[\\\/]+/, '');
      resolvedSrc = path.join(__dirname, 'DOCS Motos', rel);
    }

    // If still not resolved, and candidate looks like absolute path on Windows or POSIX, use it
    if (!resolvedSrc) {
      if (path.isAbsolute(candidate) || /^[a-zA-Z]:\//.test(candidate) || candidate.startsWith('/')) {
        resolvedSrc = candidate;
      } else {
        // try relative to project root
        resolvedSrc = path.join(__dirname, candidate);
      }
    }

    console.log('🔍 import-file: src provided=', srcPathRaw, '=> resolved=', resolvedSrc);

    // Apenas permitir PDF
    if (!String(resolvedSrc).toLowerCase().endsWith('.pdf')) return res.status(400).json({ success: false, message: 'Apenas arquivos PDF são suportados', resolved: resolvedSrc });

    // Verificar existência
    if (!fs.existsSync(resolvedSrc)) return res.status(404).json({ success: false, message: 'Arquivo de origem não encontrado', resolved: resolvedSrc });
    const stat = fs.statSync(resolvedSrc);
    if (!stat.isFile()) return res.status(400).json({ success: false, message: 'Caminho de origem não é um arquivo', resolved: resolvedSrc });

    // Localizar moto
    const motorcycles = readMotorcycles();
    const motoIndex = motorcycles.findIndex(m => String(m.id) === String(req.params.id));
    if (motoIndex === -1) return res.status(404).json({ success: false, message: 'Motocicleta não encontrada' });
    const moto = motorcycles[motoIndex];

    // Determinar slug/pasta
    const slug = moto.docsFolder || `${moto.id || Date.now()}-${slugify(moto.name || moto.nome || moto.modelo || moto.model || moto.id)}`;
    const baseDocs = path.join(__dirname, 'DOCS Motos');

    let destDir = path.join(baseDocs, slug);
    let publicPrefix = 'docs';
    if (String(type || '').toLowerCase() === 'contrato') {
      destDir = path.join(baseDocs, 'Contratos', slug);
      publicPrefix = 'docs/Contratos';
    }

    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    // Gerar nome seguro no destino
    const baseName = path.basename(resolvedSrc).replace(/[^a-zA-Z0-9.\\-_]/g, '_');
    const timestamp = Date.now();
    const destName = `${timestamp}-${baseName}`;
    const destPath = path.join(destDir, destName);

    // Copiar para a pasta da moto
    fs.copyFileSync(resolvedSrc, destPath);

    // Se a origem não estiver dentro de 'DOCS Motos' (ou for diferente do destino), remover o arquivo original
    try {
      const normalizedSrc = path.resolve(resolvedSrc);
      const normalizedDest = path.resolve(destPath);
      const docsRoot = path.resolve(path.join(__dirname, 'DOCS Motos'));
      const srcInsideDocs = normalizedSrc.startsWith(docsRoot + path.sep);
      // Só remover se origem for diferente e estiver fora de DOCS Motos
      if (normalizedSrc !== normalizedDest && !srcInsideDocs) {
        try { fs.unlinkSync(normalizedSrc); console.log('🗑️ Arquivo fonte movido (removido):', normalizedSrc); } catch (e) { console.warn('⚠️ Não foi possível remover arquivo fonte:', e && e.message); }
      }
    } catch (e) {
      console.warn('⚠️ Erro ao tentar remover arquivo fonte (move fallback):', e && e.message);
    }

    // Atualizar registro da moto com caminho público relativo (rota /docs/...)
    const publicRel = `${slug}/${destName}`.replace(/\\/g, '/');
    if (String(type || '').toLowerCase() === 'contrato') {
      moto.contratoPath = `docs/${publicRel}`;
    } else {
      moto.documentoPDF = `docs/${publicRel}`;
    }
    moto.updatedAt = new Date().toISOString();
    const ok = writeMotorcycles(motorcycles);
    if (!ok) return res.status(500).json({ success: false, message: 'Erro ao salvar referência da moto' });

    console.log('✅ Arquivo importado para moto:', destPath, 'tipo=', type || 'crlv');
    return res.json({ success: true, file: { name: destName, path: `docs/${publicRel}`, absolutePath: destPath } });

  } catch (err) {
    console.error('❌ Erro em /api/motorcycles/:id/import-file:', err && err.message);
    return res.status(500).json({ success: false, message: 'Erro ao importar arquivo' });
  }
});

// GET - Health check para administração: verifica leitura/escrita e pasta de imagens
app.get('/api/health', (req, res) => {
  try {
    const health = {
      server: { ok: true, timestamp: new Date().toISOString() },
      motorcyclesFile: {},
      imagesDir: {},
      multerAvailable: false
    };

    // Checar motorcycles.json (leitura)
    try {
      health.motorcyclesFile.exists = fs.existsSync(MOTORCYCLES_FILE);
      if (health.motorcyclesFile.exists) {
        const raw = fs.readFileSync(MOTORCYCLES_FILE, 'utf8');
        JSON.parse(raw || '[]');
        health.motorcyclesFile.readable = true;
      } else {
        health.motorcyclesFile.readable = false;
      }
    } catch (e) {
      health.motorcyclesFile.readable = false;
      health.motorcyclesFile.error = String(e && e.message);
    }

    // Checar escrita no diretório (tentativa segura: criar e remover arquivo temporário)
    try {
      const tmpPath = path.join(__dirname, 'health_write_test.tmp');
      fs.writeFileSync(tmpPath, 'ok');
      fs.unlinkSync(tmpPath);
      health.motorcyclesFile.writable = true;
    } catch (e) {
      health.motorcyclesFile.writable = false;
      health.motorcyclesFile.writeError = String(e && e.message);
    }

    // Checar pasta images
    try {
      const imagesDir = path.join(__dirname, 'images');
      health.imagesDir.exists = fs.existsSync(imagesDir);
      if (health.imagesDir.exists) {
        // testar criação temporária dentro de images
        try {
          const tmpImg = path.join(imagesDir, 'health_write_test.tmp');
          fs.writeFileSync(tmpImg, 'ok');
          fs.unlinkSync(tmpImg);
          health.imagesDir.writable = true;
        } catch (e) {
          health.imagesDir.writable = false;
          health.imagesDir.writeError = String(e && e.message);
        }
      } else {
        health.imagesDir.writable = false;
      }
    } catch (e) {
      health.imagesDir.exists = false;
      health.imagesDir.writable = false;
      health.imagesDir.error = String(e && e.message);
    }

    // Verificar disponibilidade do multer (indicador se upload lida no servidor)
    try {
      require.resolve('multer');
      health.multerAvailable = true;
    } catch (e) {
      health.multerAvailable = false;
      health.multerError = String(e && e.message);
    }

    res.json(health);
  } catch (err) {
    console.error('❌ Erro em /api/health:', err && err.message);
    res.status(500).json({ error: 'Erro ao executar healthcheck', detail: String(err && err.message) });
  }
});

// ============= SYSTEM STATUS OVERRIDE (arquivo simples para mensagens) =============
// GET - Retorna o override se existir
function requireAdmin(req, res, next) {
  try {
    const adminId = req.header('x-admin-id') || req.header('X-Admin-Id');
    console.log(`🔐 requireAdmin check for path=${req.path} method=${req.method} adminHeader=${adminId}`);
    if (!adminId) {
      console.warn('❌ requireAdmin: missing x-admin-id header for request from', req.ip);
      return res.status(401).json({ error: 'Admin header missing' });
    }
    const users = readAdminUsers();
    const found = users.find(u => u.id === adminId && u.active);
    if (!found) {
      console.warn('❌ requireAdmin: invalid admin id', adminId, 'for request', req.path);
      return res.status(403).json({ error: 'Admin not authorized' });
    }
    // attach user for logging if needed
    req.adminUser = { id: found.id, username: found.username };
    console.log('✅ requireAdmin: validated admin', req.adminUser.username);
    return next();
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao validar admin' });
  }
}

app.get('/api/system-status', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(STATUS_FILE)) return res.json({ override: null });
    const raw = fs.readFileSync(STATUS_FILE, 'utf8');
    const obj = JSON.parse(raw || '{}');
    return res.json({ override: obj });
  } catch (e) {
    console.error('❌ Erro lendo system-status.json:', e && e.message);
    return res.status(500).json({ error: 'Erro ao ler status do sistema' });
  }
});

// POST - Atualizar override (simples, sem autenticação adicional)
app.post('/api/system-status', requireAdmin, (req, res) => {
  try {
    const { message, level } = req.body || {};
    if (!message) return res.status(400).json({ error: 'Campo message é obrigatório' });
    const payload = { message: String(message), level: level || 'info', updatedAt: new Date().toISOString() };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(payload, null, 2), 'utf8');
    console.log('📝 system-status atualizado:', payload);
    return res.json({ success: true, override: payload });
  } catch (e) {
    console.error('❌ Erro escrevendo system-status.json:', e && e.message);
    return res.status(500).json({ error: 'Erro ao salvar status do sistema' });
  }
});

// DELETE - Limpar override
app.delete('/api/system-status', requireAdmin, (req, res) => {
  try {
    if (fs.existsSync(STATUS_FILE)) fs.unlinkSync(STATUS_FILE);
    console.log('🗑️ system-status removido');
    return res.json({ success: true });
  } catch (e) {
    console.error('❌ Erro removendo system-status.json:', e && e.message);
    return res.status(500).json({ error: 'Erro ao remover status do sistema' });
  }
});

// ============= SYSTEM CONFIG (maintenance mode, etc) =============
// GET - retorna config (protegido)
app.get('/api/system-config', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return res.json({ config: { maintenance: false } });
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const obj = JSON.parse(raw || '{}');
    return res.json({ config: obj });
  } catch (e) {
    console.error('❌ Erro lendo system-config.json:', e && e.message);
    return res.status(500).json({ error: 'Erro ao ler config do sistema' });
  }
});

// POST - atualizar config (protegido)
app.post('/api/system-config', requireAdmin, (req, res) => {
  try {
    console.log('📡 [ADMIN] POST /api/system-config - headers:', JSON.stringify(req.headers, null, 2));
    console.log('📡 [ADMIN] POST /api/system-config - body:', JSON.stringify(req.body, null, 2));
    const incoming = req.body || {};
    const current = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8') || '{}') : {};
    const merged = { ...current, ...incoming, updatedAt: new Date().toISOString() };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
    console.log('⚙️ system-config atualizado por', req.adminUser && req.adminUser.username, merged);

    // Append enhanced audit log (include before/after, action, request_id, source_ip)
    try {
      const before = current;
      const after = merged;
      // Determine action
      let action = 'update_config';
      if (Object.prototype.hasOwnProperty.call(incoming, 'maintenance')) {
        action = incoming.maintenance ? 'start_maintenance' : 'stop_maintenance';
      }
      // Generate a request id (UUID) - use crypto.randomUUID when available
      let request_id = null;
      try {
        request_id = (crypto && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : null;
      } catch (e) { request_id = null; }
      if (!request_id) {
        // fallback simple UUIDv4
        request_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      const source_ip = (req.headers['x-forwarded-for'] || req.ip || (req.connection && req.connection.remoteAddress) || null);
      const auditEntry = {
        ts: new Date().toISOString(),
        request_id,
        admin: req.adminUser || null,
        admin_role: (req.adminUser && req.adminUser.role) || null,
        action,
        before,
        after,
        incoming,
        source_ip,
        outcome: 'success'
      };
      fs.appendFileSync(AUDIT_FILE, JSON.stringify(auditEntry) + '\n', 'utf8');
      console.log('📝 Audit log gravado:', request_id);
    } catch (auditErr) {
      console.warn('⚠️ Falha ao gravar audit log:', auditErr && auditErr.message);
    }

    return res.json({ success: true, config: merged });
  } catch (e) {
    console.error('❌ Erro escrevendo system-config.json:', e && e.message, e);
    return res.status(500).json({ error: 'Erro ao salvar config do sistema', detail: String(e && e.message) });
  }
});

// GET - retornar últimas entradas do audit log (protegido)
app.get('/api/system-config/audit', requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return res.json({ entries: [] });
    const raw = fs.readFileSync(AUDIT_FILE, 'utf8') || '';
    const lines = raw.split(/\r?\n/).filter(l => l && l.trim());
    const entries = lines.map(l => {
      try { return JSON.parse(l); } catch (e) { return { raw: l }; }
    });
    // allow ?limit= to restrict size
    const limit = parseInt(req.query.limit) || 200;
    return res.json({ entries: entries.slice(-limit) });
  } catch (e) {
    console.error('❌ Erro lendo audit log:', e && e.message);
    return res.status(500).json({ error: 'Erro ao ler audit log' });
  }
});

// ============= ROTAS ADMIN USERS =============

// GET - Listar administradores (sem as senhas)
app.get('/api/admin-users', (req, res) => {
  try {
    console.log('📡 [ADMIN] GET /api/admin-users');
    const users = readAdminUsers();
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
  } catch (e) {
    console.error('❌ Erro na API admin-users:', e.message);
    res.status(500).json({ error: 'Erro ao carregar administradores' });
  }
});

// POST - Autenticar administrador
app.post('/api/admin-users/login', (req, res) => {
  try {
    console.log('📡 [ADMIN] POST /api/admin-users/login');
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

// POST - Criar novo administrador
app.post('/api/admin-users', (req, res) => {
  try {
    console.log('📡 [ADMIN] POST /api/admin-users');
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

// PUT - Atualizar administrador
app.put('/api/admin-users/:id', (req, res) => {
  try {
    console.log('📡 [ADMIN] PUT /api/admin-users/:id');
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

// DELETE - Deletar administrador
app.delete('/api/admin-users/:id', (req, res) => {
  try {
    console.log('📡 [ADMIN] DELETE /api/admin-users/:id');
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

// ============= ROTAS MOTORCYCLES =============

// Middleware: bloquear writes quando modo manutenção ativo (exceto para admins)
app.use((req, res, next) => {
  try {
    const method = (req.method || '').toUpperCase();
    if (!['POST', 'PUT', 'DELETE'].includes(method)) return next();
    // somente rotas /api/* são afetadas
    if (!req.path || !req.path.startsWith('/api/')) return next();

    // Ler config
    let maintenance = false;
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8') || '{}';
        const cfg = JSON.parse(raw || '{}');
        maintenance = !!cfg.maintenance;
      }
    } catch (e) {
      maintenance = false;
    }

    if (!maintenance) return next();

    // Permitir se for request de admin (header x-admin-id válido)
    const adminId = req.header('x-admin-id');
    if (!adminId) return res.status(503).json({ error: 'Sistema em manutenção - escrita bloqueada' });
    const users = readAdminUsers();
    const found = users.find(u => u.id === adminId && u.active);
    if (!found) return res.status(503).json({ error: 'Sistema em manutenção - escrita bloqueada' });

    // admin válido -> permitir
    return next();
  } catch (e) {
    return next();
  }
});

// GET - Listar motocicletas
app.get('/api/motorcycles', (req, res) => {
  try {
    console.log('📡 [ADMIN] GET /api/motorcycles');
    const motorcycles = readMotorcycles();
    console.log('✅ Enviando', motorcycles.length, 'motocicletas');
    res.json(motorcycles);
  } catch (e) {
    console.error('❌ Erro na API motorcycles:', e.message);
    res.status(500).json({ error: 'Erro ao carregar motocicletas' });
  }
});

// GET - Buscar motocicleta específica por ID
app.get('/api/motorcycles/:id', (req, res) => {
  try {
    const { id } = req.params;
    console.log('📡 [ADMIN] GET /api/motorcycles/' + id);
    const motorcycles = readMotorcycles();
    const motorcycle = motorcycles.find(m => m.id === id);
    
    if (!motorcycle) {
      console.log('❌ Motocicleta não encontrada:', id);
      return res.status(404).json({ error: 'Motocicleta não encontrada' });
    }
    
    console.log('✅ Motocicleta encontrada:', motorcycle.marca, motorcycle.modelo);
    res.json(motorcycle);
  } catch (e) {
    console.error('❌ Erro ao buscar motocicleta:', e.message);
    res.status(500).json({ error: 'Erro ao buscar motocicleta' });
  }
});

// POST - Adicionar nova motocicleta
app.post('/api/motorcycles', (req, res) => {
  try {
    console.log('📡 [ADMIN] POST /api/motorcycles');
    console.log('📦 Dados recebidos (POST):', JSON.stringify(req.body, null, 2));
    const motorcycles = readMotorcycles();
    const newMoto = {
      id: req.body.id || `moto-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    };

    // Normalizar showInCatalog para booleano
    try {
      if (typeof newMoto.showInCatalog === 'string') {
        const v = newMoto.showInCatalog.toLowerCase().trim();
        newMoto.showInCatalog = (v === 'true' || v === 'on' || v === '1');
      } else {
        newMoto.showInCatalog = !!newMoto.showInCatalog;
      }
    } catch (e) {
      newMoto.showInCatalog = false;
    }

    // Log de imagens recebidas para depuração de persistência
    try {
      if (newMoto.images && Array.isArray(newMoto.images)) {
        console.log('🖼️ Imagens recebidas (POST):', JSON.stringify(newMoto.images, null, 2));
      } else {
        console.log('🖼️ Nenhuma imagem (POST) presente no payload');
      }
    } catch (e) {
      console.warn('⚠️ Falha ao logar imagens (POST):', e && e.message);
    }

    // Normalizar o tipo/categoria para chave canônica antes de salvar
    newMoto.type = normalizeType(newMoto.type || newMoto.tipo || newMoto.categoria || '');
    
    // Criar pasta dedicada para os documentos/CRLV dessa moto dentro de 'DOCS Motos'
    try {
      const baseDocs = path.join(__dirname, 'DOCS Motos');
      const nameForSlug = newMoto.name || newMoto.nome || newMoto.modelo || newMoto.model || newMoto.id;
      const slug = `${newMoto.id || Date.now()}-${slugify(nameForSlug)}`;
      const motoDocsDir = path.join(baseDocs, slug);
      if (!fs.existsSync(motoDocsDir)) {
        fs.mkdirSync(motoDocsDir, { recursive: true });
        console.log('📁 Pasta DOCS criada para moto:', motoDocsDir);
      }
      // Criar a subpasta de contratos para esta moto
      const contratosRoot = path.join(baseDocs, 'Contratos');
      const motoContratosDir = path.join(contratosRoot, slug);
      if (!fs.existsSync(motoContratosDir)) {
        fs.mkdirSync(motoContratosDir, { recursive: true });
        console.log('📁 Pasta Contratos criada para moto:', motoContratosDir);
      }
      // Guardar slug/pasta no objeto para referência (relativo)
      newMoto.docsFolder = slug;
      newMoto.contractsFolder = path.join('Contratos', slug).replace(/\\/g, '/');
    } catch (e) {
      console.warn('⚠️ Falha ao criar pasta DOCS para a moto:', e && e.message);
    }

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
    console.log('📡 [ADMIN] PUT /api/motorcycles/' + req.params.id);
    console.log('📦 Dados recebidos:', JSON.stringify(req.body, null, 2));
    const motorcycles = readMotorcycles();
    const index = motorcycles.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Motocicleta não encontrada' });
    }
    
    // Log especial para vendas
    if (req.body.status === 'vendido' && req.body.buyerName) {
      console.log('💰 [VENDA] Registrando venda da moto:', motorcycles[index].name);
      console.log('💰 [VENDA] Comprador:', req.body.buyerName);
      console.log('💰 [VENDA] Data:', req.body.saleDate);
    }
    
    motorcycles[index] = {
      ...motorcycles[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    // Normalizar showInCatalog como booleano após merge
    try {
      const raw = motorcycles[index].showInCatalog;
      if (typeof raw === 'string') {
        const v = raw.toLowerCase().trim();
        motorcycles[index].showInCatalog = (v === 'true' || v === 'on' || v === '1');
      } else {
        motorcycles[index].showInCatalog = !!raw;
      }
    } catch (e) {
      motorcycles[index].showInCatalog = false;
    }
    // Normalizar tipo/categoria após merge
    motorcycles[index].type = normalizeType(motorcycles[index].type || motorcycles[index].tipo || motorcycles[index].categoria || '');
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
    console.log('📡 [ADMIN] DELETE /api/motorcycles/' + req.params.id);
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

// GET - Listar agendamentos
app.get('/api/appointments', (req, res) => {
  try {
    console.log('📡 [ADMIN] GET /api/appointments');
    const appointments = readData();
    console.log('✅ Enviando', appointments.length, 'agendamentos');
    res.json(appointments);
  } catch (e) {
    console.error('❌ Erro na API appointments:', e.message);
    res.status(500).json({ error: 'Erro ao carregar agendamentos' });
  }
});

// POST - Criar agendamento (se admin precisar)
app.post('/api/appointments', async (req, res) => {
  try {
    console.log('📡 [ADMIN] POST /api/appointments');
    const list = readData();
    const newItem = {
      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    list.push(newItem);
    
    if (writeData(list)) {
      console.log('✅ Agendamento salvo:', newItem.id);
      
      // Enviar notificação Telegram
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

// PUT - Atualizar agendamento (marcar como realizado)
app.put('/api/appointments/:id', (req, res) => {
  try {
    console.log('📡 [ADMIN] PUT /api/appointments/' + req.params.id);
    console.log('📦 Dados recebidos:', JSON.stringify(req.body, null, 2));
    const appointments = readData();
    const index = appointments.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    appointments[index] = {
      ...appointments[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    if (writeData(appointments)) {
      console.log('✅ Agendamento atualizado:', appointments[index].id);
      res.json(appointments[index]);
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao atualizar agendamento:', e.message);
    res.status(500).json({ error: 'Erro ao atualizar agendamento: ' + e.message });
  }
});

// PATCH - Cancelar agendamento (preserva histórico)
app.patch('/api/appointments/:id/cancel', async (req, res) => {
  try {
    console.log('📡 [ADMIN] PATCH /api/appointments/' + req.params.id + '/cancel');
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
    
    // Marcar como cancelado
    appointments[index] = {
      ...appointments[index],
      status: 'cancelado',
      canceledAt: new Date().toISOString(),
      cancelReason: req.body.cancelReason || 'Não informado',
      canceledBy: req.body.canceledBy || 'Admin',
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeData(appointments);
    if (success) {
      console.log('❌ Agendamento cancelado:', appointments[index].id);
      console.log('📝 Motivo:', appointments[index].cancelReason);
      res.json(appointments[index]);
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao cancelar agendamento:', e.message);
    res.status(500).json({ error: 'Erro ao cancelar agendamento: ' + e.message });
  }
});

// DELETE - Excluir agendamento
app.delete('/api/appointments/:id', (req, res) => {
  try {
    console.log('📡 [ADMIN] DELETE /api/appointments/' + req.params.id);
    const appointments = readData();
    const index = appointments.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    
    const deletedAppointment = appointments.splice(index, 1)[0];
    
    if (writeData(appointments)) {
      console.log('🗑️ Agendamento removido:', deletedAppointment.id);
      res.json({ message: 'Agendamento removido com sucesso', appointment: deletedAppointment });
    } else {
      throw new Error('Erro ao salvar no arquivo');
    }
  } catch (e) {
    console.error('❌ Erro ao remover agendamento:', e.message);
    res.status(500).json({ error: 'Erro ao remover agendamento: ' + e.message });
  }
});

// Rota raiz redireciona para login admin
app.get('/', (req, res) => {
  res.redirect('/admin-login.html');
});

// ========================
// ROTA: Gerar Contrato PDF
// ========================
app.post('/api/generate-contract', async (req, res) => {
  try {
    console.log('📄 [CONTRATO] Gerando contrato...');
    console.log('📋 [CONTRATO] Dados recebidos:', JSON.stringify(req.body, null, 2));
    console.log('📅 [CONTRATO] saleDate recebido:', req.body.saleDate);
    
    const contractData = req.body;
    
    // Validar dados obrigatórios
    if (!contractData.seller || !contractData.buyer || !contractData.motorcycle || !contractData.payment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos para gerar contrato' 
      });
    }
    
    // Gerar PDF
    // Determinar pasta destino por moto
    const motoId = contractData.motorcycle.id;
    let destFolder = null;
    let publicRel = null;
    if (motoId) {
      const motorcycles = readMotorcycles();
      const motoIndex = motorcycles.findIndex(m => m.id === motoId);
      if (motoIndex !== -1) {
        const moto = motorcycles[motoIndex];
        const slug = moto.docsFolder || `${moto.id || Date.now()}-${slugify(moto.name || moto.nome || moto.modelo || moto.model || moto.id)}`;
        const contratosRoot = path.join(__dirname, 'DOCS Motos', 'Contratos');
        destFolder = path.join(contratosRoot, slug);
        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
        publicRel = `docs/Contratos/${slug}`;
      }
    }

    const filePath = await contractGenerator.generateContract(contractData, destFolder);
    const fileName = path.basename(filePath);
    console.log('✅ Contrato gerado:', fileName, '->', filePath);

    // Salvar caminho do contrato no motorcycles.json (como caminho público relativo)
    if (motoId && publicRel) {
      const motorcycles = readMotorcycles();
      const motoIndex = motorcycles.findIndex(m => m.id === motoId);
      if (motoIndex !== -1) {
        const rel = path.relative(path.join(__dirname, 'DOCS Motos'), filePath).replace(/\\/g, '/');
        motorcycles[motoIndex].contratoPath = `docs/${rel}`;
        writeMotorcycles(motorcycles);
        console.log('✅ Caminho do contrato salvo para moto ID:', motoId);
      }
    }

    res.json({
      success: true,
      message: 'Contrato gerado com sucesso',
      fileName: fileName,
      filePath: filePath
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar contrato:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar contrato: ' + error.message
    });
  }
});

// Rota para gerar contrato MOTTU (retirada)
app.post('/api/generate-mottu-contract', async (req, res) => {
  try {
    console.log('📄 Gerando contrato MOTTU...', req.body);
    
    const contractData = req.body;
    
    // Validar dados obrigatórios para contrato MOTTU
    if (!contractData.buyer || !contractData.buyer.nome || !contractData.buyer.cpf) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados do cliente incompletos (nome e CPF obrigatórios)' 
      });
    }
    
    if (!contractData.motorcycle || !contractData.motorcycle.placa) {
      return res.status(400).json({ 
        success: false, 
        message: 'Placa da motocicleta obrigatória' 
      });
    }
    
    // Gerar PDF MOTTU
    const filePath = await contractGenerator.generateMottuContract(contractData);
    const fileName = path.basename(filePath);
    
    console.log('✅ Contrato MOTTU gerado:', fileName);
    
    // Salvar caminho do contrato no motorcycles.json
    const motoId = contractData.motorcycle.id;
    if (motoId) {
      const motorcycles = readMotorcycles();
      const motoIndex = motorcycles.findIndex(m => m.id === motoId);
      
      if (motoIndex !== -1) {
        motorcycles[motoIndex].contratoPath = filePath;
        writeMotorcycles(motorcycles);
        console.log('✅ Caminho do contrato MOTTU salvo para moto ID:', motoId);
      }
    }
    
    res.json({
      success: true,
      message: 'Contrato MOTTU gerado com sucesso',
      fileName: fileName,
      filePath: filePath
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar contrato MOTTU:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar contrato MOTTU: ' + error.message
    });
  }
});

// Rota para download de contratos
app.get('/api/download-contract/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'DOCS Motos', 'Contratos', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Contrato não encontrado' });
    }
    
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('❌ Erro ao fazer download:', err);
        res.status(500).json({ success: false, message: 'Erro ao fazer download' });
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao baixar contrato:', error);
    res.status(500).json({ success: false, message: 'Erro ao baixar contrato' });
  }
});

// Rota para listar arquivos de contrato dentro de uma pasta
app.get('/api/list-contract-files', (req, res) => {
  try {
    const rawPath = (req.query.path || '').replace(/^['\"]|['\"]$/g, '').trim();
    if (!rawPath) return res.status(400).json({ success: false, message: 'Parâmetro path é obrigatório' });

    // Determinar o caminho alvo no servidor
    let targetPath = '';
    let servePrefix = '/docs/'; // default to docs (DOCS Motos)

    // Caminho absoluto Windows
    if (/^[A-Za-z]:\\/.test(rawPath)) {
      if (rawPath.includes('TCC - teste')) {
        const parts = rawPath.split('TCC - teste');
        let rel = parts[parts.length - 1].replace(/^[\\\/]+/, '');
        rel = rel.replace(/\\/g, '/');
        targetPath = path.join(__dirname, rel);
        if (rel.startsWith('documents')) servePrefix = '/documents/';
      } else {
        // fallback: try Contratos folder
        const fileName = path.basename(rawPath);
        targetPath = path.join(__dirname, 'DOCS Motos', 'Contratos', fileName);
        servePrefix = '/docs/';
      }
    }
    // Caminho relativo fornecido
    else {
      const p = rawPath.replace(/^\/+/, '');
      if (p.toLowerCase().startsWith('docs motos') || p.toLowerCase().startsWith('docs%20motos')) {
        const rel = p.replace(/^docs motos[\\\/]+/i, '');
        targetPath = path.join(__dirname, 'DOCS Motos', rel);
        servePrefix = '/docs/';
      } else if (p.toLowerCase().startsWith('documents')) {
        const rel = p.replace(/^documents[\\\/]+/i, '');
        targetPath = path.join(__dirname, 'documents', rel);
        servePrefix = '/documents/';
      } else {
        // assume inside DOCS Motos/Contratos
        targetPath = path.join(__dirname, 'DOCS Motos', 'Contratos', p);
        servePrefix = '/docs/';
      }
    }

    // Resolve e valida para impedir path traversal
    const resolved = path.resolve(targetPath);
    const allowedBases = [path.resolve(path.join(__dirname, 'DOCS Motos')), path.resolve(path.join(__dirname, 'documents'))];
    const allowed = allowedBases.some(base => resolved.startsWith(base));
    if (!allowed) return res.status(400).json({ success: false, message: 'Caminho inválido' });

    if (!fs.existsSync(resolved)) return res.json({ success: true, files: [] });

    const stat = fs.statSync(resolved);
    if (stat.isFile()) {
      if (path.extname(resolved).toLowerCase() !== '.pdf') return res.status(400).json({ success: false, message: 'Arquivo não é PDF' });
      // construir URL relativa ao mount point
      const root = servePrefix === '/docs/' ? path.join(__dirname, 'DOCS Motos') : path.join(__dirname, 'documents');
      const rel = path.relative(root, resolved).replace(/\\/g, '/');
      const url = `${servePrefix}${encodeURI(rel)}`;
      return res.json({ success: true, files: [{ name: path.basename(resolved), url }] });
    }

    // Diretório: listar PDFs
    if (stat.isDirectory()) {
      const items = fs.readdirSync(resolved || '.');
      const root = servePrefix === '/docs/' ? path.join(__dirname, 'DOCS Motos') : path.join(__dirname, 'documents');
      const files = items.filter(f => f && f.toLowerCase().endsWith('.pdf')).map(f => {
        const full = path.join(resolved, f);
        const rel = path.relative(root, full).replace(/\\/g, '/');
        return { name: f, url: `${servePrefix}${encodeURI(rel)}` };
      }).sort((a,b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

      return res.json({ success: true, files });
    }

    return res.json({ success: true, files: [] });
  } catch (e) {
    console.error('❌ Erro em /api/list-contract-files:', e.message);
    res.status(500).json({ success: false, message: 'Erro ao listar arquivos' });
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
    <p>Servidor: ADMIN (porta 3001)</p>
    <a href="/">← Voltar ao login</a>
  `);
});

// Inicializar sistema de backup
initBackupScheduler({
    backupDir: path.join(__dirname, 'backups'),
    dataFiles: ['data.json', 'motorcycles.json', 'admin_users.json'],
    dataFolders: ['images', 'DOCS Motos'],
    retentionDays: 7,
    autoBackupTime: '23:00',
    enabled: true
});

// Iniciar servidor
console.log('🚀 Iniciando servidor ADMIN na porta', PORT);
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
    
    console.log('✅ Servidor ADMIN rodando!');
    console.log('📁 Servindo arquivos de:', __dirname);
    console.log('🔗 API disponível em /api/*');
    console.log('🔐 Acesso: Administradores (CRUD completo)');
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
        const motorcycles = readMotorcycles();
        console.log('🏍️ Motocicletas disponíveis:', motorcycles.length);
        const appointments = readData();
        console.log('📅 Agendamentos existentes:', appointments.length);
        console.log('✅ Servidor ADMIN pronto!');
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

console.log('🎯 Configuração do servidor ADMIN concluída!');
