// =======================
// 📄 SISTEMA DE CONTRATOS
// MacDavis Motos
// =======================

// Verificar se jsPDF está carregado
window.addEventListener('load', function() {
    if (typeof window.jspdf !== 'undefined') {
        console.log('✅ jsPDF carregado com sucesso');
    } else {
        console.error('❌ jsPDF não encontrado! Verifique se o script está carregando.');
    }
});

// Variável global para armazenar a moto selecionada no contrato
let selectedMotoForContract = null;

/**
 * Abre o modal de geração de contrato
 * Pode ser chamado do modal de venda ou diretamente de um card de moto
 */
window.openContractModal = function(motoId) {
    // Se não passar ID, tenta pegar da venda em andamento
    if (!motoId && document.getElementById('saleModal').style.display === 'block') {
        motoId = document.getElementById('saleForm').dataset.motoId;
    }
    
    if (!motoId) {
        showNotification('Selecione uma motocicleta primeiro', 'error');
        return;
    }
    
    // Busca a moto no array
    const moto = currentMotos.find(m => m.id === motoId);
    if (!moto) {
        showNotification('Motocicleta não encontrada', 'error');
        return;
    }
    
    selectedMotoForContract = moto;
    
    // Preenche dados da moto
    document.getElementById('contractMotoModelo').value = moto.modelo || '';
    document.getElementById('contractMotoAno').value = moto.ano || '';
    document.getElementById('contractMotoPlaca').value = moto.placa || 'Sem placa';
    document.getElementById('contractMotoCor').value = moto.cor || '';
    document.getElementById('contractMotoChassi').value = moto.chassi || '';
    document.getElementById('contractMotoRenavam').value = moto.renavam || '';
    
    // Preenche valor total se estiver no modal de venda
    const salePrice = document.getElementById('salePrice')?.value;
    if (salePrice) {
        document.getElementById('contractValorTotal').value = salePrice;
    } else if (moto.preco) {
        document.getElementById('contractValorTotal').value = moto.preco;
    }
    
    // Preenche dados do comprador se estiver no modal de venda
    const buyerName = document.getElementById('buyerName')?.value;
    const buyerCPF = document.getElementById('buyerCPF')?.value;
    const buyerPhone = document.getElementById('buyerPhone')?.value;
    
    if (buyerName) document.getElementById('contractClientNome').value = buyerName;
    if (buyerCPF) document.getElementById('contractClientCPF').value = buyerCPF;
    if (buyerPhone) document.getElementById('contractClientTelefone').value = buyerPhone;
    
    // Reseta tipo de contrato para Venda
    document.querySelector('input[name="contractType"][value="venda"]').checked = true;
    updateContractForm();
    
    // Abre o modal
    document.getElementById('contractModal').style.display = 'block';
};

/**
 * Fecha o modal de contrato
 */
window.closeContractModal = function() {
    document.getElementById('contractModal').style.display = 'none';
    selectedMotoForContract = null;
};

/**
 * Atualiza o formulário conforme o tipo de contrato selecionado
 */
window.updateContractForm = function() {
    const contractType = document.querySelector('input[name="contractType"]:checked').value;
    const clientTitle = document.getElementById('contractClientTitle');
    
    // Atualiza título da seção de cliente
    switch(contractType) {
        case 'venda':
            clientTitle.textContent = '👤 Dados do Comprador';
            break;
        case 'compra':
            clientTitle.textContent = '👤 Dados do Vendedor';
            break;
        case 'troca':
            clientTitle.textContent = '👤 Dados da Outra Parte';
            break;
        case 'consignacao':
            clientTitle.textContent = '👤 Dados do Consignante';
            break;
    }
};

/**
 * Controla exibição de campos de parcelamento
 */
window.toggleParcelamento = function() {
    const formaPagamento = document.getElementById('contractFormaPagamento').value;
    const entradaGroup = document.getElementById('contractEntradaGroup');
    const parcelasGroup = document.getElementById('contractParcelasGroup');
    
    if (formaPagamento === 'parcelado' || formaPagamento === 'financiado') {
        entradaGroup.style.display = 'block';
        parcelasGroup.style.display = 'block';
        document.getElementById('contractEntrada').required = true;
        document.getElementById('contractParcelas').required = true;
    } else {
        entradaGroup.style.display = 'none';
        parcelasGroup.style.display = 'none';
        document.getElementById('contractEntrada').required = false;
        document.getElementById('contractParcelas').required = false;
    }
};

