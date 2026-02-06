// =======================
// 📄 SISTEMA DE CONTRATOS - MacDavis Motos
// Template OFICIAL da loja
// =======================

// Variável global para armazenar a moto selecionada no contrato
let selectedMotoForContract = null;

/**
 * Abre o modal de geração de contrato
 */
window.openContractModal = async function(motoId) {
    console.log('📄 Abrindo modal de contrato para moto:', motoId);
    
    if (!motoId) {
        alert('Selecione uma motocicleta primeiro');
        return;
    }
    
    // Busca a moto direto do servidor para garantir dados atualizados (incluindo saleDate)
    try {
        const response = await fetch(`/api/motorcycles/${motoId}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar motocicleta');
        }
        const moto = await response.json();
        
        console.log('🏍️ [DEBUG] Moto carregada do servidor:', moto);
        console.log('📅 [DEBUG] moto.saleDate:', moto.saleDate);
        
        if (!moto) {
            alert('Motocicleta não encontrada');
            return;
        }
        
        selectedMotoForContract = moto;
    
        // Verificar se é moto MOTTU
        const isMottu = moto.marca && moto.marca.toUpperCase().includes('MOTTU');
        
        // Preencher informações da moto (display only)
        document.getElementById('contractMotoId').value = moto.id;
        document.getElementById('contractMotoDisplay').textContent = `${moto.marca} ${moto.modelo}`;
        document.getElementById('contractAnoDisplay').textContent = moto.ano || 'N/A';
        document.getElementById('contractCorDisplay').textContent = moto.cor || 'N/A';
        document.getElementById('contractPlacaDisplay').textContent = moto.placa || 'Sem placa';
        
        // Limpar form
        document.getElementById('contractForm').reset();
        document.getElementById('contractMotoId').value = moto.id;
        
        // Preencher data da venda se existir
        if (moto.saleDate) {
            const saleDateInput = document.getElementById('saleDate');
            if (saleDateInput) {
                // Converter ISO date para YYYY-MM-DD
                let dateValue = moto.saleDate;
                if (dateValue.includes('T')) {
                    // É ISO, extrair apenas a parte da data
                    dateValue = dateValue.split('T')[0];
                }
                saleDateInput.value = dateValue;
                console.log('📅 Data da venda preenchida no contrato:', dateValue);
            }
        } else {
            console.log('⚠️ Moto não tem saleDate definido');
        }
    
        // Se for MOTTU, ocultar campos de pagamento, endereço e simplificar
        const paymentSection = document.querySelector('#contractForm .payment-section');
        const addressField = document.getElementById('addressField');
        const enderecoInput = document.getElementById('buyerEndereco');
        
        if (isMottu) {
            // Ocultar seção de pagamento
            if (paymentSection) {
                paymentSection.style.display = 'none';
                // Remover required de todos os inputs dentro da seção de pagamento
                const paymentInputs = paymentSection.querySelectorAll('input[required]');
                paymentInputs.forEach(input => {
                    input.removeAttribute('required');
                });
            }
            
            // Ocultar campo de endereço e remover obrigatoriedade
            if (addressField) addressField.style.display = 'none';
            if (enderecoInput) enderecoInput.removeAttribute('required');
            
            // Adicionar badge indicando contrato MOTTU
            const titleEl = document.querySelector('#contractModal h2');
            if (titleEl && !titleEl.querySelector('.mottu-badge')) {
                const badge = document.createElement('span');
                badge.className = 'mottu-badge';
                badge.textContent = '🏍️ MOTTU';
                badge.style.cssText = 'background: #00bcd4; color: white; padding: 4px 12px; border-radius: 4px; margin-left: 10px; font-size: 12px;';
                titleEl.appendChild(badge);
            }
        } else {
            // Mostrar seção de pagamento
            if (paymentSection) {
                paymentSection.style.display = 'block';
                // Restaurar required nos inputs de pagamento
                const valorTotalInput = document.getElementById('valorTotal');
                if (valorTotalInput) valorTotalInput.setAttribute('required', 'required');
            }
            
            // Mostrar campo de endereço e tornar obrigatório
            if (addressField) addressField.style.display = 'block';
            if (enderecoInput) enderecoInput.setAttribute('required', 'required');
            
            // Remover badge MOTTU se existir
            const badge = document.querySelector('#contractModal .mottu-badge');
            if (badge) badge.remove();
        }
        
        // Mostrar modal
        document.getElementById('contractModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Erro ao buscar dados da moto:', error);
        alert('Erro ao carregar informações da motocicleta. Tente novamente.');
    }
};

/**
 * Fecha o modal de contrato
 */
window.closeContractModal = function() {
    document.getElementById('contractModal').style.display = 'none';
    selectedMotoForContract = null;
};

/**
 * Formata CPF
 */
window.formatCPF = function(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    input.value = value;
};

/**
 * Formata RG/CPF automaticamente
 * - RG antigo (9 dígitos): 00.000.000-0
 * - Novo RG/CPF (11 dígitos): 000.000.000-00
 */
window.formatRG = function(input) {
    // Remove tudo que não é número
    let value = input.value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (CPF)
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    // Formata baseado no tamanho atual
    if (value.length >= 10) {
        // Formato CPF/Novo RG: 000.000.000-00 (11 dígitos)
        if (value.length === 11) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length === 10) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
        }
    } else if (value.length >= 7) {
        // Transição entre RG e CPF: mostra como RG ainda
        if (value.length === 9) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
        } else if (value.length === 8) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
        } else if (value.length === 7) {
            value = value.replace(/(\d{2})(\d{3})(\d{2})/, '$1.$2.$3');
        }
    } else if (value.length >= 5) {
        // Formato RG inicial
        value = value.replace(/(\d{2})(\d{3})/, '$1.$2');
    } else if (value.length >= 2) {
        value = value.replace(/(\d{2})/, '$1.');
    }
    
    input.value = value;
};

/**
 * Atualizar valor por extenso
 */
window.updateValorExtenso = function() {
    const valor = parseFloat(document.getElementById('valorTotal').value) || 0;
    const extenso = numeroParaExtenso(valor);
    document.getElementById('valorTotalExtenso').textContent = extenso ? `(${extenso})` : '';
};

/**
 * Atualizar valores de pagamento
 */
window.updatePagamentoValues = function() {
    const dinheiro = parseFloat(document.getElementById('valorDinheiro').value) || 0;
    const cartao = parseFloat(document.getElementById('valorCartao').value) || 0;
    const financiado = parseFloat(document.getElementById('valorFinanciado')?.value) || 0;
    
    // Atualizar extensos
    if (dinheiro > 0) {
        document.getElementById('dinheiroExtenso').textContent = `(${numeroParaExtenso(dinheiro)})`;
    } else {
        document.getElementById('dinheiroExtenso').textContent = '';
    }
    
    if (cartao > 0) {
        document.getElementById('cartaoExtenso').textContent = `(${numeroParaExtenso(cartao)})`;
    } else {
        document.getElementById('cartaoExtenso').textContent = '';
    }

    if (financiado > 0) {
        const el = document.getElementById('financiadoExtenso');
        if (el) el.textContent = `(${numeroParaExtenso(financiado)})`;
    } else {
        const el = document.getElementById('financiadoExtenso');
        if (el) el.textContent = '';
    }
    
    // Atualizar valor total
    const total = dinheiro + cartao + financiado;
    document.getElementById('valorTotal').value = total.toFixed(2);
    updateValorExtenso();
};

/**
 * Atualizar parcelas por extenso
 */
window.updateParcelasExtenso = function() {
    const parcelas = parseInt(document.getElementById('numeroParcelas').value) || 1;
    const extenso = numeroParaExtenso(parcelas).replace(' reais', '');
    document.getElementById('parcelasExtenso').textContent = extenso ? `(${extenso})` : '';
};

/**
 * Gerar contrato PDF
 */
window.generateContract = async function(event) {
    event.preventDefault();
    
    console.log('📄 [DEBUG] generateContract INICIADO!');
    console.log('📄 [DEBUG] event:', event);
    console.log('selectedMotoForContract:', selectedMotoForContract);
    
    // Validar moto selecionada
    if (!selectedMotoForContract) {
        alert('Nenhuma motocicleta selecionada');
        return;
    }
    
    // Verificar se é moto MOTTU
    const isMottu = selectedMotoForContract.marca && selectedMotoForContract.marca.toUpperCase().includes('MOTTU');
    console.log('🏍️ É MOTTU?', isMottu);
    
    // Se for MOTTU, gerar contrato simplificado
    if (isMottu) {
        return generateMottuContract();
    }
    
    // Validar soma ANTES de mostrar loading
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const valorDinheiro = parseFloat(document.getElementById('valorDinheiro').value) || 0;
    const valorCartao = parseFloat(document.getElementById('valorCartao').value) || 0;
    const valorFinanciado = parseFloat(document.getElementById('valorFinanciado')?.value) || 0;
    
    if (Math.abs((valorDinheiro + valorCartao + valorFinanciado) - valorTotal) > 0.01) {
        alert('A soma de dinheiro + cartão + financiado deve ser igual ao valor total');
        return;
    }
    
    // ⏱️ Marcar início para garantir loading de 2.5s mínimo
    const loadingStartTime = Date.now();
    
    // 🎬 Mostrar loading
    console.log('🎬 [DEBUG] Tentando mostrar SmartLoading...');
    if (window.SmartLoading) {
        console.log('✅ [DEBUG] SmartLoading encontrado!');
        SmartLoading.show('Gerando contrato PDF...');
    } else {
        console.error('❌ [DEBUG] SmartLoading NÃO encontrado!');
    }
    
    // Coletar dados do formulário (contrato padrão)
    const numeroParcelas = parseInt(document.getElementById('numeroParcelas').value) || 1;
    
    // Ler data da venda (se fornecida)
    const saleDate = document.getElementById('saleDate') ? document.getElementById('saleDate').value : null;
    
    console.log('💰 Valores:', { valorTotal, valorDinheiro, valorCartao, numeroParcelas, saleDate });
    console.log('📅 [DEBUG] saleDate do formulário:', saleDate);
    console.log('📅 [DEBUG] selectedMotoForContract.saleDate:', selectedMotoForContract.saleDate);
    
    // Montar dados do contrato
    const contractData = {
        seller: {
            nome: 'MacDavis Motos LTDA',
            cpf: '00.000.000/0001-00', // Substitua pelo CNPJ real
            endereco: 'Rua Exemplo, 123, Centro, Cidade - UF' // Substitua pelo endereço real
        },
        buyer: {
            nome: document.getElementById('buyerNome').value,
            cpf: document.getElementById('buyerCPF').value,
            rg: document.getElementById('buyerRG').value,
            endereco: document.getElementById('buyerEndereco').value
        },
        motorcycle: {
            id: selectedMotoForContract.id,
            marca: selectedMotoForContract.marca,
            modelo: selectedMotoForContract.modelo,
            ano: selectedMotoForContract.ano,
            cor: selectedMotoForContract.cor,
            placa: selectedMotoForContract.placa || 'N/A',
            chassi: selectedMotoForContract.chassi || 'N/A',
            renavam: selectedMotoForContract.renavam || 'N/A',
            quilometragem: selectedMotoForContract.quilometragem || selectedMotoForContract.km || 'N/A',
            estado: selectedMotoForContract.estado || 'BOM'
        },
        payment: {
            valorTotal: valorTotal,
            valorTotalExtenso: numeroParaExtenso(valorTotal),
            dinheiro: valorDinheiro,
            dinheiroExtenso: valorDinheiro > 0 ? numeroParaExtenso(valorDinheiro) : '',
            cartao: valorCartao,
            cartaoExtenso: valorCartao > 0 ? numeroParaExtenso(valorCartao) : '',
            financiado: valorFinanciado,
            financiadoExtenso: valorFinanciado > 0 ? numeroParaExtenso(valorFinanciado) : '',
            parcelas: numeroParcelas,
            parcelasExtenso: numeroParaExtenso(numeroParcelas).replace(' reais', '')
        },
        saleDate: saleDate // Data da venda escolhida pelo usuário
    };
    
    console.log('📋 Dados do contrato:', contractData);
    console.log('📅 [DEBUG] saleDate sendo enviado:', contractData.saleDate);
    
    try {
        // Enviar para o backend gerar PDF
        console.log('🌐 Enviando para /api/generate-contract...');
        
        const response = await fetch('/api/generate-contract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contractData)
        });
        
        console.log('📡 Response status:', response.status);
        const result = await response.json();
        console.log('📋 Response data:', result);
        
        // ⏳ Garantir loading mínimo de 2.5s
        const elapsedTime = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, 2500 - elapsedTime);
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // 🔴 Esconder loading
        if (window.SmartLoading) {
            await SmartLoading.hide();
        }
        
        if (result.success) {
            alert('✅ Contrato gerado com sucesso!');
            console.log('✅ Contrato salvo:', result.fileName);
            
            // Abrir PDF em nova aba (opcional)
            window.open(`/api/download-contract/${result.fileName}`, '_blank');
            
            // Fechar modal
            closeContractModal();
        } else {
            alert('❌ Erro ao gerar contrato: ' + result.message);
            console.error('❌ Erro:', result.message);
        }
        
    } catch (error) {
        // 🔴 Esconder loading em caso de erro
        if (window.SmartLoading) {
            await SmartLoading.hide();
        }
        console.error('❌ Erro ao gerar contrato:', error);
        alert('❌ Erro ao gerar contrato: ' + error.message);
    }
};

/**
 * Gerar contrato MOTTU (retirada)
 */
async function generateMottuContract() {
    console.log('🏍️ [MOTTU] generateMottuContract INICIADO!');
    console.log('🏍️ [MOTTU] selectedMotoForContract:', selectedMotoForContract);
    
    // Validar que temos a moto selecionada
    if (!selectedMotoForContract) {
        console.error('❌ [MOTTU] Nenhuma moto selecionada!');
        alert('Erro: Nenhuma motocicleta selecionada');
        return;
    }
    
    // ⏱️ Marcar início para garantir loading de 2.5s mínimo
    const loadingStartTime = Date.now();
    
    // 🎬 Mostrar loading
    if (window.SmartLoading) {
        SmartLoading.show('Gerando contrato MOTTU...');
    }
    
    // Ler data da venda do formulário
    const saleDate = document.getElementById('saleDate') ? document.getElementById('saleDate').value : null;
    console.log('📅 [MOTTU] saleDate do formulário:', saleDate);
    console.log('📅 [MOTTU] selectedMotoForContract.saleDate:', selectedMotoForContract.saleDate);
    
    // Montar dados simplificados do contrato MOTTU
    const contractData = {
        buyer: {
            nome: document.getElementById('buyerNome').value,
            cpf: document.getElementById('buyerCPF').value
        },
        motorcycle: {
            id: selectedMotoForContract.id,
            marca: selectedMotoForContract.marca,
            modelo: selectedMotoForContract.modelo,
            placa: selectedMotoForContract.placa || 'N/A'
        },
        saleDate: saleDate
    };
    
    console.log('📋 Dados do contrato MOTTU:', contractData);
    console.log('📅 [MOTTU] saleDate sendo enviado:', contractData.saleDate);
    
    try {
        // Enviar para o backend gerar PDF MOTTU
        console.log('🌐 Enviando para /api/generate-mottu-contract...');
        
        const response = await fetch('/api/generate-mottu-contract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contractData)
        });
        
        console.log('📡 Response status:', response.status);
        const result = await response.json();
        console.log('📋 Response data:', result);
        
        // ⏳ Garantir loading mínimo de 2.5s
        const elapsedTime = Date.now() - loadingStartTime;
        const remainingTime = Math.max(0, 2500 - elapsedTime);
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // 🔴 Esconder loading
        if (window.SmartLoading) {
            await SmartLoading.hide();
        }
        
        if (result.success) {
            if (window.Toast) {
                Toast.success('Contrato MOTTU gerado com sucesso!');
            } else {
                alert('✅ Contrato MOTTU gerado com sucesso!');
            }
            console.log('✅ Contrato salvo:', result.fileName);
            
            // Abrir PDF em nova aba
            window.open(`/api/download-contract/${result.fileName}`, '_blank');
            
            // Fechar modal
            closeContractModal();
        } else {
            if (window.Toast) {
                Toast.error('Erro ao gerar contrato MOTTU: ' + result.message);
            } else {
                alert('❌ Erro ao gerar contrato MOTTU: ' + result.message);
            }
            console.error('❌ Erro:', result.message);
        }
        
    } catch (error) {
        // 🔴 Esconder loading em caso de erro
        if (window.SmartLoading) {
            await SmartLoading.hide();
        }
        console.error('❌ Erro ao gerar contrato MOTTU:', error);
        
        if (window.Toast) {
            Toast.error('Erro ao gerar contrato MOTTU: ' + error.message);
        } else {
            alert('❌ Erro ao gerar contrato MOTTU: ' + error.message);
        }
    }
}

/**
 * Converter número para extenso (simplificado)
 */
function numeroParaExtenso(numero) {
    if (!numero || numero === 0) return '';
    
    const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    
    // Se for decimal
    if (numero % 1 !== 0) {
        const parteInteira = Math.floor(numero);
        const centavos = Math.round((numero - parteInteira) * 100);
        
        let extenso = numeroParaExtenso(parteInteira);
        if (parteInteira === 1) {
            extenso += ' real';
        } else if (parteInteira > 1) {
            extenso += ' reais';
        }
        
        if (centavos > 0) {
            extenso += ' e ' + numeroParaExtenso(centavos);
            if (centavos === 1) {
                extenso += ' centavo';
            } else {
                extenso += ' centavos';
            }
        }
        
        return extenso;
    }
    
    // Para inteiros
    let n = parseInt(numero);
    
    if (n === 0) return 'zero';
    if (n === 1) return 'um';
    if (n < 10) return unidades[n];
    if (n >= 10 && n < 20) return especiais[n - 10];
    if (n >= 20 && n < 100) {
        const dez = Math.floor(n / 10);
        const uni = n % 10;
        return uni > 0 ? `${dezenas[dez]} e ${unidades[uni]}` : dezenas[dez];
    }
    if (n >= 100 && n < 1000) {
        const cen = Math.floor(n / 100);
        const resto = n % 100;
        if (n === 100) return 'cem';
        return resto > 0 ? `${centenas[cen]} e ${numeroParaExtenso(resto)}` : centenas[cen];
    }
    if (n >= 1000 && n < 1000000) {
        const mil = Math.floor(n / 1000);
        const resto = n % 1000;
        let extenso = mil === 1 ? 'mil' : `${numeroParaExtenso(mil)} mil`;
        return resto > 0 ? `${extenso} e ${numeroParaExtenso(resto)}` : extenso;
    }
    if (n >= 1000000) {
        const milhao = Math.floor(n / 1000000);
        const resto = n % 1000000;
        let extenso = milhao === 1 ? 'um milhão' : `${numeroParaExtenso(milhao)} milhões`;
        return resto > 0 ? `${extenso} e ${numeroParaExtenso(resto)}` : extenso;
    }
    
    return '';
}

console.log('✅ contract-functions-macdavis.js CARREGADO - Sistema MacDavis');
console.log('✅ Funções disponíveis:', {
    openContractModal: typeof window.openContractModal,
    closeContractModal: typeof window.closeContractModal,
    generateContract: typeof window.generateContract,
    formatCPF: typeof window.formatCPF,
    updateValorExtenso: typeof window.updateValorExtenso
});
