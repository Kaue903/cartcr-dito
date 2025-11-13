/* ============================================================
CÓDIGO JAVASCRIPT - BANCO SENAICRED (COM CARTÃO DE CRÉDITO)
(Correção do Bug de Encerramento)
============================================================ */

// -----------------------------------------------------------------
// 🎨 CRITÉRIO 5: Código bem comentado e estruturado
// -----------------------------------------------------------------

// Variáveis principais
let conta = null; // Objeto da conta (seja bancária ou cartão)
let movimentacoes = []; // Histórico/Fatura

// ===================================
// ELEMENTOS DO DOM (Pop-up Modal)
// ===================================
const modalOverlay = document.getElementById('modalOverlay');
const modalCaixa = document.getElementById('modalCaixa');
const modalTitulo = document.getElementById('modalTitulo');
const modalTexto = document.getElementById('modalTexto');
const modalInput = document.getElementById('modalInput');
const modalBotoes = document.getElementById('modalBotoes');
const modalBtnConfirmar = document.getElementById('modalBtnConfirmar');
const modalBtnCancelar = document.getElementById('modalBtnCancelar');

// Referências aos painéis de operação
const painelBancario = document.getElementById('operacoesBancarias');
const painelCartao = document.getElementById('operacoesCartao');

// Ações do Modal
let acaoConfirmarGlobal = null;
let acaoCancelarGlobal = null;

// ===================================
// FUNÇÕES DO POP-UP (MODAL)
// (Com animação e correção de bug do saque)
// ===================================

function abrirModal(tipo, titulo, texto, acaoConfirmar = null, acaoCancelar = null) {
  modalTitulo.innerText = titulo;
  modalTexto.innerHTML = texto; 
  acaoConfirmarGlobal = acaoConfirmar;
  acaoCancelarGlobal = acaoCancelar;

  modalInput.classList.add('hidden');
  modalInput.value = "";
  modalBtnCancelar.classList.remove('hidden');
  modalBtnConfirmar.classList.remove('btn-perigo');
  modalBtnConfirmar.innerText = "Confirmar";
  modalBtnCancelar.innerText = "Cancelar";

  if (tipo === 'prompt') {
    modalInput.classList.remove('hidden');
    modalInput.placeholder = "Digite o valor aqui...";
  } 
  else if (tipo === 'confirm') {
    modalBtnConfirmar.innerText = "Sim";
    modalBtnCancelar.innerText = "Não";
  }
  else if (tipo === 'alert') {
    modalBtnCancelar.classList.add('hidden');
    modalBtnConfirmar.innerText = "OK";
  }

  if (titulo.includes('Sacar') || titulo.includes('Encerrar') || titulo.includes('Alerta') || titulo.includes('Compra')) {
      modalBtnConfirmar.classList.add('btn-perigo');
  }

  modalOverlay.classList.remove('hidden');
  setTimeout(() => {
    modalOverlay.classList.add('active');
    if (tipo === 'prompt') {
      modalInput.focus();
    }
  }, 10);
}

function fecharModal() {
  modalOverlay.classList.remove('active');
  modalOverlay.addEventListener('transitionend', function handler(e) {
    // Garante que o evento só rode no overlay (e não em filhos)
    if (e.target !== modalOverlay) return; 
    
    modalOverlay.classList.add('hidden');
    modalOverlay.removeEventListener('transitionend', handler);
    acaoConfirmarGlobal = null;
    acaoCancelarGlobal = null;
  });
}

modalBtnCancelar.onclick = () => {
  if (acaoCancelarGlobal) acaoCancelarGlobal();
  fecharModal();
};

modalBtnConfirmar.onclick = () => {
  const valorInput = modalInput.value;
  let naoFechar = false;
  if (acaoConfirmarGlobal) {
    const resultado = acaoConfirmarGlobal(valorInput);
    if (resultado === false) naoFechar = true; // Impede fechar se outro modal for abrir
  }
  if (!naoFechar) fecharModal();
};

modalOverlay.onclick = (e) => {
  if (e.target === modalOverlay) {
    if (acaoCancelarGlobal) acaoCancelarGlobal();
    fecharModal();
  }
};
modalCaixa.onclick = (e) => e.stopPropagation();

// ===================================
// FUNÇÕES AUXILIARES (Banco)
// ===================================

function obterDataHoraAtual() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');
  return `[${data} ${hora}]`;
}