/**
 * Gera preview HTML do contrato
 */
window.previewContract = function() {
    const form = document.getElementById('contractForm');
    
    // Valida campos obrigatórios
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const contractType = document.querySelector('input[name="contractType"]:checked').value;
    const contractData = getContractData();
    
    const previewHTML = generateContractHTML(contractType, contractData);
    
    document.getElementById('contractPreviewContent').innerHTML = previewHTML;
    document.getElementById('contractPreviewModal').style.display = 'block';
};

/**
 * Fecha modal de preview
 */
window.closeContractPreview = function() {
    document.getElementById('contractPreviewModal').style.display = 'none';
};

/**
 * Coleta todos os dados do formulário de contrato
 */
function getContractData() {
    return {
        tipo: document.querySelector('input[name="contractType"]:checked').value,
        // Dados da moto
        moto: {
            modelo: document.getElementById('contractMotoModelo').value,
            ano: document.getElementById('contractMotoAno').value,
            placa: document.getElementById('contractMotoPlaca').value,
            cor: document.getElementById('contractMotoCor').value,
            chassi: document.getElementById('contractMotoChassi').value,
            renavam: document.getElementById('contractMotoRenavam').value
        },
        // Dados do cliente
        cliente: {
            nome: document.getElementById('contractClientNome').value,
            cpf: document.getElementById('contractClientCPF').value,
            rg: document.getElementById('contractClientRG').value,
            endereco: document.getElementById('contractClientEndereco').value,
            cidade: document.getElementById('contractClientCidade').value,
            estado: document.getElementById('contractClientEstado').value,
            telefone: document.getElementById('contractClientTelefone').value,
            email: document.getElementById('contractClientEmail').value
        },
        // Valores
        valores: {
            total: parseFloat(document.getElementById('contractValorTotal').value),
            formaPagamento: document.getElementById('contractFormaPagamento').value,
            entrada: parseFloat(document.getElementById('contractEntrada').value) || 0,
            parcelas: parseInt(document.getElementById('contractParcelas').value) || 0
        },
        observacoes: document.getElementById('contractObservacoes').value,
        data: new Date().toLocaleDateString('pt-BR')
    };
}

/**
 * Gera HTML do contrato para preview
 */
