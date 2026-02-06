const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * GERADOR DE CONTRATO - MODELO EXATO DA MACDAVIS MOTOS
 * Texto fornecido pelo usuário - CÓPIA FIEL DO DOCUMENTO ORIGINAL
 */

class ContractGenerator {
    constructor() {
        this.contractsPath = path.join(__dirname, 'DOCS Motos', 'Contratos');
        this.ensureContractsFolder();
    }

    ensureContractsFolder() {
        if (!fs.existsSync(this.contractsPath)) {
            fs.mkdirSync(this.contractsPath, { recursive: true });
        }
    }

    async generateContract(data) {
        return new Promise((resolve, reject) => {
            try {
                this.validateData(data);

                // Adicionar timestamp para garantir nome único e evitar cache
                const timestamp = new Date().getTime();
                // Sanitize ano to avoid illegal chars (slashes) in filenames
                const safeAno = String(data.motorcycle.ano || data.motorcycle.year || '').replace(/[\/\\]/g, '-');
                const safeMarca = String(data.motorcycle.marca || '').replace(/[\/\\\s]/g, '_');
                const safeModelo = String(data.motorcycle.modelo || data.motorcycle.name || '').replace(/[\/\\\s]/g, '_');
                const safeBuyer = String(data.buyer.nome || '').replace(/\s+/g, '_');
                let fileName = `Contrato_${safeMarca}_${safeModelo}_${safeAno}_${safeBuyer}_${timestamp}.pdf`;
                // Extra sanitization: remove any remaining illegal filename chars
                fileName = String(fileName).replace(/[<>:"|?*]/g, '').replace(/[\/\\]+/g, '-').trim();
                const filePath = path.join(this.contractsPath, fileName);

                // Garantir que a pasta destino exista (prevenir ENOENT se houver subpastas acidentais)
                const outDir = path.dirname(filePath);
                if (!fs.existsSync(outDir)) {
                    fs.mkdirSync(outDir, { recursive: true });
                }

                const doc = new PDFDocument({ 
                    size: 'A4',
                    margins: { top: 50, bottom: 50, left: 72, right: 72 }
                });
                
                // Configurar espaçamento de linha padrão (1.5)
                doc.lineGap(6); // Espaçamento adicional entre linhas para simular 1.5

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                this.buildContract(doc, data);

                doc.end();

                stream.on('finish', () => {
                    console.log(`✅ Contrato gerado: ${fileName}`);
                    resolve(filePath);
                });

                stream.on('error', (err) => {
                    console.error('❌ Erro ao salvar contrato:', err);
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    validateData(data) {
        const required = ['seller', 'buyer', 'motorcycle', 'payment'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }
    }

    buildContract(doc, data) {
        const fontSize = 12; // Tamanho 12
        
        // Registrar fonte Arial
        doc.registerFont('Arial', 'C:\\Windows\\Fonts\\arial.ttf');
        doc.registerFont('Arial-Bold', 'C:\\Windows\\Fonts\\arialbd.ttf');
        
        // Configurar espaçamento de linha 1.5
        doc.lineGap(6);

        // CABEÇALHO COM CAIXA/BOX CENTRALIZADO
        const pageWidth = doc.page.width;
        const boxWidth = 340;
        const boxHeight = 85;
        const boxX = (pageWidth - boxWidth) / 2;
        const boxY = 50;

        // Desenhar retângulo (caixa)
        doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

        // LOGO MacDavis
        const logoPath = path.join(__dirname, 'PNG MD.png');
        if (fs.existsSync(logoPath)) {
            const logoSize = 40;
            const logoX = boxX + 15;
            const logoY = boxY + (boxHeight - logoSize) / 2;
            doc.image(logoPath, logoX, logoY, { width: logoSize, height: logoSize });
        }

        // Texto centralizado dentro da caixa (à direita da logo)
        const textX = boxX + 70;
        const textWidth = boxWidth - 85;
        
        doc.fontSize(10).font('Arial-Bold').text('Compra, venda, troca e Financiamento', textX, boxY + 12, { width: textWidth, align: 'center' });
        doc.fontSize(9).font('Arial').text('62.657.646 VICTOR ANTONIO BORTOLETE DE ABREU', textX, doc.y + 3, { width: textWidth, align: 'center' });
        doc.text('CNPJ-62.657.646/0001-01        44 - 99925-1012', textX, doc.y + 2, { width: textWidth, align: 'center' });
        doc.text('Av. América, 1461 - Cianorte, PR', textX, doc.y + 2, { width: textWidth, align: 'center' });
        
        // RESETAR POSIÇÃO PARA MARGENS PADRÃO
        doc.x = 72; // Margem esquerda padrão
        doc.y = boxY + boxHeight + 20;

        // TÍTULO
        doc.fontSize(12).font('Arial-Bold').text('CONTRATO DE COMPRA E VENDA DE MOTOCICLETA', 72, doc.y, { align: 'center' });
        doc.moveDown(1);

        // PARTES - SEM opções de alinhamento, usar posição padrão
        doc.x = 72;
        doc.fontSize(fontSize).font('Arial-Bold').text('Partes:');
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('Vendedor: ', { continued: true })
           .font('Arial').text('62.657.646 VICTOR ANTONIO BORTOLETE DE ABREU; CNPJ: 62.657.646/0001-01; Endereço: Avenida América, N° 1461, Cianorte-PR');
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('Comprador: ', { continued: true })
           .font('Arial').text(`${data.buyer.nome.toUpperCase()}, CPF nº ${data.buyer.cpf}, RG nº ${data.buyer.rg}, residente e domiciliado na ${data.buyer.endereco}`);
        doc.moveDown(0.5);

        // OBJETO
        doc.font('Arial-Bold').text('Objeto do Contrato: ', { continued: true })
           .font('Arial').text('O presente contrato tem por objeto a compra, venda ou troca/permuta da motocicleta descrita abaixo:');
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text('Veículo de saída');
        doc.moveDown(0.3);
        doc.font('Arial').list([
            `Marca: ${data.motorcycle.marca}`,
            `Modelo: ${data.motorcycle.modelo}`,
            // Mostrar o valor combinado de Ano/Modelo (ex: "2015/2016") se existir
            `Ano: ${data.motorcycle.ano || data.motorcycle.year || 'N/A'}`,
            `Chassi: ${data.motorcycle.chassi || 'N/A'}`,
            `Renavam: ${data.motorcycle.renavam || 'N/A'}`,
            `Placa: ${data.motorcycle.placa || 'N/A'}`,
            `Cor: ${data.motorcycle.cor}`,
            `Quilometragem: ${data.motorcycle.quilometragem || data.motorcycle.km || 'N/A'}`,
            `Estado de Conservação: ${data.motorcycle.estado || 'BOM'}`
        ]);
        doc.moveDown(1.5);

        // CLÁUSULA 01
        this.addClausula01(doc, data);

        // Cláusula 02 - continua na mesma página
        this.addClausula02(doc);

        // Cláusulas 03 e 04 - continua na mesma página
        this.addClausulas0304(doc);

        // Cláusulas 05, 06 e 07 - continua na mesma página
        this.addClausulas050607(doc, data);
    }

    addClausula01(doc, data) {
        const f = 12;
        doc.fontSize(f).font('Arial-Bold').text('Cláusula 01 - Preço e Forma de Pagamento');
        doc.moveDown(0.5);
        doc.font('Arial-Bold').text('1.1. Do Preço Total da Motocicleta (Venda)');
        doc.moveDown(0.3);
        doc.font('Arial').text(`O valor total de venda da motocicleta, objeto deste Contrato, é de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}).`, { align: 'justify' });
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text('1.2. Da Forma de Liquidação');
        doc.moveDown(0.3);
        
        // Determinar texto de acordo com a forma de pagamento
        const temDinheiro = data.payment.dinheiro > 0;
        const temCartao = data.payment.cartao > 0;
        const temFinanciado = data.payment.financiado > 0;

        // Construir frase de forma de pagamento dinamicamente
        const partes = [];
        if (temDinheiro) partes.push(`dinheiro (R$ ${this.formatMoney(data.payment.dinheiro)})`);
        if (temCartao) partes.push(`cartão (R$ ${this.formatMoney(data.payment.cartao)})`);
        if (temFinanciado) partes.push(`financiamento (R$ ${this.formatMoney(data.payment.financiado)})`);

        let textoFormaPagamento = '';
        if (partes.length > 1) {
            textoFormaPagamento = `O COMPRADOR quitará o valor total de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}) por meio de uma combinação de pagamentos: ${partes.join(' + ')}.`;
        } else if (partes.length === 1) {
            textoFormaPagamento = `O COMPRADOR quitará o valor total de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}) por meio de ${partes[0]}.`;
        }
        
        doc.font('Arial').text(textoFormaPagamento, { align: 'justify' });
        doc.moveDown(0.5);

        if (data.payment.dinheiro > 0) {
            doc.font('Arial-Bold').text('a)  Pagamento em Moeda Corrente Nacional:');
            doc.moveDown(0.2);
            doc.font('Arial').text(`O COMPRADOR paga, neste ato, em dinheiro, o valor de R$ ${this.formatMoney(data.payment.dinheiro)} (${data.payment.dinheiroExtenso}).`, { align: 'justify' });
            doc.moveDown(0.5);
        }

        if (data.payment.cartao > 0) {
            doc.font('Arial-Bold').text('b) Pagamento via Cartão de Crédito (Parcelado):');
            doc.moveDown(0.2);
            doc.font('Arial').text(`O valor remanescente de R$ ${this.formatMoney(data.payment.cartao)} (${data.payment.cartaoExtenso}) é pago por meio de Cartão de Crédito, parcelado em ${data.payment.parcelas} (${data.payment.parcelasExtenso}) vezes, sendo que:`, { align: 'justify' });
            doc.moveDown(0.3);
            doc.text(`• I. O valor total de R$ ${this.formatMoney(data.payment.cartao)} (${data.payment.cartaoExtenso}) é considerado quitado à vista perante o VENDEDOR no ato da aprovação da transação pela operadora do cartão.`, { align: 'justify' });
            doc.moveDown(0.2);
            doc.text('• II. Quaisquer juros, taxas ou encargos de parcelamento cobrados pela operadora do cartão serão de responsabilidade exclusiva do COMPRADOR.', { align: 'justify' });
            doc.moveDown(0.5);
        }

        if (data.payment.financiado > 0) {
            doc.font('Arial-Bold').text('c) Financiamento:');
            doc.moveDown(0.2);
            doc.font('Arial').text(`O valor de R$ ${this.formatMoney(data.payment.financiado)} (${data.payment.financiadoExtenso}) será pago mediante financiamento aprovado pela instituição financeira escolhida pelo COMPRADOR, sujeita à análise de crédito. A liberação dos recursos e/ou assinatura do contrato de financiamento será condição para a quitação parcial/total, conforme o caso.`, { align: 'justify' });
            doc.moveDown(0.5);
        }

        doc.font('Arial-Bold').text('1.3. Da Quitação');
        doc.moveDown(0.3);
        
        // Ajustar texto de quitação de acordo com forma de pagamento
        let textoQuitacao = '';
        // Construir texto de quitação conforme componentes de pagamento
        if (temFinanciado && (temDinheiro || temCartao)) {
            textoQuitacao = `Com o recebimento do(s) valor(es) discriminado(s) nas alíneas correspondentes e com a liberação/aprovação do financiamento (quando aplicável), o VENDEDOR declara integralmente quitado o valor total de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}), dando plena, geral e irrevogável quitação do Preço.`;
        } else if (temDinheiro && temCartao) {
            textoQuitacao = `Com o recebimento do valor em dinheiro (item a) e a aprovação do pagamento no cartão de crédito (item b), o VENDEDOR declara integralmente quitado o valor total de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}), dando plena, geral e irrevogável quitação do Preço.`;
        } else if (temDinheiro) {
            textoQuitacao = `Com o recebimento do valor em dinheiro, o VENDEDOR declara integralmente quitado o valor total de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}), dando plena, geral e irrevogável quitação do Preço.`;
        } else if (temCartao) {
            textoQuitacao = `Com a aprovação do pagamento no cartão de crédito, o VENDEDOR declara integralmente quitado o valor total de R$ ${this.formatMoney(data.payment.valorTotal)} (${data.payment.valorTotalExtenso}), dando plena, geral e irrevogável quitação do Preço.`;
        } else if (temFinanciado) {
            textoQuitacao = `Com a aprovação e liberação do financiamento pela instituição financeira, o VENDEDOR declara a quitação parcial/total do valor, na forma discriminada neste contrato, ficando condicionado à efetiva liberação dos recursos.`;
        }
        
        doc.font('Arial').text(textoQuitacao, { align: 'justify' });
    }

    addClausula02(doc) {
        const f = 12;
        doc.fontSize(f).font('Arial-Bold').text('Cláusula 02 - Direitos e obrigações do Comprador:');
        doc.moveDown(0.5);
        doc.text('2.1. Direitos');
        doc.moveDown(0.3);
        doc.font('Arial').text('2.1.1. O comprador tem o direito de inspecionar a motocicleta antes da compra para verificar seu estado e funcionamento.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.text('2.1.2. O comprador tem direito de solicitar a documentação completa da motocicleta, incluindo o Certificado de Registro de Veículo (CRV) e outros documentos relevantes.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.text('2.1.3. O comprador tem o direito de solicitar a revisão e preparação da motocicleta antes da entrega final.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.text('2.1.4. O comprador tem o direito de solicitar a entrega da motocicleta em condições adequadas e seguras.', { align: 'justify' });
        doc.moveDown(0.7);

        doc.font('Arial-Bold').text('2.2. Obrigações');
        doc.moveDown(0.3);
        doc.font('Arial').text('O COMPRADOR assume, a partir da data de assinatura deste instrumento e recebimento da motocicleta, as seguintes obrigações e responsabilidades, sem prejuízo de outras estabelecidas em lei:', { align: 'justify' });
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text('2.2.1 Responsabilidade Financeira:');
        doc.moveDown(0.3);
        doc.text('a) Pagamento Pontual: ', { continued: true }).font('Arial').text('Efetuar o pagamento de todas as parcelas devidas, referentes ao Preço Total rigorosamente dentro dos prazos e condições estipulados na Cláusula do Preço e Pagamento, sujeitando-se às penalidades por atraso previstas neste Contrato.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('b) Encargos e Despesas: ', { continued: true }).font('Arial').text('Arcar integralmente com todas as taxas, impostos, licenciamentos, multas de trânsito e demais encargos incidentes sobre o veículo a partir da data de sua entrega, inclusive IPVA, licenciamento veicular e taxas de transferência.', { align: 'justify' });
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text('2.2.2 Responsabilidade pela Conservação e Uso:');
        doc.moveDown(0.3);
        doc.text('a) Vistoria e Aceitação: ', { continued: true }).font('Arial').text('Declarar que vistoriou a motocicleta no ato da entrega e a recebeu em perfeitas condições de uso, responsabilizando-se integralmente pela sua conservação.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('b) Manutenções Básicas: ', { continued: true }).font('Arial').text('Realizar, sob sua inteira responsabilidade e ônus, todas as manutenções preventivas e periódicas da motocicleta, tais como troca de óleo, calibragem de pneus, ajustes de freios e demais verificações essenciais, conforme especificações do fabricante.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.text('O comprador se compromete a manter a motocicleta em boas condições, realizando manutenções regulares conforme especificado pelo comprador e levando a motocicleta para realizar a primeira troca de óleo na oficina LOBOS MOTOPEÇAS (Avenida Maranhão, N2429) cumprindo a data ou km prescritos.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('Obs.: ', { continued: true }).font('Arial').text('O comprador e obrigado a realizar a troca de óleo na oficina especificada caso o prazo prescrito vença dentro do período de garantia (90 dias).');
        doc.moveDown(0.2);
        doc.text('Especificação da troca de óleo: 6800 km');
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text('Manutenções Básicas de uma motocicleta');
        doc.moveDown(0.3);
        doc.font('Arial').list([
            'Pneus: Verifique e ajuste a pressão semanalmente.',
            'Óleo do Motor: O óleo da motocicleta deve ser trocado a cada 1.000km.',
            'Freios: Inspecione discos e pastilhas, substituindo quando necessário.',
            'Bateria: Verifique conexões e limpe a corrosão.',
            'Filtros: Troque o filtro de ar e limpe o de combustível quando necessário.',
            'Luzes: Verifique e substitua lâmpadas queimadas.'
        ]);
        doc.moveDown(0.5);

        doc.font('Arial-Bold').text('c) Uso Legal e Adequado: ', { continued: true }).font('Arial').text('Utilizar a motocicleta estritamente em conformidade com as leis de trânsito vigentes (CTB), e abster-se de utilizá-la em competições, manobras perigosas ou em desacordo com as instruções de uso e segurança.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('d) Seguro: ', { continued: true }).font('Arial').text('O comprador será responsável por qualquer seguro necessário durante o período de transição.');
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('e) Transferência de Posse: ', { continued: true }).font('Arial').text('A posse direta da motocicleta é transferida ao COMPRADOR na data de assinatura deste Contrato. Contudo, a propriedade (domínio) do bem permanece com o VENDEDOR até a quitação integral do Preço Total a Prazo, conforme a modalidade de Compra e Venda com Reserva de Domínio.', { align: 'justify' });
        doc.moveDown(0.7);

        doc.font('Arial-Bold').text('2.2.3. DA ENTREGA, TRANSFERÊNCIA E CUSTOS');
        doc.moveDown(0.3);
        doc.text('Condição da Entrega: ', { continued: true }).font('Arial').text('A entrega e liberação da motocicleta para o COMPRADOR estão estritamente condicionadas à prévia conclusão e comprovação de todos os trâmites de transferência de propriedade e do registro da Reserva de Domínio em favor do VENDEDOR. A motocicleta não será liberada da loja antes do cumprimento integral desta condição.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('a) Responsabilidade pelos Custos: ', { continued: true }).font('Arial').text('Todas as taxas, impostos, emolumentos e despesas inerentes ao processo de transferência, incluindo vistoria e registro da Reserva de Domínio, são de responsabilidade única e exclusiva do COMPRADOR.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('b) Opções de Pagamento dos Custos de Transferência: ', { continued: true }).font('Arial').text('Para viabilizar a conclusão do processo antes da entrega, o COMPRADOR deverá optar por uma das seguintes formas de custeio:', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('I. Prazo Legal para Transferência: ', { continued: true }).font('Arial').text('Fica convencionado que, tendo o COMPRADOR optado pelo pagamento integral do Preço Total do bem à vista, este assume a exclusiva obrigação de providenciar a transferência de propriedade da motocicleta para o seu nome junto ao DETRAN/PR (Departamento Estadual de Trânsito do Paraná) no prazo legal de 60 (sessenta) dias, contados a partir da data de comunicação da venda.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('II. Responsabilidade e Encargos: ', { continued: true }).font('Arial').text('O COMPRADOR é o único e exclusivo responsável por cumprir o referido prazo legal. Caso a transferência não seja concluída dentro dos 60 (sessenta) dias estabelecidos, o COMPRADOR assumirá integralmente quaisquer multas, penalidades, encargos, impostos ou pontuações na CNH (Carteira Nacional de Habilitação) que venham a ser impostos pelas autoridades de trânsito em decorrência do atraso na regularização.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('III. Obrigações do Vendedor: ', { continued: true }).font('Arial').text('O VENDEDOR se compromete apenas a fornecer, no ato da venda, toda a documentação necessária e devidamente assinada para que o COMPRADOR possa efetuar o trâmite de transferência.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.font('Arial-Bold').text('c) Recusa de Entrega: ', { continued: true }).font('Arial').text('O VENDEDOR reserva-se o direito de recusar a entrega da motocicleta caso o COMPRADOR não cumpra as exigências documentais necessárias para a transferência.', { align: 'justify' });
        doc.moveDown(0.2);
        doc.text('• I. Efetuar a transferência de registro de propriedade do veículo junto ao DETRAN para o seu nome;', { align: 'justify' });
        doc.moveDown(0.5);
        doc.font('Arial-Bold').text('3.2.4. Proibições (Caso o Contrato seja de Compra e Venda com Reserva de Domínio):');
        doc.moveDown(0.3);
        doc.text('a) Não Alienação: ', { continued: true }).font('Arial').text('Enquanto o preço total não estiver integralmente quitado, o COMPRADOR fica impedido de vender, permutar, doar, alugar ou dar a motocicleta em garantia (alienação) a terceiros, sem a prévia e expressa autorização do VENDEDOR.', { align: 'justify' });
    }

    addClausulas0304(doc) {
        const f = 12;
        doc.fontSize(f).font('Arial-Bold').text('Cláusula 03- Obrigações do Vendedor:');
        doc.moveDown(0.5);
        doc.font('Arial').text('3.1. O vendedor se compromete a entregar a motocicleta em boas condições de uso, conforme descrito no contrato.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.text('3.2.O vendedor se compromete a fornecer todas as documentações necessárias e em dia.', { align: 'justify' });
        doc.moveDown(0.3);
        doc.text('3.3.O vendedor se compromete a entregar a motocicleta com o óleo trocado.', { align: 'justify' });
        doc.moveDown(1);

        doc.font('Arial-Bold').text('Cláusula 04 - Garantia');
        doc.moveDown(0.5);
        doc.font('Arial').text('O vendedor garante as conformidades da motocicleta com as especificações descritas no contrato, e uma garantia de Noventa dias, válida para cambio e motor da motocicleta, contados a partir da data de entrega do veículo, desde que utilizado de acordo com as boas práticas de uso e com a troca de óleo na data prescrita. Qualquer alteração no produto (motocicleta) invalidará a garantia, assim como a falta de manutenção básica na data e quilometragem especificadas pelo vendedor e qualquer queda registrada no veículo.', { align: 'justify' });
        doc.moveDown(0.5);
        doc.font('Arial-Bold').text('Adendo: ', { continued: true }).font('Arial').text('A mesma garantia se aplica ao comprador em caso de permuta de veículos/motocicletas');
    }

    addClausulas050607(doc, data) {
        const f = 12;
        doc.fontSize(f).font('Arial-Bold').text('Cláusula 05 - Rescisão:');
        doc.moveDown(0.5);
        doc.text('CLÁUSULA 06 – DA IRRETRATABILIDADE, RESCISÃO E CLÁUSULA PENAL');
        doc.moveDown(0.5);
        doc.font('Arial').text('5.1. Irretratabilidade: O presente Contrato de Compra e Venda é celebrado em caráter irrevogável e irretratável, obrigando as Partes, seus herdeiros e sucessores, não sendo admitida a desistência unilateral ou arrependimento do negócio por qualquer motivo, uma vez que a motocicleta foi vendida e inspecionada no estabelecimento comercial do VENDEDOR.', { align: 'justify' });
        doc.moveDown(0.5);
        doc.text('5.2. Exceção Legal (Direito de Arrependimento): Fica ressalvado o direito de arrependimento (desistência) de 7 (sete) dias do COMPRADOR apenas e tão somente se a contratação tiver ocorrido fora do estabelecimento comercial do VENDEDOR (venda online ou a distância), conforme previsto no Art. 49 do Código de Defesa do Consumidor, caso em que não incidirá a multa contratual.', { align: 'justify' });
        doc.moveDown(0.7);

        doc.font('Arial-Bold').text('Cláusula 06');
        doc.moveDown(0.5);
        doc.text('Clausula Penal (Multa por Quebra de Contrato): ', { continued: true }).font('Arial').text('Qualquer notificação de rescisão ou desistência que não se enquadre na exceção legal do item 6.2 da clausula 06 será considerada quebra de contrato e inadimplemento contratual pela parte notificante.', { align: 'justify' });
        doc.moveDown(0.5);
        doc.text('6.1. A parte que der causa à rescisão ou descumprimento de qualquer obrigação contratual (inadimplente) incorrerá em uma Cláusula Penal (multa) no montante de 20% (vinte por cento) sobre o valor total da compra da motocicleta, a ser paga à parte inocente.', { align: 'justify' });
        doc.moveDown(0.5);
        doc.text('6.2.  A Parte Inadimplente deverá efetuar o pagamento da Cláusula Penal no prazo de 7 (sete) dias a contar da notificação formal de rescisão.', { align: 'justify' });
        doc.moveDown(0.5);
        doc.font('Arial-Bold').text('Seguro: ', { continued: true }).font('Arial').text('O comprador será responsável por qualquer seguro necessário durante o período de transição.');
        doc.moveDown(1);

        doc.font('Arial-Bold').text('Cláusula 07');
        doc.moveDown(0.5);
        doc.text('Resolução de Controvérsias: ', { continued: true }).font('Arial').text('Qualquer controvérsia decorrente deste contrato será resolvida por meio de mediação e, se necessário por meio de ação judicial, conforme a legislação prevista.', { align: 'justify' });
        doc.moveDown(1.5);

        // Usar data fornecida ou data atual como fallback
        let dateStr;
        if (data.saleDate) {
            // Converter data do formato YYYY-MM-DD para DD/MM/YYYY
            const [year, month, day] = data.saleDate.split('-');
            dateStr = `${day}/${month}/${year}`;
        } else {
            const today = new Date();
            dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        }
        
        // NOVA PÁGINA para data e assinaturas
        doc.addPage();
        
        doc.font('Arial-Bold').text(`Data: ${dateStr}`);
        doc.moveDown(2);

        doc.text('Assinaturas:');
        doc.moveDown(2);

        doc.font('Arial').text('____________________________________________');
        doc.moveDown(0.2);
        doc.text('62.657.646 VICTOR ANTONIO BORTOLETE DE ABREU');
        doc.moveDown(2);

        doc.text('____________________________________________');
        doc.moveDown(0.2);
        doc.text(`${data.buyer.nome.toUpperCase()}, CPF nº ${data.buyer.cpf}`);
    }

    formatMoney(value) {
        return parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // ============================================
    // CONTRATO ESPECÍFICO PARA MOTOS MOTTU
    // ============================================
    
    async generateMottuContract(data) {
        return new Promise((resolve, reject) => {
            try {
                // Validação simplificada para contrato MOTTU
                if (!data.buyer || !data.buyer.nome || !data.buyer.cpf) {
                    throw new Error('Dados do cliente incompletos (nome e CPF obrigatórios)');
                }
                if (!data.motorcycle || !data.motorcycle.placa) {
                    throw new Error('Placa da motocicleta obrigatória');
                }

                let fileName = `Contrato_Mottu_Retirada_${String(data.motorcycle.placa || '').replace(/[^a-zA-Z0-9]/g, '_')}_${String(data.buyer.nome || '').replace(/\s+/g, '_')}.pdf`;
                fileName = fileName.replace(/[<>:\"|?*]/g, '').replace(/[\/\\]+/g, '-').trim();
                const filePath = path.join(this.contractsPath, fileName);
                const outDir = path.dirname(filePath);
                if (!fs.existsSync(outDir)) {
                    fs.mkdirSync(outDir, { recursive: true });
                }

                const doc = new PDFDocument({ 
                    size: 'A4',
                    margins: { top: 72, bottom: 72, left: 72, right: 72 }
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                this.buildMottuContract(doc, data);

                doc.end();

                stream.on('finish', () => {
                    console.log(`✅ Contrato MOTTU gerado: ${fileName}`);
                    resolve(filePath);
                });

                stream.on('error', (err) => {
                    console.error('❌ Erro ao salvar contrato MOTTU:', err);
                    reject(err);
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    buildMottuContract(doc, data) {
        const logoPath = path.join(__dirname, 'PNG MD.png');
        
        // Cabeçalho simples com logo e informações básicas
        if (fs.existsSync(logoPath)) {
            const boxWidth = 340;
            const boxHeight = 85;
            const boxX = (doc.page.width - boxWidth) / 2;
            const boxY = 50;
            
            doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();
            
            const logoSize = 40;
            const logoX = boxX + 10;
            const logoY = boxY + (boxHeight - logoSize) / 2;
            
            doc.image(logoPath, logoX, logoY, { width: logoSize, height: logoSize });
            
            doc.font('Arial-Bold')
               .fontSize(12)
               .text('MacDavis Motos', logoX + logoSize + 10, logoY + 5, { width: boxWidth - logoSize - 30 });
            
            doc.font('Arial')
               .fontSize(10)
               .text('Av. América, 1461 - Cianorte/PR', logoX + logoSize + 10, logoY + 25, { width: boxWidth - logoSize - 30 });
            
            doc.moveDown(3);
        }

        // Resetar alinhamento para esquerda
        doc.x = 72;
        
        // Título
        doc.font('Arial-Bold').fontSize(14).text('CONTRATO DE RETIRADA DE MOTOCICLETAS', { align: 'center' });
        doc.moveDown(2);

        // PARTES
        doc.font('Arial-Bold').fontSize(11).text('PARTES: ', { continued: true });
        doc.font('Arial').fontSize(11).text(
            `Este contrato é firmado entre a empresa MacDavis Motos, inscrita no CNPJ 27.414.171/0001-13, com sede no endereço Avenida América, N° 1461, Cianorte-PR, doravante denominada "LOJA", e o cliente ${data.buyer.nome}, inscrito no CPF/CNPJ N° ${data.buyer.cpf}, doravante denominado "CLIENTE".`,
            { align: 'justify' }
        );
        doc.moveDown(1.5);

        // OBJETO
        doc.font('Arial-Bold').fontSize(11).text('OBJETO: ', { continued: true });
        doc.font('Arial').fontSize(11).text(
            'A LOJA se responsabiliza apenas pela retirada das motocicletas da marca Mottu, sem qualquer vínculo quanto à garantia, manutenção ou suporte técnico relacionado às referidas motocicletas.',
            { align: 'justify' }
        );
        doc.moveDown(2);

        // CLÁUSULAS
        doc.font('Arial-Bold').fontSize(11).text('CLÁUSULAS:');
        doc.moveDown(0.5);

        const clausulas = [
            'A LOJA atua exclusivamente como representante da retirada das motocicletas e não presta qualquer serviço de manutenção ou assistência técnica.',
            'O CLIENTE declara estar ciente de que eventuais problemas mecânicos, elétricos ou estruturais das motocicletas não são de responsabilidade da LOJA.',
            'Após a retirada, qualquer questão referente à motocicleta deverá ser resolvida diretamente com a fabricante ou fornecedor.',
            'Este contrato entra em vigor na data da assinatura e não prevê quaisquer obrigações adicionais entre as partes.'
        ];

        clausulas.forEach((clausula, index) => {
            doc.font('Arial').fontSize(11).text(`${index + 1}. ${clausula}`, { align: 'justify' });
            doc.moveDown(0.8);
        });

        doc.moveDown(1);

        // DISPOSIÇÕES FINAIS
        doc.font('Arial-Bold').fontSize(11).text('DISPOSIÇÕES FINAIS: ', { continued: true });
        doc.font('Arial').fontSize(11).text(
            'O CLIENTE, ao assinar este contrato, declara que compreende e concorda integralmente com as cláusulas acima descritas.',
            { align: 'justify' }
        );
        doc.moveDown(2);

        // Placa e Data
        const placa = data.motorcycle.placa || 'N/A';
        // Usar data fornecida ou data atual como fallback
        let dataAtual;
        if (data.saleDate) {
            // Extrair apenas YYYY-MM-DD se vier no formato ISO
            let saleDate = data.saleDate;
            if (saleDate.includes('T')) {
                saleDate = saleDate.split('T')[0];
            }
            const [year, month, day] = saleDate.split('-');
            dataAtual = `${day}/${month}/${year}`;
            console.log('📅 [CONTRATO] Data da venda:', saleDate, '→', dataAtual);
        } else {
            dataAtual = new Date().toLocaleDateString('pt-BR');
            console.log('⚠️ [CONTRATO] Sem saleDate, usando data atual:', dataAtual);
        }
        
        doc.font('Arial-Bold').fontSize(11).text(`Placa: ${placa}`);
        doc.font('Arial-Bold').fontSize(11).text(`Data: ${dataAtual}`);
        doc.moveDown(3);

        // Assinaturas
        doc.font('Arial').fontSize(11);
        doc.text('_____________________________________');
        doc.moveDown(0.3);
        doc.text(`${data.buyer.nome} - CPF/CNPJ N° ${data.buyer.cpf}`);
        doc.moveDown(2);

        doc.text('______________________________________');
        doc.moveDown(0.3);
        doc.text('MacDavis Motos - CNPJ 27.414.171/0001-13');
    }
}

module.exports = new ContractGenerator();