function contaAtiva() {
  if (!conta || !conta.ativa) {
    abrirModal('alert', 'Erro', 'Nenhuma conta ativa! Abra uma nova conta primeiro.');
    return false;
  }
  return true;
}

function registrarMovimentacao(tipo, valor, obs = "") {
  let valorFormatado = "";
  if (tipo === "Abertura" || tipo === "Alerta" || tipo.includes("Cancelada") || tipo === "Vencimento") {
    valorFormatado = "";
  } else {
    valorFormatado = `: R$ ${Number(valor).toFixed(2)}`;
  }
  let mensagem = `${obterDataHoraAtual()} - ${tipo}${valorFormatado}`;
  if (obs) {
    mensagem += ` (${obs})`;
  }
  movimentacoes.push(mensagem);
}

function calcularDiferencaDias(data1, data2) {
  if (!data1) return 0;
  const dataInicio = new Date(data1.getFullYear(), data1.getMonth(), data1.getDate());
  const dataFim = new Date(data2.getFullYear(), data2.getMonth(), data2.getDate());
  const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function limparResultados() {
    document.getElementById("resConta").innerHTML = "";
    document.getElementById("resOperacoes").innerHTML = "";
}

function exibirPainelOperacoes(tipo) {
    painelBancario.classList.add('hidden');
    painelCartao.classList.add('hidden');

    if (tipo === 'bancario') {
        painelBancario.classList.remove('hidden');
    } else if (tipo === 'cartao') {
        painelCartao.classList.remove('hidden');
    }
}

function calcularDataVencimento() {
    const data = new Date();
    data.setDate(data.getDate() + 15); // Vencimento em 15 dias
    return data;
}

// ===================================
// FUNÇÕES PRINCIPAIS (ATUALIZADAS)
// ===================================

function abrirConta() {
  limparResultados();
  const nome = document.getElementById("nome").value.trim();
  const tipo = document.getElementById("tipoConta").value;
  
  if (nome === "") {
    document.getElementById("resConta").innerHTML = 
      `<span class="msg-alerta">Por favor, informe o nome do cliente!</span>`;
    return;
  }
  
  movimentacoes = [];
  let msgSucesso = "";

  if (tipo === "corrente" || tipo === "poupanca") {
    conta = {
      nomeCliente: nome, tipoConta: tipo, saldo: 0, ativa: true,
      dataUltimoDeposito: null
    };
    registrarMovimentacao("Abertura", 0, `Conta ${tipo} aberta para ${nome}`);
    msgSucesso = `✅ Conta <strong>${tipo}</strong> criada com sucesso para <strong>${nome}</strong>.`;
    exibirPainelOperacoes('bancario');
  
  } else if (tipo === "cartao") {
    conta = {
        nomeCliente: nome, tipoConta: 'cartao', limiteTotal: 2000.00,
        saldoDevedor: 0.00, ativa: true, dataVencimento: calcularDataVencimento()
    };
    registrarMovimentacao("Abertura", 0, `Cartão de Crédito aprovado para ${nome}`);
    msgSucesso = `💳 Cartão de Crédito criado com sucesso para <strong>${nome}</strong>!` +
                 `<br>Limite inicial: <strong>R$ 2.000,00</strong>.`;
    exibirPainelOperacoes('cartao');
  }
  
  document.getElementById("resConta").innerHTML = msgSucesso;
  
  document.getElementById("nome").disabled = true;
  document.getElementById("tipoConta").disabled = true;
  document.getElementById("btnAbrir").disabled = true;
}

// --- Funções de Conta Bancária ---

function chamarModalDeposito() {
  if (!contaAtiva()) return;
  limparResultados();
  
  abrirModal(
    'prompt', 'Depositar', 'Digite o valor do depósito:',
    (valorStr) => { 
      const valor = parseFloat(valorStr.replace(",", "."));
      if (isNaN(valor) || valor <= 0) {
        document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Valor inválido!</span>`;
        return;
      }
      conta.saldo += valor;
      if (conta.tipoConta === 'poupanca') {
        conta.dataUltimoDeposito = new Date();
      }
      registrarMovimentacao("Depósito", valor);
      document.getElementById("resOperacoes").innerHTML = `💰 Depósito realizado! Saldo atual: <strong>R$ ${conta.saldo.toFixed(2)}</strong>`;
    }
  );
}

function chamarModalSaque() {
  if (!contaAtiva()) return;
  limparResultados();

  if (conta.tipoConta !== 'poupanca') {
    abrirModalSaqueSimples(false); return;
  }
  
  const hoje = new Date();
  const diasPassados = calcularDiferencaDias(conta.dataUltimoDeposito, hoje);
  
  if (diasPassados >= 30 && conta.saldo > 0) {
    const juros = conta.saldo * 0.005;
    conta.saldo += juros;
    registrarMovimentacao("Juros", juros, `Rendimento de 0.5% (${diasPassados} dias)`);
    abrirModal('alert', 'Parabéns! Juros Aplicados!',
      `<span class="msg-sucesso">Parabéns! ${diasPassados} dias se passaram.</span>` +
      `<span class="msg-sucesso">Você ganhou R$ ${juros.toFixed(2)} de juros.</span>` +
      `Saldo atualizado: <strong>R$ ${conta.saldo.toFixed(2)}</strong><br><br>` +
      `Agora, prossiga para digitar o valor do saque.`,
      () => {
        abrirModalSaqueSimples(true); return false;
      }
    );
  } else {
    let diasRestantes = 30 - diasPassados;
    if (!conta.dataUltimoDeposito) diasRestantes = 30;
    abrirModal('confirm', 'Alerta de Juros',
      `<span class="msg-alerta">⚠️ ALERTA! Faltam ${diasRestantes} dias.</span><br>` +
      "Se continuar, você PERDERÁ o direito aos juros de 0.5%.<br><br>" +
      "Deseja continuar com o saque mesmo assim?",
      () => {
        registrarMovimentacao("Alerta", 0, "Saque antes dos 30 dias. Juros perdidos.");
        abrirModalSaqueSimples(true); return false;
      },
      () => {
        registrarMovimentacao("Saque Cancelada", 0, "Cliente optou por não perder os juros.");
        document.getElementById("resOperacoes").innerHTML = `Operação cancelada. Seu dinheiro continua rendendo!`;
      }
    );
  }
}

function abrirModalSaqueSimples(zerarDataPoupanca) {
  abrirModal('prompt', 'Realizar Saque', 'Digite o valor que deseja sacar:',
    (valorStr) => {
      const valor = parseFloat(valorStr.replace(",", "."));
      if (isNaN(valor) || valor <= 0) {
        document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Valor inválido!</span>`;
        return;
      }
      if (valor > conta.saldo) {
        document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Saldo insuficiente! Saldo atual: R$ ${conta.saldo.toFixed(2)}</span>`;
        return;
      }
      conta.saldo -= valor;
      registrarMovimentacao("Saque", valor * -1);
      if (zerarDataPoupanca) conta.dataUltimoDeposito = null; 
      document.getElementById("resOperacoes").innerHTML = `💸 Saque de R$ ${valor.toFixed(2)} realizado! Saldo atual: <strong>R$ ${conta.saldo.toFixed(2)}</strong>`;
    }
  );
}

// --- Funções de Cartão de Crédito ---

function chamarModalCompra() {
    if (!contaAtiva()) return;
    limparResultados();
    const limiteDisponivel = conta.limiteTotal - conta.saldoDevedor;

    abrirModal(
        'prompt', 'Fazer Compra',
        `Limite Disponível: <strong>R$ ${limiteDisponivel.toFixed(2)}</strong><br>Digite o valor da compra:`,
        (valorStr) => {
            const valor = parseFloat(valorStr.replace(",", "."));
            if (isNaN(valor) || valor <= 0) {
                document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Valor inválido!</span>`;
                return;
            }
            if (valor > limiteDisponivel) {
                document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Limite insuficiente!</span>`;
                return;
            }
            conta.saldoDevedor += valor;
            registrarMovimentacao("Compra", valor);
            const novoLimiteDisp = conta.limiteTotal - conta.saldoDevedor;
            document.getElementById("resOperacoes").innerHTML = 
                `🛒 Compra de R$ ${valor.toFixed(2)} aprovada!` +
                `<br>Novo limite disponível: <strong>R$ ${novoLimiteDisp.toFixed(2)}</strong>`;
        }
    );
}

function chamarModalPagarFatura() {
    if (!contaAtiva()) return;
    limparResultados();

    if (conta.saldoDevedor === 0) {
        abrirModal('alert', 'Pagar Fatura', 'Sua fatura está em dia. Não há nada a pagar.');
        return;
    }

    abrirModal(
        'prompt', 'Pagar Fatura',
        `Saldo Devedor: <strong>R$ ${conta.saldoDevedor.toFixed(2)}</strong><br>Digite o valor do pagamento:`,
        (valorStr) => {
            const valor = parseFloat(valorStr.replace(",", "."));
            if (isNaN(valor) || valor <= 0) {
                document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Valor inválido!</span>`;
                return;
            }
            if (valor > conta.saldoDevedor) {
                // BUG FIX: Vamos permitir pagar a mais? Não.
                // Mas se o valor for 0.00001 a mais (float bug), devemos aceitar?
                // Vamos usar a mesma lógica do round.
                const valorEmCentavos = Math.round(valor * 100);
                const dividaEmCentavos = Math.round(conta.saldoDevedor * 100);

                if (valorEmCentavos > dividaEmCentavos) {
                    document.getElementById("resOperacoes").innerHTML = `<span class="msg-alerta">Valor maior que a dívida!</span>`;
                    return;
                }
            }
            
            conta.saldoDevedor -= valor;
            // Se o saldo devedor ficou muito perto de zero (bug do float), zera ele.
            if (conta.saldoDevedor < 0.001) {
                conta.saldoDevedor = 0;
            }

            registrarMovimentacao("Pagamento", valor * -1);
            const novoLimiteDisp = conta.limiteTotal - conta.saldoDevedor;
            document.getElementById("resOperacoes").innerHTML = 
                `✅ Pagamento de R$ ${valor.toFixed(2)} recebido!` +
                `<br>Saldo devedor atual: <strong>R$ ${conta.saldoDevedor.toFixed(2)}</strong>` +
                `<br>Limite disponível atualizado: <strong>R$ ${novoLimiteDisp.toFixed(2)}</strong>`;
        }
    );
}

function simularVencimento() {
    if (!contaAtiva()) return;
    limparResultados();

    // Arredonda para centavos para checagem
    const saldoEmCentavos = Math.round(conta.saldoDevedor * 100);

    if (saldoEmCentavos === 0) {
        conta.saldoDevedor = 0; // Corrige se for 0.00001
        abrirModal('alert', 'Vencimento da Fatura', 'Sua fatura fechou em dia. Parabéns!');
        return;
    }

    const juros = conta.saldoDevedor * 0.02;
    conta.saldoDevedor += juros;
    conta.dataVencimento.setDate(conta.dataVencimento.getDate() + 30);
    const novaDataVenc = conta.dataVencimento.toLocaleDateString('pt-BR');

    registrarMovimentacao("Juros Rotativos", juros, "2% sobre saldo devedor");

    const msg = `<span class="msg-alerta">⚠️ Vencimento! Pagamento não identificado.</span>` +
                `<br>Juros rotativos de 2% (R$ ${juros.toFixed(2)}) aplicados.` +
                `<br>Novo saldo devedor: <strong>R$ ${conta.saldoDevedor.toFixed(2)}</strong>` +
                `<br>Próximo vencimento: <strong>${novaDataVenc}</strong>`;

    abrirModal('alert', 'Fatura Vencida', msg);
    document.getElementById("resOperacoes").innerHTML = msg;
}

// ===================================
// FUNÇÕES COMUNS (ATUALIZADAS)
// ===================================

function verSaldo() {
  if (!contaAtiva()) return;
  limparResultados();
  let msg = "";

  if (conta.tipoConta === 'corrente' || conta.tipoConta === 'poupanca') {
    msg = `📊 Saldo atual: <strong>R$ ${conta.saldo.toFixed(2)}</strong>`;
    if (conta.tipoConta === 'poupanca' && conta.dataUltimoDeposito) {
      const hoje = new Date();
      const diasPassados = calcularDiferencaDias(conta.dataUltimoDeposito, hoje);
      if (diasPassados < 30) {
        const diasRestantes = 30 - diasPassados;
        msg += `<br><span class="msg-info">💡 Faltam ${diasRestantes} dias para os juros!</span>`;
      } else if (conta.saldo > 0) {
        msg += `<br><span class="msg-sucesso">💡 Você já pode sacar com juros de 0.5%!</span>`;
      }
    } else if (conta.tipoConta === 'poupanca' && !conta.dataUltimoDeposito) {
       msg += `<br><span class="msg-info">💡 Faça um depósito para iniciar o ciclo de juros!</span>`;
    }
  } 
  else if (conta.tipoConta === 'cartao') {
    const limiteDisponivel = conta.limiteTotal - conta.saldoDevedor;
    const dataVenc = conta.dataVencimento.toLocaleDateString('pt-BR');
    msg = `💳 <strong>Extrato do Cartão</strong><br>` +
          `Limite Disponível: <strong>R$ ${limiteDisponivel.toFixed(2)}</strong><br>` +
          `Saldo Devedor (Fatura): <strong>R$ ${conta.saldoDevedor.toFixed(2)}</strong><br>` +
          `Data de Vencimento: <strong>${dataVenc}</strong>`;
  }
  
  abrirModal('alert', 'Consulta de Saldo/Limite', msg);
  document.getElementById("resOperacoes").innerHTML = msg;
}

function listarMovimentos() {
  if (!contaAtiva()) return;
  limparResultados();
  let listaHtml = "";
  if (movimentacoes.length === 0) {
    listaHtml = "Nenhuma movimentação registrada.";
  } else {
    const listaInvertida = [...movimentacoes].reverse();
    const titulo = (conta.tipoConta === 'cartao') ? 'Fatura Recente' : 'Movimentações Recentes';
    listaHtml = `<strong>📜 ${titulo}:</strong><br>${listaInvertida.join("<br>")}`;
  }
  abrirModal('alert', 'Extrato da Conta', listaHtml);
  document.getElementById("resOperacoes").innerHTML = listaHtml;
}

function chamarModalEncerrar() {
  if (!contaAtiva()) return;
  limparResultados();
  
  let msgErro = "";
  if (conta.tipoConta === 'corrente' || conta.tipoConta === 'poupanca') {
      // CORREÇÃO: Usar a mesma lógica de centavos
      const saldoEmCentavos = Math.round(conta.saldo * 100);
      if (saldoEmCentavos !== 0) {
          msgErro = `<span class="msg-alerta">Para encerrar a conta, o saldo deve ser R$ 0,00.</span>` +
                    `<br>Seu saldo atual é: R$ ${conta.saldo.toFixed(2)}`;
      }
  } 
  else if (conta.tipoConta === 'cartao') {
      // ==========================================================
      // CORREÇÃO DO BUG (LÓGICA DE CENTAVOS)
      // ==========================================================
      // Multiplica por 100 para pegar o valor em centavos e arredonda,
      // isso evita bugs de centavos quebrados (ex: 0.000001)
      const saldoEmCentavos = Math.round(conta.saldoDevedor * 100);
      
      // Agora verificamos se os centavos são diferentes de zero
      if (saldoEmCentavos !== 0) {
          msgErro = `<span class="msg-alerta">Para cancelar o cartão, a fatura deve estar paga (Saldo Devedor R$ 0,00).</span>` +
                    `<br>Seu saldo devedor é: R$ ${conta.saldoDevedor.toFixed(2)}`;
      }
      // ==========================================================
  }

  if (msgErro) {
      abrirModal('alert', 'Encerramento Negado', msgErro);
      document.getElementById("resOperacoes").innerHTML = msgErro;
      return;
  }

  const tipoProduto = (conta.tipoConta === 'cartao') ? "cartão" : "conta";
  abrirModal(
    'confirm',
    `Encerrar ${tipoProduto}`,
    `Tem certeza que deseja encerrar/cancelar este ${tipoProduto}? Esta ação é irreversível.`,
    () => { // Ação "Sim"
      conta.ativa = false;
      document.getElementById("resOperacoes").innerHTML =
        `⚠️ ${tipoProduto} de <strong>${conta.nomeCliente}</strong> encerrado com sucesso!`;
      
      document.getElementById("nome").value = "";
      document.getElementById("tipoConta").value = "corrente";
      document.getElementById("nome").disabled = false;
      document.getElementById("tipoConta").disabled = false;
      document.getElementById("btnAbrir").disabled = false;
      exibirPainelOperacoes('nenhum');
      
      conta = null;
      movimentacoes = [];
      document.getElementById("resConta").innerHTML = "";
    },
    () => { // Ação "Não"
       document.getElementById("resOperacoes").innerHTML = `Operação de encerramento cancelada.`;
    }
  );
}

// ===================================
// INICIALIZAÇÃO DO SISTEMA
// ===================================
function atualizarDataHora() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');
  const el = document.getElementById('dataHora');
  if (el) {
    el.textContent = `${data} - ${hora}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
    exibirPainelOperacoes('nenhum');
    atualizarDataHora();
    setInterval(atualizarDataHora, 1000);
});