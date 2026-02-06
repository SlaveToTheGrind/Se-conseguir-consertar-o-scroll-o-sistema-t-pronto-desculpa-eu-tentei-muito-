const fs = require('fs');
const path = require('path');

// Configurações
const PHOTOS_DIR = path.join(__dirname, 'Fotos motos');
const MOTORCYCLES_JSON = path.join(__dirname, 'motorcycles.json');
const IMAGES_DIR = path.join(__dirname, 'images');

// Função para ler e atualizar motorcycles.json com todas as fotos disponíveis
function scanAllPhotos() {
    console.log('📸 Iniciando escaneamento de todas as fotos...');
    
    // Ler motorcycles.json
    if (!fs.existsSync(MOTORCYCLES_JSON)) {
        console.error('❌ Arquivo motorcycles.json não encontrado!');
        return;
    }
    
    const motorcycles = JSON.parse(fs.readFileSync(MOTORCYCLES_JSON, 'utf8'));
    console.log(`📄 Carregadas ${motorcycles.length} motocicletas do JSON`);
    
    // Verificar se pasta de fotos existe
    if (!fs.existsSync(PHOTOS_DIR)) {
        console.error('❌ Pasta "Fotos motos" não encontrada!');
        return;
    }
    
    // Listar todas as pastas em "Fotos motos"
    const folders = fs.readdirSync(PHOTOS_DIR).filter(item => {
        const fullPath = path.join(PHOTOS_DIR, item);
        return fs.statSync(fullPath).isDirectory();
    });
    
    console.log(`📁 Encontradas ${folders.length} pastas de fotos`);
    
    let updatedCount = 0;
    let totalPhotosAdded = 0;
    
    // Função auxiliar para normalizar strings para comparação
    function normalize(str) {
        return str.toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[^\w\s]/g, '');
    }
    
    // Para cada moto no JSON, procurar pasta correspondente
    motorcycles.forEach(moto => {
        const motoName = moto.name || moto.nome || '';
        const motoModelo = moto.modelo || '';
        console.log(`\n🔍 Processando: ${motoName} (Modelo: ${motoModelo}, ID: ${moto.id})`);
        
        // Tentar encontrar pasta correspondente
        let matchedFolder = null;
        
        // Método 1: Match exato (case insensitive)
        matchedFolder = folders.find(folder => 
            normalize(folder) === normalize(motoName)
        );
        
        // Método 2: Match por palavras-chave do modelo
        if (!matchedFolder && motoModelo) {
            const modeloWords = normalize(motoModelo).split(' ');
            matchedFolder = folders.find(folder => {
                const folderNormalized = normalize(folder);
                return modeloWords.every(word => word.length > 2 && folderNormalized.includes(word));
            });
        }
        
        // Método 3: Match por palavras-chave do nome
        if (!matchedFolder) {
            const nameWords = normalize(motoName).split(' ').filter(w => w.length > 2);
            matchedFolder = folders.find(folder => {
                const folderNormalized = normalize(folder);
                return nameWords.some(word => folderNormalized.includes(word));
            });
        }
        
        // Método 4: Match parcial bidirecional
        if (!matchedFolder) {
            matchedFolder = folders.find(folder => {
                const folderNormalized = normalize(folder);
                const nameNormalized = normalize(motoName);
                return folderNormalized.includes(nameNormalized) || 
                       nameNormalized.includes(folderNormalized);
            });
        }
        
        if (!matchedFolder) {
            console.log(`⚠️ Nenhuma pasta encontrada para "${motoName}"`);
            console.log(`   Sugestões: ${folders.slice(0, 3).join(', ')}`);
            return;
        }
        
        console.log(`✅ Pasta encontrada: "${matchedFolder}"`);
        
        // Listar todas as imagens na pasta
        const folderPath = path.join(PHOTOS_DIR, matchedFolder);
        const files = fs.readdirSync(folderPath).filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
        });
        
        console.log(`📷 Encontradas ${files.length} fotos na pasta`);
        
        if (files.length === 0) {
            console.log(`⚠️ Nenhuma foto encontrada em "${matchedFolder}"`);
            return;
        }
        
        // Criar diretório de destino em images/
        const destDir = path.join(IMAGES_DIR, matchedFolder);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
            console.log(`📁 Criado diretório: ${destDir}`);
        }
        
        // Copiar todas as fotos e construir array de caminhos
        const imagePaths = [];
        
        files.forEach((file, index) => {
            const sourcePath = path.join(folderPath, file);
            const destPath = path.join(destDir, file);
            
            // Copiar arquivo se não existir
            if (!fs.existsSync(destPath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`  ✅ Copiado: ${file}`);
            }
            
            // Adicionar caminho ao array (relativo a partir de /images/)
            const relativePath = `images/${matchedFolder}/${file}`;
            imagePaths.push(relativePath);
        });
        
        // Atualizar objeto da moto
        moto.images = imagePaths;
        moto.image = imagePaths[0]; // Primeira imagem como principal
        moto.thumb = imagePaths[0]; // Primeira imagem como thumbnail
        
        console.log(`✅ Atualizada moto "${motoName}" com ${imagePaths.length} fotos`);
        updatedCount++;
        totalPhotosAdded += imagePaths.length;
    });
    
    // Salvar motorcycles.json atualizado
    const backup = `motorcycles.json.backup-${Date.now()}`;
    fs.copyFileSync(MOTORCYCLES_JSON, backup);
    console.log(`\n💾 Backup criado: ${backup}`);
    
    fs.writeFileSync(MOTORCYCLES_JSON, JSON.stringify(motorcycles, null, 2), 'utf8');
    console.log(`\n✅ Arquivo motorcycles.json atualizado!`);
    console.log(`📊 Estatísticas:`);
    console.log(`   - Motos atualizadas: ${updatedCount}`);
    console.log(`   - Total de fotos adicionadas: ${totalPhotosAdded}`);
    console.log(`   - Média de fotos por moto: ${(totalPhotosAdded / updatedCount).toFixed(1)}`);
}

// Executar
try {
    scanAllPhotos();
    console.log('\n✅ Processo concluído com sucesso!');
} catch (error) {
    console.error('\n❌ Erro durante o processamento:', error);
    process.exit(1);
}
