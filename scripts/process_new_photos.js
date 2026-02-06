// Script para processar especificamente as fotos da Titan EX 2011 e NC 750X 2015
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function processNewPhotos() {
    const motorcyclesPath = path.join(__dirname, '../data/motorcycles.json');
    const fotosDir = path.join(__dirname, '../Fotos motos');
    const imagesDir = path.join(__dirname, '../images');
    
    console.log('Carregando catálogo de motocicletas...');
    let motorcycles = JSON.parse(fs.readFileSync(motorcyclesPath, 'utf8'));
    
    // Encontrar pasta da Titan EX 2011
    const titanFolder = 'Titan 150 EX 2011';
    const ncFolder = 'NC 750X 2015';
    
    // Processar Titan EX 2011
    console.log('\n=== Processando Titan EX 2011 ===');
    const titanMotorcycle = motorcycles.find(m => 
        m.name.includes('Titan') && m.name.includes('EX') && m.year.includes('2011')
    );
    
    if (titanMotorcycle) {
        console.log(`Encontrada: ${titanMotorcycle.name} (ID: ${titanMotorcycle.id})`);
        await processFolderForMotorcycle(titanFolder, titanMotorcycle, imagesDir, fotosDir);
    } else {
        console.log('❌ Titan EX 2011 não encontrada no catálogo');
    }
    
    // Verificar se NC 750X já existe
    console.log('\n=== Verificando NC 750X ===');
    const ncMotorcycle = motorcycles.find(m => 
        m.name.includes('NC') && m.name.includes('750')
    );
    
    if (!ncMotorcycle) {
        console.log('NC 750X não encontrada. Criando nova entrada...');
        
        const newNCMotorcycle = {
            id: `moto-${motorcycles.length + 1}`,
            name: "NC 750X",
            year: "2015/15",
            color: "Preta",
            mileage_display: "0",
            mileage: 0,
            desc: "NC 750X 2015/15 (Preta)",
            displacement: 750
        };
        
        await processFolderForMotorcycle(ncFolder, newNCMotorcycle, imagesDir, fotosDir);
        motorcycles.push(newNCMotorcycle);
        console.log(`✅ NC 750X adicionada com ID: ${newNCMotorcycle.id}`);
    } else {
        console.log(`Encontrada: ${ncMotorcycle.name} (ID: ${ncMotorcycle.id})`);
        await processFolderForMotorcycle(ncFolder, ncMotorcycle, imagesDir, fotosDir);
    }
    
    // Salvar catálogo atualizado
    fs.writeFileSync(motorcyclesPath, JSON.stringify(motorcycles, null, 2));
    console.log('\n✅ Catálogo atualizado salvo!');
}

async function processFolderForMotorcycle(folderName, motorcycle, imagesDir, fotosDir) {
    const folderPath = path.join(fotosDir, folderName);
    
    if (!fs.existsSync(folderPath)) {
        console.log(`❌ Pasta não encontrada: ${folderName}`);
        return;
    }
    
    const files = fs.readdirSync(folderPath).filter(f => 
        f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg')
    );
    
    if (files.length === 0) {
        console.log(`❌ Nenhuma foto encontrada em: ${folderName}`);
        return;
    }
    
    console.log(`📁 Processando ${files.length} fotos da pasta: ${folderName}`);
    
    // Criar pasta de destino
    const destFolder = path.join(imagesDir, folderName);
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
    }
    
    const processedImages = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sourcePath = path.join(folderPath, file);
        const destPath = path.join(destFolder, file);
        const thumbPath = path.join(destFolder, `thumb-${file}`);
        
        try {
            // Copiar arquivo original
            fs.copyFileSync(sourcePath, destPath);
            console.log(`📋 Copiado: ${file}`);
            
            // Gerar thumbnail
            await sharp(sourcePath)
                .resize(300, 200, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toFile(thumbPath);
            
            console.log(`🖼️  Thumbnail gerado: thumb-${file}`);
            
            processedImages.push(`images/${folderName}/thumb-${file}`);
            
        } catch (error) {
            console.error(`❌ Erro ao processar ${file}:`, error.message);
        }
    }
    
    // Atualizar dados da motocicleta
    if (processedImages.length > 0) {
        motorcycle.image = processedImages[0];
        motorcycle.thumb = processedImages[0];
        motorcycle.images = processedImages;
        
        console.log(`✅ ${motorcycle.name}: ${processedImages.length} imagens processadas`);
        console.log(`   Imagem principal: ${motorcycle.image}`);
    }
}

// Executar
processNewPhotos().catch(console.error);