// ========================================
// HISTÓRICO DE CONVERSAS
// ========================================

let historicoConversas = [];

// ========================================
// CONVERSA ATUAL
// ========================================

let conversaAtual = {
  id: Date.now(),
  titulo: "Nova conversa",
  mensagens: []
};

// adiciona primeira conversa
historicoConversas.push(
  conversaAtual
);

// =========================
// MODELO ATUAL
// =========================

let modeloAtual = "gpt";

// =========================
// CONTROLE DE ÁUDIO
// =========================

let audioAtual = null;

// =========================
// PROMPT SISTEMA
// =========================

const promptSistema = `
Você é o BrokerAI.

Seu objetivo:
- Ajudar usuários em conversas inteligentes
- Agir como uma IA moderna
- Responder de forma natural
- Ser rápido e objetivo
- Manter contexto da conversa atual

Regras:
- Responda sempre em português do Brasil
- Nunca invente informações
- Seja claro e organizado
- Use linguagem moderna e profissional
- Explique de forma simples
- Use listas quando necessário
- Evite respostas robóticas
- Seja útil e direto

Estilo:
- Conversa fluida
- Inteligente
- Profissional
- Natural
`;

// =========================
// ENVIAR MENSAGEM
// =========================

async function enviarMensagem() {

  const input =
    document.getElementById(
      "inputMensagem"
    );

  if (!input) return;

  const texto =
    input.value.trim();

  if (texto === "") return;

  // animação inicial
  if (
    conversaAtual.mensagens.length === 0
  ) {

    iniciarAnimacao();

  }

  // salva mensagem usuário
  conversaAtual.mensagens.push({

    role: "user",

    content: texto

  });

  // define título automático
  if (
    conversaAtual.titulo ===
    "Nova conversa"
  ) {

    conversaAtual.titulo =
      texto.substring(0, 30);

    renderizarConversas();

  }

  adicionarMensagem(
    "usuario",
    texto
  );

  input.value = "";

  // cria mensagem IA
  const msgIA =
    adicionarMensagem(
      "ia",
      "Pensando..."
    );

  try {

    let resposta = "";

    // GPT
    if (
      modeloAtual === "gpt"
    ) {

      resposta =
        await chamarIA();

    }

    // GEMINI
    else {

      resposta =
        await chamarGemini();

    }

    // salva resposta IA
    conversaAtual.mensagens.push({

      role: "assistant",

      content: resposta

    });

    // efeito digitando
    efeitoDigitando(
      msgIA,
      resposta
    );

    // voz
    if (
      modeloAtual === "gpt"
    ) {

      falarTextoAzure(
        resposta
      );

    } else {

      falarTextoGemini(
        resposta
      );

    }

  } catch (erro) {

    console.error(
      "ERRO:",
      erro
    );

    msgIA.innerText =
      "Erro ao conectar IA.";

  }

}

// =========================
// ADICIONAR MENSAGEM
// =========================

function adicionarMensagem(
  tipo,
  texto
) {

  const chatArea =
    document.getElementById(
      "chatArea"
    );

  if (!chatArea) return;

  const msg =
    document.createElement(
      "div"
    );

  msg.classList.add(
    "mensagem",
    tipo
  );

  msg.innerText =
    texto;

  chatArea.appendChild(
    msg
  );

  atualizarScroll();

  return msg;

}

// =========================
// EFEITO DIGITANDO
// =========================

function efeitoDigitando(
  elemento,
  texto
) {

  elemento.innerText = "";

  let i = 0;

  const intervalo =
    setInterval(() => {

      elemento.innerText =
        texto.substring(
          0,
          i + 1
        );

      i++;

      atualizarScroll();

      if (
        i >= texto.length
      ) {

        clearInterval(
          intervalo
        );

      }

    }, 15);

}

// =========================
// SCROLL
// =========================

function atualizarScroll() {

  const chatArea =
    document.getElementById(
      "chatArea"
    );

  if (!chatArea) return;

  setTimeout(() => {

    chatArea.scrollTop =
      chatArea.scrollHeight;

  }, 50);

}

// =========================
// API GPT
// =========================

async function carregarApiKeyGPT() {

  try {

    const res =
      await fetch(
        "apiKey.json"
      );

    const data =
      await res.json();

    return data.apiKeyGPT;

  } catch (erro) {

    console.error(erro);

    return null;

  }

}

// =========================
// API GEMINI
// =========================

async function carregarApiKeyGemini() {

  try {

    const res =
      await fetch(
        "apiKey.json"
      );

    const data =
      await res.json();

    return data.apiKeyGemini;

  } catch (erro) {

    console.error(erro);

    return null;

  }

}

// =========================
// GPT CHAT
// =========================

async function chamarIA() {

  try {

    const apiKey =
      await carregarApiKeyGPT();

    if (!apiKey) {

      return "API GPT não encontrada.";

    }

    const endpoint =
      "https://georg-ml7854jc-swedencentral.cognitiveservices.azure.com";

    const historico =
      conversaAtual.mensagens
      .map(
        m =>
          `${m.role === "user"
            ? "Usuário"
            : "IA"}: ${m.content}`
      )
      .join("\n");

    const resposta =
      await fetch(
        `${endpoint}/openai/responses?api-version=2025-04-01-preview`,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "api-key":
              apiKey

          },

          body: JSON.stringify({

            model:
              "gpt-5.2-chat",

            input:
              promptSistema +
              "\n\n" +
              historico,

            max_output_tokens:
              500

          })

        }
      );

    if (!resposta.ok) {

      return "Erro no GPT.";

    }

    const data =
      await resposta.json();

    const mensagem =
      data.output.find(
        i =>
          i.type ===
          "message"
      );

    const texto =
      mensagem.content.find(
        i =>
          i.type ===
          "output_text"
      );

    return texto.text;

  } catch (erro) {

    console.error(erro);

    return "Falha GPT.";

  }

}

