/* ============================================================
CÓDIGO JAVASCRIPT - BANCO SENAICRED (COM LÓGICA DE JUROS + POP-UPS ANIMADOS)
============================================================ */

// -----------------------------------------------------------------
// 🎨 CRITÉRIO 5: Código bem comentado e estruturado
// -----------------------------------------------------------------

// Variáveis principais
let conta = null;
let movimentacoes = [];

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

// Variáveis globais para guardar as ações do modal
let acaoConfirmarGlobal = null;
let acaoCancelarGlobal = null;

// ===================================
// FUNÇÕES DO POP-UP (MODAL)
// ===================================

/**
 * Abre o Pop-up (Modal) com configurações e animação
 * @param {string} tipo - 'prompt', 'confirm', 'alert'
 * @param {string} titulo - O título da caixa
 * @param {string} texto - A mensagem de instrução
 * @param {function} [acaoConfirmar=null] - Ação do botão "Confirmar"
 * @param {function} [acaoCancelar=null] - Ação do botão "Cancelar"
 */
function abrirModal(tipo, titulo, texto, acaoConfirmar = null, acaoCancelar = null) {
  modalTitulo.innerText = titulo;
  modalTexto.innerHTML = texto; 

  acaoConfirmarGlobal = acaoConfirmar;
  acaoCancelarGlobal = acaoCancelar;

  // Reseta o estado do modal
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

  if (titulo.includes('Sacar') || titulo.includes('Encerrar') || titulo.includes('Alerta')) {
      modalBtnConfirmar.classList.add('btn-perigo');
  }

  // MOSTRA O MODAL (Inicia a Animação)
  modalOverlay.classList.remove('hidden');
  setTimeout(() => { // Permite que o display mude antes da animação
    modalOverlay.classList.add('active');
    if (tipo === 'prompt') {
      modalInput.focus();
    }
  }, 10);
}

/**
 * Fecha o Pop-up (Modal) com animação
 */
function fecharModal() {
  // Inicia a animação de saída (fade-out)
  modalOverlay.classList.remove('active');
  
  // Adiciona um listener para esperar a animação terminar
  modalOverlay.addEventListener('transitionend', function handler() {
    // Esconde o modal APÓS a animação
    modalOverlay.classList.add('hidden');
    // Remove o listener para não acumular
    modalOverlay.removeEventListener('transitionend', handler);
    
    // Limpa as ações globais
    acaoConfirmarGlobal = null;
    acaoCancelarGlobal = null;
  });
}

// Configuração dos botões do modal
modalBtnCancelar.onclick = () => {
  if (acaoCancelarGlobal) {
    acaoCancelarGlobal(); // Executa a ação de cancelar, se ela existir
  }
  fecharModal();
};

modalBtnConfirmar.onclick = () => {
  const valorInput = modalInput.value;
  
  // BUG FIX: Verificamos se a ação de confirmar retorna 'false'
  // Se retornar 'false', significa que ela vai abrir OUTRO modal,
  // então NÃO devemos fechar o modal ainda.
  let naoFechar = false;
  
  if (acaoConfirmarGlobal) {
    const resultado = acaoConfirmarGlobal(valorInput);
    if (resultado === false) { // Ação vai abrir outro modal
      naoFechar = true;
    }
  }
  
  if (!naoFechar) {
    fecharModal();
  }
};

// Clicar fora (no overlay) também cancela
modalOverlay.onclick = (e) => {
  if (e.target === modalOverlay) {
    if (acaoCancelarGlobal) {
      acaoCancelarGlobal();
    }
    fecharModal();
  }
};
// Impede que o clique na CAIXA feche o modal
modalCaixa.onclick = (e) => {
    e.stopPropagation();
}


// ===================================
// FUNÇÕES AUXILIARES (Banco)
// ===================================

function obterDataHoraAtual() {
  const agora = new Date();
  const data = agora.toLocaleDateString('pt-BR');
  const hora = agora.toLocaleTimeString('pt-BR');
  return `[${data} ${hora}]`;
}