function generateContractHTML(tipo, data) {
    const tipoNome = {
        'venda': 'CONTRATO DE COMPRA E VENDA DE VEÍCULO',
        'compra': 'CONTRATO DE COMPRA DE VEÍCULO',
        'troca': 'CONTRATO DE PERMUTA DE VEÍCULOS',
        'consignacao': 'CONTRATO DE CONSIGNAÇÃO DE VEÍCULO'
    };
    
    const parteNome = {
        'venda': 'COMPRADOR',
        'compra': 'VENDEDOR',
        'troca': 'PERMUTANTE',
        'consignacao': 'CONSIGNANTE'
    };
    
    let html = `
        <div class="contract-header">
            <h1>${tipoNome[tipo]}</h1>
            <p><strong>MacDavis Motos</strong></p>
            <p>CNPJ: 00.000.000/0001-00</p>
            <p>Data: ${data.data}</p>
        </div>
        
        <div class="contract-parties">
            <div class="contract-party">
                <h2>VENDEDOR / LOJA:</h2>
                <p><strong>MacDavis Motos</strong></p>
                <p>CNPJ: 00.000.000/0001-00</p>
                <p>Endereço: [Endereço da loja]</p>
            </div>
            
            <div class="contract-party">
                <h2>${parteNome[tipo]}:</h2>
                <p><strong>${data.cliente.nome}</strong></p>
                <p>CPF: ${data.cliente.cpf} | RG: ${data.cliente.rg}</p>
                <p>Endereço: ${data.cliente.endereco}, ${data.cliente.cidade}/${data.cliente.estado}</p>
                <p>Telefone: ${data.cliente.telefone}</p>
                ${data.cliente.email ? `<p>Email: ${data.cliente.email}</p>` : ''}
            </div>
        </div>
        
        <div class="contract-clauses">
            <div class="contract-clause">
                <h2>OBJETO DO CONTRATO</h2>
                <p>O presente contrato tem por objeto o veículo especificado abaixo:</p>
                <ul>
                    <li><strong>Marca/Modelo:</strong> ${data.moto.modelo}</li>
                    <li><strong>Ano:</strong> ${data.moto.ano}</li>
                    <li><strong>Placa:</strong> ${data.moto.placa}</li>
                    <li><strong>Cor:</strong> ${data.moto.cor}</li>
                    <li><strong>Chassi:</strong> ${data.moto.chassi}</li>
                    <li><strong>RENAVAM:</strong> ${data.moto.renavam}</li>
                </ul>
            </div>
            
            <div class="contract-clause">
                <h2>CLÁUSULA PRIMEIRA - DO VALOR</h2>
                <p>O valor total do veículo é de <strong>R$ ${data.valores.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>.</p>
                ${generatePaymentClause(data.valores)}
            </div>
            
            <div class="contract-clause">
                <h2>CLÁUSULA SEGUNDA - DAS CONDIÇÕES</h2>
                <p>O veículo é vendido no estado em que se encontra, tendo o ${parteNome[tipo].toLowerCase()} pleno conhecimento de suas condições.</p>
            </div>
            
            <div class="contract-clause">
                <h2>CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES</h2>
                <p>O vendedor se compromete a entregar toda a documentação do veículo devidamente regularizada.</p>
                <p>O ${parteNome[tipo].toLowerCase()} se compromete a efetuar o pagamento nas condições acordadas.</p>
            </div>
            
            ${data.observacoes ? `
            <div class="contract-clause">
                <h2>OBSERVAÇÕES ADICIONAIS</h2>
                <p>${data.observacoes}</p>
            </div>
            ` : ''}
        </div>
        
        <div class="contract-signatures">
            <div class="signature-block">
                <p><strong>MacDavis Motos</strong></p>
                <p>VENDEDOR</p>
            </div>
            <div class="signature-block">
                <p><strong>${data.cliente.nome}</strong></p>
                <p>${parteNome[tipo]}</p>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Gera cláusula de pagamento conforme forma escolhida
 */
function generatePaymentClause(valores) {
    const formas = {
        'avista': 'à vista',
        'parcelado': 'parcelado',
        'financiado': 'financiado'
    };
    
    let clause = `<p>Forma de pagamento: <strong>${formas[valores.formaPagamento]}</strong>.</p>`;
    
    if (valores.formaPagamento === 'parcelado' && valores.parcelas > 0) {
        const valorParcela = (valores.total - valores.entrada) / valores.parcelas;
        clause += `<p>Entrada: R$ ${valores.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>`;
        clause += `<p>Parcelado em ${valores.parcelas}x de R$ ${valorParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>`;
    } else if (valores.formaPagamento === 'financiado') {
        clause += `<p>Entrada: R$ ${valores.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>`;
        clause += `<p>Restante financiado em ${valores.parcelas} parcelas.</p>`;
    }
    
    return clause;
}

/**
 * Gera e faz download do PDF do contrato
 */
window.generateContract = async function(event) {
    event.preventDefault();
    
    console.log('🔍 [DEBUG] generateContract chamado');
    
    const form = document.getElementById('contractForm');
    
    // Valida campos obrigatórios
    if (!form.checkValidity()) {
        console.log('❌ [DEBUG] Formulário inválido');
        form.reportValidity();
        return;
    }
    
    console.log('✅ [DEBUG] Formulário válido, iniciando geração...');
    
    showNotification('Gerando contrato profissional em PDF...', 'info');
    
    try {
        // Verificar se jsPDF está disponível
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF não está carregado. Atualize a página.');
        }
        
        console.log('✅ [DEBUG] jsPDF encontrado');
        
        const data = getContractData();
        console.log('✅ [DEBUG] Dados coletados:', data);
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        console.log('✅ [DEBUG] Documento PDF criado');
        
        // Configurações
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let y = margin;
        
        // === CABEÇALHO COM LOGO ===
        // Retângulo laranja no topo
        doc.setFillColor(255, 102, 0);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Nome da empresa
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('MacDavis Motos', pageWidth / 2, 15, { align: 'center' });
        
        // Subtítulo
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Comércio de Motocicletas Novas e Usadas', pageWidth / 2, 22, { align: 'center' });
        doc.text('CNPJ: 00.000.000/0001-00 | Tel: (44) 99999-9999', pageWidth / 2, 28, { align: 'center' });
        
        y = 45;
        
        // === TÍTULO DO CONTRATO ===
        const tipoNome = {
            'venda': 'CONTRATO DE COMPRA E VENDA DE VEÍCULO',
            'compra': 'CONTRATO DE COMPRA DE VEÍCULO',
            'troca': 'CONTRATO DE PERMUTA DE VEÍCULOS',
            'consignacao': 'CONTRATO DE CONSIGNAÇÃO DE VEÍCULO'
        };
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(tipoNome[data.tipo], pageWidth / 2, y, { align: 'center' });
        
        y += 10;
        
        // Data do contrato
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${data.data}`, pageWidth - margin, y, { align: 'right' });
        
        y += 15;
        
        // === PARTES DO CONTRATO ===
        // Box VENDEDOR
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, contentWidth / 2 - 5, 35, 3, 3, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 102, 0);
        doc.text('VENDEDOR / LOJA:', margin + 5, y + 7);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text('MacDavis Motos', margin + 5, y + 14);
        doc.text('CNPJ: 00.000.000/0001-00', margin + 5, y + 20);
        doc.text('Clianorte - PR', margin + 5, y + 26);
        
        // Box COMPRADOR/CLIENTE
        const parteNome = {
            'venda': 'COMPRADOR',
            'compra': 'VENDEDOR',
            'troca': 'PERMUTANTE',
            'consignacao': 'CONSIGNANTE'
        };
        
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(pageWidth / 2 + 5, y, contentWidth / 2 - 5, 35, 3, 3, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 102, 0);
        doc.text(parteNome[data.tipo] + ':', pageWidth / 2 + 10, y + 7);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        doc.text(data.cliente.nome, pageWidth / 2 + 10, y + 14);
        doc.text(`CPF: ${data.cliente.cpf}`, pageWidth / 2 + 10, y + 20);
        doc.text(`Tel: ${data.cliente.telefone}`, pageWidth / 2 + 10, y + 26);
        
        y += 45;
        
        // === DADOS DO VEÍCULO ===
        // Linha decorativa
        doc.setDrawColor(255, 102, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        
        y += 8;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 102, 0);
        doc.text('OBJETO DO CONTRATO - VEÍCULO', margin, y);
        
        y += 8;
        
        // Box com dados do veículo
        doc.setFillColor(255, 248, 240);
        doc.roundedRect(margin, y, contentWidth, 42, 3, 3, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        
        const col1 = margin + 5;
        const col2 = pageWidth / 2;
        
        doc.text('Marca/Modelo:', col1, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(data.moto.modelo, col1 + 30, y + 7);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Ano:', col2, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(data.moto.ano, col2 + 15, y + 7);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Placa:', col1, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(data.moto.placa, col1 + 30, y + 14);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Cor:', col2, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(data.moto.cor, col2 + 15, y + 14);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Chassi:', col1, y + 21);
        doc.setFont('helvetica', 'normal');
        doc.text(data.moto.chassi, col1 + 30, y + 21);
        
        doc.setFont('helvetica', 'bold');
        doc.text('RENAVAM:', col2, y + 21);
        doc.setFont('helvetica', 'normal');
        doc.text(data.moto.renavam, col2 + 25, y + 21);
        
        y += 52;
        
        // === CLÁUSULAS ===
        // CLÁUSULA 1 - VALOR
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 102, 0);
        doc.text('CLÁUSULA PRIMEIRA - DO VALOR E CONDIÇÕES DE PAGAMENTO', margin, y);
        
        y += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        const valorTotal = `R$ ${data.valores.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        doc.text(`O valor total do veículo é de ${valorTotal} (${numeroExtenso(data.valores.total)}).`, margin, y, {
            maxWidth: contentWidth,
            align: 'justify'
        });
        
        y += 10;
        
        // Forma de pagamento
        const formas = {
            'avista': 'À VISTA',
            'parcelado': 'PARCELADO',
            'financiado': 'FINANCIADO'
        };
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Forma de pagamento: ${formas[data.valores.formaPagamento]}`, margin, y);
        
        y += 6;
        
        doc.setFont('helvetica', 'normal');
        if (data.valores.formaPagamento === 'parcelado' && data.valores.parcelas > 0) {
            const valorParcela = (data.valores.total - data.valores.entrada) / data.valores.parcelas;
            doc.text(`• Entrada: R$ ${data.valores.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 5, y);
            y += 5;
            doc.text(`• Parcelado em ${data.valores.parcelas}x de R$ ${valorParcela.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 5, y);
        } else if (data.valores.formaPagamento === 'financiado') {
            doc.text(`• Entrada: R$ ${data.valores.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, margin + 5, y);
            y += 5;
            doc.text(`• Restante financiado em ${data.valores.parcelas} parcelas`, margin + 5, y);
        }
        
        y += 12;
        
        // CLÁUSULA 2 - CONDIÇÕES DO VEÍCULO
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 102, 0);
        doc.text('CLÁUSULA SEGUNDA - DAS CONDIÇÕES DO VEÍCULO', margin, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const textoClausula2 = `O veículo é vendido no estado em que se encontra, tendo o ${parteNome[data.tipo].toLowerCase()} pleno conhecimento de suas condições físicas e mecânicas, não cabendo reclamações posteriores.`;
        doc.text(textoClausula2, margin, y, {
            maxWidth: contentWidth,
            align: 'justify'
        });
        
        y += 12;
        
        // CLÁUSULA 3 - OBRIGAÇÕES
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 102, 0);
        doc.text('CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DAS PARTES', margin, y);
        
        y += 7;
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('O VENDEDOR se compromete a:', margin, y);
        y += 5;
        doc.text('• Entregar toda a documentação do veículo devidamente regularizada;', margin + 5, y);
        y += 5;
        doc.text('• Transferir a propriedade do veículo ao comprador.', margin + 5, y);
        
        y += 8;
        
        doc.text(`O ${parteNome[data.tipo]} se compromete a:`, margin, y);
        y += 5;
        doc.text('• Efetuar o pagamento nas condições e prazos acordados;', margin + 5, y);
        y += 5;
        doc.text('• Providenciar a transferência do veículo para seu nome junto ao DETRAN.', margin + 5, y);
        
        y += 12;
        
        // Observações
        if (data.observacoes) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 102, 0);
            doc.text('OBSERVAÇÕES ADICIONAIS', margin, y);
            
            y += 7;
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const lines = doc.splitTextToSize(data.observacoes, contentWidth);
            doc.text(lines, margin, y);
            y += lines.length * 5;
        }
        
        // === ASSINATURAS ===
        // Posicionar no final da página
        y = pageHeight - 45;
        
        // Linha decorativa
        doc.setDrawColor(255, 102, 0);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        
        y += 10;
        
        // Linhas para assinatura
        const sigWidth = 70;
        const sigY = y + 15;
        
        // Assinatura Vendedor
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.line(margin, sigY, margin + sigWidth, sigY);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('MacDavis Motos', margin + sigWidth / 2, sigY + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('VENDEDOR', margin + sigWidth / 2, sigY + 9, { align: 'center' });
        
        // Assinatura Comprador
        const sigX2 = pageWidth - margin - sigWidth;
        doc.line(sigX2, sigY, sigX2 + sigWidth, sigY);
        
        doc.setFont('helvetica', 'bold');
        doc.text(data.cliente.nome, sigX2 + sigWidth / 2, sigY + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(parteNome[data.tipo], sigX2 + sigWidth / 2, sigY + 9, { align: 'center' });
        
        // Rodapé
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('Contrato gerado pelo Sistema MacDavis Motos', pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        console.log('✅ [DEBUG] PDF montado, salvando...');
        
        // Salvar PDF
        const nomeArquivo = `Contrato_${data.tipo}_${data.moto.placa}_${new Date().getTime()}.pdf`;
        doc.save(nomeArquivo);
        
        console.log('✅ [DEBUG] PDF salvo:', nomeArquivo);
        
        showNotification('✅ Contrato PDF gerado com sucesso!', 'success');
        closeContractModal();
        
    } catch (error) {
        console.error('❌ [ERROR] Erro ao gerar PDF:', error);
        showNotification('❌ Erro ao gerar PDF: ' + error.message, 'error');
    }
};

/**
 * Converte número para extenso (simplificado)
 */
function numeroExtenso(valor) {
    // Versão simplificada - em produção usar biblioteca completa
    const partes = valor.toFixed(2).split('.');
    const reais = parseInt(partes[0]);
    const centavos = parseInt(partes[1]);
    
    if (centavos > 0) {
        return `${reais} reais e ${centavos} centavos`;
    }
    return `${reais} reais`;
}

// Inicializar event listener do formulário quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    const contractForm = document.getElementById('contractForm');
    if (contractForm) {
        contractForm.addEventListener('submit', generateContract);
        console.log('✅ Event listener do contrato adicionado');
    } else {
        console.warn('⚠️ Formulário de contrato não encontrado no DOM');
    }
});

console.log('📄 Sistema de Contratos carregado com sucesso');