// =========================
// GEMINI CHAT
// =========================

async function chamarGemini() {

  try {

    const apiKey =
      await carregarApiKeyGemini();

    if (!apiKey) {

      return "API Gemini não encontrada.";

    }

    const historico =
      conversaAtual.mensagens
      .map(
        m =>
          `${m.role === "user"
            ? "Usuário"
            : "IA"}: ${m.content}`
      )
      .join("\n");

    const model =
      "gemini-2.5-flash";

    const response =
      await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            "x-goog-api-key":
              apiKey

          },

          body: JSON.stringify({

            contents: [
              {
                parts: [
                  {
                    text:
                      promptSistema +
                      "\n\n" +
                      historico
                  }
                ]
              }
            ]

          })

        }
      );

    if (!response.ok) {

      return "Erro Gemini.";

    }

    const data =
      await response.json();

    return data
      ?.candidates?.[0]
      ?.content?.parts?.[0]
      ?.text || "Sem resposta.";

  } catch (erro) {

    console.error(erro);

    return "Falha Gemini.";

  }

}

// =========================
// ENTER
// =========================

const inputMensagem =
  document.getElementById(
    "inputMensagem"
  );

if (inputMensagem) {

  inputMensagem.addEventListener(
    "keypress",
    function(e) {

      if (
        e.key === "Enter"
      ) {

        e.preventDefault();

        enviarMensagem();

      }

    }
  );

}

// =========================
// NOVA CONVERSA
// =========================

document
  .getElementById(
    "btnNovaConversa"
  )
  ?.addEventListener(
    "click",
    function() {

      // cria nova conversa
      conversaAtual = {

        id: Date.now(),

        titulo:
          "Nova conversa",

        mensagens: []

      };

      // salva no histórico
      historicoConversas.push(
        conversaAtual
      );

      // limpa chat
      const chatArea =
        document.getElementById(
          "chatArea"
        );

      if (chatArea) {

        chatArea.innerHTML =
          "";

      }

      // renderiza sidebar
      renderizarConversas();

      console.log(
        "Nova conversa criada"
      );

    }
  );

// =========================
// RENDERIZAR SIDEBAR
// =========================

function renderizarConversas() {

  const lista =
    document.getElementById(
      "listaConversas"
    );

  if (!lista) return;

  lista.innerHTML = "";

  historicoConversas.forEach(
    (conversa) => {

      const item =
        document.createElement(
          "div"
        );

      item.classList.add(
        "conversa-item"
      );

      // conversa ativa
      if (
        conversa.id ===
        conversaAtual.id
      ) {

        item.classList.add(
          "ativa"
        );

      }

      item.innerText =
        conversa.titulo;

      // abrir conversa
      item.onclick =
        function() {

          abrirConversa(
            conversa.id
          );

        };

      lista.appendChild(
        item
      );

    }
  );

}

// =========================
// ABRIR CONVERSA
// =========================

function abrirConversa(id) {

  const conversa =
    historicoConversas.find(
      c => c.id === id
    );

  if (!conversa) return;

  conversaAtual =
    conversa;

  const chatArea =
    document.getElementById(
      "chatArea"
    );

  if (!chatArea) return;

  chatArea.innerHTML = "";

  conversa.mensagens.forEach(
    mensagem => {

      adicionarMensagem(

        mensagem.role === "user"
          ? "usuario"
          : "ia",

        mensagem.content

      );

    }
  );

  renderizarConversas();

}

// =========================
// WINDOW LOAD
// =========================

window.onload = function() {

  renderizarConversas();

  const toggle =
    document.getElementById(
      "toggleIA"
    );

  if (toggle) {

    toggle.checked =
      false;

    modeloAtual =
      "gpt";

    toggle.addEventListener(
      "change",
      () => {

        if (
          toggle.checked
        ) {

          modeloAtual =
            "gemini";

        } else {

          modeloAtual =
            "gpt";

        }

      }
    );

  }

};

// =========================
// ANIMAÇÃO
// =========================

function iniciarAnimacao() {

  const robo =
    document.getElementById(
      "robo"
    );

  const tela =
    document.getElementById(
      "telaInicial"
    );

  if (
    !robo ||
    !tela
  ) return;

  robo.style.transform =
    "translateX(320px)";

  setTimeout(() => {

    tela.style.opacity =
      "0";

    tela.style.pointerEvents =
      "none";

  }, 1800);

  setTimeout(() => {

    tela.style.display =
      "none";

  }, 3000);

}
/* =========================
SIDEBAR DARK MODE
========================= */

.sidebar {
  background: #ffffff;
  transition: 0.3s;
}

body.dark .sidebar {
  background: #111827;
}

/* =========================
ÁREA INPUT DARK MODE
========================= */

.input-area {
  background: #ffffff;
  transition: 0.3s;
}

body.dark .input-area {
  background: #111827;
}

/* =========================
INPUT DARK MODE
========================= */

#inputMensagem {
  background: #f1f1f1;
  color: #000;
  transition: 0.3s;
}

body.dark #inputMensagem {
  background: #1f2937;
  color: #fff;
}

/* =========================
BOTÕES DARK MODE
========================= */

body.dark .conversa-item {
  background: #1f2937;
  color: #fff;
}

body.dark .conversa-item:hover {
  background: #2b3547;
}

/* =========================
PLACEHOLDER
========================= */

body.dark #inputMensagem::placeholder {
  color: #9ca3af;
}