function habilitarOperacoes(habilitar) {
  document.getElementById("btnDepositar").disabled = !habilitar;
  document.getElementById("btnSacar").disabled = !habilitar;
  document.getElementById("btnSaldo").disabled = !habilitar;
  document.getElementById("btnMov").disabled = !habilitar;
  document.getElementById("btnEncerrar").disabled = !habilitar;
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
  if (tipo === "Abertura" || tipo === "Alerta" || tipo.includes("Cancelada")) {
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

// ===================================
// FUNÇÕES PRINCIPAIS (BOTÕES)
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
  
  conta = {
    nomeCliente: nome,
    tipoConta: tipo,
    saldo: 0,
    ativa: true,
    dataUltimoDeposito: null
  };
  movimentacoes = [];
  registrarMovimentacao("Abertura", 0, `Conta ${tipo} aberta para ${nome}`);
  
  document.getElementById("resConta").innerHTML =
    `✅ Conta <strong>${tipo}</strong> criada com sucesso para <strong>${nome}</strong>.`;
  
  document.getElementById("nome").disabled = true;
  document.getElementById("tipoConta").disabled = true;
  document.getElementById("btnAbrir").disabled = true;
  habilitarOperacoes(true);
}

function chamarModalDeposito() {
  if (!contaAtiva()) return;
  limparResultados();
  
  abrirModal(
    'prompt',
    'Depositar',
    'Digite o valor do depósito:',
    (valorStr) => { 
      const valor = parseFloat(valorStr.replace(",", "."));
      
      if (isNaN(valor) || valor <= 0) {
        document.getElementById("resOperacoes").innerHTML = 
          `<span class="msg-alerta">Valor inválido!</span>`;
        return;
      }
      
      conta.saldo += valor;
      if (conta.tipoConta === 'poupanca') {
        conta.dataUltimoDeposito = new Date();
      }
      registrarMovimentacao("Depósito", valor);
      
      document.getElementById("resOperacoes").innerHTML =
        `💰 Depósito realizado! Saldo atual: <strong>R$ ${conta.saldo.toFixed(2)}</strong>`;
    }
  );
}

function chamarModalSaque() {
  if (!contaAtiva()) return;
  limparResultados();

  if (conta.tipoConta !== 'poupanca') {
    abrirModalSaqueSimples(false); 
    return;
  }

  const hoje = new Date();
  const diasPassados = calcularDiferencaDias(conta.dataUltimoDeposito, hoje);

  if (diasPassados >= 30 && conta.saldo > 0) {
    const juros = conta.saldo * 0.005;
    conta.saldo += juros;
    registrarMovimentacao("Juros", juros, `Rendimento de 0.5% (${diasPassados} dias)`);

    abrirModal(
      'alert',
      'Parabéns! Juros Aplicados!',
      `<span class="msg-sucesso">Parabéns! ${diasPassados} dias se passaram.</span>` +
      `<span class="msg-sucesso">Você ganhou R$ ${juros.toFixed(2)} de juros.</span>` +
      `Saldo atualizado: <strong>R$ ${conta.saldo.toFixed(2)}</strong><br><br>` +
      `Agora, prossiga para digitar o valor do saque.`,
      () => {
        // CORREÇÃO DO BUG:
        // 1. Abrimos o modal de saque
        abrirModalSaqueSimples(true); 
        // 2. Retornamos 'false' para impedir o fecharModal() automático
        return false;
      }
    );

  } else {
    let diasRestantes = 30 - diasPassados;
    if (!conta.dataUltimoDeposito) diasRestantes = 30;

    abrirModal(
      'confirm',
      'Alerta de Juros',
      `<span class="msg-alerta">⚠️ ALERTA! Faltam ${diasRestantes} dias.</span><br>` +
      "Se continuar, você PERDERÁ o direito aos juros de 0.5%.<br><br>" +
      "Deseja continuar com o saque mesmo assim?",
      () => { // Ação do "Sim"
        registrarMovimentacao("Alerta", 0, "Saque antes dos 30 dias. Juros perdidos.");
        // CORREÇÃO DO BUG:
        // 1. Abrimos o modal de saque
        abrirModalSaqueSimples(true);
        // 2. Retornamos 'false' para impedir o fecharModal() automático
        return false;
      },
      () => { // Ação do "Não"
        registrarMovimentacao("Saque Cancelada", 0, "Cliente optou por não perder os juros.");
        document.getElementById("resOperacoes").innerHTML =
          `Operação cancelada. Seu dinheiro continua rendendo!`;
      }
    );
  }
}

/**
 * Função auxiliar que pede o valor do saque e o processa.
 */
function abrirModalSaqueSimples(zerarDataPoupanca) {
  abrirModal(
    'prompt',
    'Realizar Saque',
    'Digite o valor que deseja sacar:',
    (valorStr) => {
      const valor = parseFloat(valorStr.replace(",", "."));
      
      if (isNaN(valor) || valor <= 0) {
        document.getElementById("resOperacoes").innerHTML = 
          `<span class="msg-alerta">Valor inválido!</span>`;
        return;
      }
      
      if (valor > conta.saldo) {
        document.getElementById("resOperacoes").innerHTML = 
          `<span class="msg-alerta">Saldo insuficiente! Saldo atual: R$ ${conta.saldo.toFixed(2)}</span>`;
        return;
      }
      
      conta.saldo -= valor;
      registrarMovimentacao("Saque", valor * -1);
      
      if (zerarDataPoupanca) {
          conta.dataUltimoDeposito = null; 
      }
      
      document.getElementById("resOperacoes").innerHTML =
        `💸 Saque de R$ ${valor.toFixed(2)} realizado! Saldo atual: <strong>R$ ${conta.saldo.toFixed(2)}</strong>`;
    }
  );
}

function verSaldo() {
  if (!contaAtiva()) return;
  limparResultados();
  
  let msg = `📊 Saldo atual: <strong>R$ ${conta.saldo.toFixed(2)}</strong>`;

  if (conta.tipoConta === 'poupanca' && conta.dataUltimoDeposito) {
    const hoje = new Date();
    const diasPassados = calcularDiferencaDias(conta.dataUltimoDeposito, hoje);
    
    if (diasPassados < 30) {
      const diasRestantes = 30 - diasPassados;
      msg += `<br><span class="msg-info">💡 Faltam ${diasRestantes} dias para você ganhar os juros da poupança!</span>`;
    } else if (conta.saldo > 0) {
      msg += `<br><span class="msg-sucesso">💡 Você já pode sacar com juros de 0.5%!</span>`;
    }
  } else if (conta.tipoConta === 'poupanca' && !conta.dataUltimoDeposito) {
     msg += `<br><span class="msg-info">💡 Faça um depósito para iniciar o ciclo de juros de 30 dias!</span>`;
  }
  
  abrirModal('alert', 'Consulta de Saldo', msg);
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
    listaHtml = `<strong>📜 Movimentações Recentes:</strong><br>${listaInvertida.join("<br>")}`;
  }
  
  abrirModal('alert', 'Extrato da Conta', listaHtml);
  document.getElementById("resOperacoes").innerHTML = listaHtml;
}

function chamarModalEncerrar() {
  if (!contaAtiva()) return;
  limparResultados();
  
  if (conta.saldo !== 0) {
      const msg = `<span class="msg-alerta">Para encerrar, o saldo deve ser R$ 0,00.</span>` +
                   `<br>Seu saldo atual é: R$ ${conta.saldo.toFixed(2)}`;
      abrirModal('alert', 'Encerramento Negado', msg);
      document.getElementById("resOperacoes").innerHTML = msg;
      return;
  }

  abrirModal(
    'confirm',
    'Encerrar Conta',
    "Tem certeza que deseja encerrar a conta? Esta ação é irreversível.",
    () => { // Ação do "Sim"
      conta.ativa = false;
      document.getElementById("resOperacoes").innerHTML =
        `⚠️ Conta de <strong>${conta.nomeCliente}</strong> encerrada com sucesso!`;
      
      document.getElementById("nome").value = "";
      document.getElementById("tipoConta").value = "corrente";
      document.getElementById("nome").disabled = false;
      document.getElementById("tipoConta").disabled = false;
      document.getElementById("btnAbrir").disabled = false;
      habilitarOperacoes(false);
      
      conta = null;
      movimentacoes = [];
      document.getElementById("resConta").innerHTML = "";
    },
    () => { // Ação do "Não" (Cancelar)
       document.getElementById("resOperacoes").innerHTML = "Operação de encerramento cancelada.";
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

atualizarDataHora();
setInterval(atualizarDataHora, 1000);