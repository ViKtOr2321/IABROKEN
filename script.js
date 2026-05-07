let conversaAtual = [];

// =========================
// MODELO ATUAL
// =========================

// inicia no GPT
let modeloAtual = "gpt";

// =========================
// PROMPT SISTEMA
// =========================

const promptSistema = `
Você é o BrokerAI, um assistente inteligente especializado no mercado imobiliário.

Ajude usuários a:
- Comprar imóveis
- Vender imóveis
- Investir
- Tirar dúvidas sobre financiamento

Regras:
- Responda em português do Brasil
- Seja claro, direto e profissional
- Use linguagem simples
- Dê sugestões práticas
- Não invente informações
- Responda como um corretor experiente
`;

// =========================
// ENVIAR MENSAGEM
// =========================

async function enviarMensagem() {

  const input =
    document.getElementById("inputMensagem");

  if (!input) return;

  const texto = input.value.trim();

  if (texto === "") return;

  // animação inicial
  if (conversaAtual.length === 0) {

    iniciarAnimacao();

  }

  conversaAtual.push({
    role: "user",
    content: texto
  });

  adicionarMensagem("usuario", texto);

  input.value = "";

  // cria mensagem da IA
  const msgIA =
    adicionarMensagem("ia", "Pensando...");

  try {

    let resposta = "";

    // =========================
    // ESCOLHE MODELO
    // =========================

    if (modeloAtual === "gpt") {

      resposta = await chamarIA();

    } else {

      resposta = await chamarGemini();

    }

    conversaAtual.push({
      role: "assistant",
      content: resposta
    });

    efeitoDigitando(msgIA, resposta);

  } catch (erro) {

    console.error(
      "ERRO GERAL:",
      erro
    );

    msgIA.innerText =
      "⚠️ Erro ao conectar com a IA.";

  }
}

// =========================
// ADICIONAR MENSAGEM
// =========================

function adicionarMensagem(tipo, texto) {

  const chatArea =
    document.getElementById("chatArea");

  if (!chatArea) return null;

  const msg =
    document.createElement("div");

  msg.classList.add(
    "mensagem",
    tipo
  );

  msg.innerText = texto;

  chatArea.appendChild(msg);

  atualizarScroll();

  return msg;
}

// =========================
// EFEITO DIGITANDO
// =========================

function efeitoDigitando(elemento, texto) {

  if (!elemento) return;

  elemento.innerText = "";

  let i = 0;

  const intervalo = setInterval(() => {

    elemento.innerText =
      texto.substring(0, i + 1);

    i++;

    atualizarScroll();

    if (i >= texto.length) {

      clearInterval(intervalo);

    }

  }, 15);
}

// =========================
// SCROLL
// =========================

function atualizarScroll() {

  const chatArea =
    document.getElementById("chatArea");

  if (!chatArea) return;

  setTimeout(() => {

    chatArea.scrollTop =
      chatArea.scrollHeight;

  }, 50);
}

// =========================
// API KEYS
// =========================

async function carregarApiKeyGPT() {

  try {

    const res =
      await fetch("apiKey.json");

    const data =
      await res.json();

    return data.apiKeyGPT;

  } catch (erro) {

    console.error(
      "ERRO API GPT:",
      erro
    );

    return null;

  }
}

async function carregarApiKeyGemini() {

  try {

    const res =
      await fetch("apiKey.json");

    const data =
      await res.json();

    return data.apiKeyGemini;

  } catch (erro) {

    console.error(
      "ERRO API GEMINI:",
      erro
    );

    return null;

  }
}

// =========================
// GPT
// =========================

async function chamarIA() {

  try {

    const apiKey =
      await carregarApiKeyGPT();

    if (!apiKey) {

      return "⚠️ API Key GPT não encontrada.";

    }

    const endpoint =
      "https://georg-ml7854jc-swedencentral.cognitiveservices.azure.com";

    const resposta = await fetch(
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

          model: "gpt-5.2-chat",

          input:
            promptSistema + "\n\n" +
            conversaAtual.map(m =>
              `${m.role === "user"
                ? "Usuário"
                : "IA"}: ${m.content}`
            ).join("\n"),

          max_output_tokens: 300

        })
      }
    );

    if (!resposta.ok) {

      const erroTexto =
        await resposta.text();

      console.error(
        "ERRO GPT:",
        erroTexto
      );

      return "⚠️ Erro no GPT.";

    }

    const data =
      await resposta.json();

    console.log(
      "GPT JSON:",
      data
    );

    const mensagem =
      data.output.find(
        i => i.type === "message"
      );

    const texto =
      mensagem.content.find(
        i => i.type === "output_text"
      );

    return "🧠 GPT:\n\n" + texto.text;

  } catch (erro) {

    console.error(
      "ERRO GPT:",
      erro
    );

    return "⚠️ Falha ao conectar GPT.";

  }
}

// =========================
// GEMINI
// =========================

async function chamarGemini() {

  try {

    const apiKey =
      await carregarApiKeyGemini();

    if (!apiKey) {

      return "⚠️ API Key Gemini não encontrada.";

    }


    // evita spam
    await new Promise(r =>
      setTimeout(r, 1200)
    );

    // limita histórico
    const historicoLimitado =
      conversaAtual.slice(-8);

    const model = "gemini-3.1-flash-lite-preview"
    // const model = "gemini-3-flash-preview"
    // const model = "gemini-2.5-pro"
    // const model = "gemini-2.5-flash"

    const response = await fetch(
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
                    promptSistema + "\n\n" +
                    historicoLimitado.map(m =>
                      `${m.role === "user"
                        ? "Usuário"
                        : "IA"}: ${m.content}`
                    ).join("\n")
                }
              ]
            }
          ],

          generationConfig: {

            temperature: 0.7,

            maxOutputTokens: 2000

          }

        })
      }
    );

    // =========================
    // ERROS HTTP
    // =========================

    if (!response.ok) {

      const erroTexto =
        await response.text();

      console.error(
        "ERRO GEMINI:",
        {
          status: response.status,
          body: erroTexto
        }
      );

      if (response.status === 429) {

        return "⚠️ Limite temporário do Gemini atingido.";

      }

      if (response.status === 400) {

        return "⚠️ API Key Gemini inválida.";

      }

      if (response.status === 403) {

        return "⚠️ Gemini sem permissão.";

      }

      return "⚠️ Erro no Gemini.";

    }

    const data =
      await response.json();

    console.log(
      "GEMINI JSON:",
      data
    );

    // =========================
    // VALIDAÇÃO
    // =========================

    const partes =
      data?.candidates?.[0]
      ?.content?.parts || [];

    const texto =
      partes.map(
        p => p.text
      ).join("");

    if (!texto ||
        texto.trim() === "") {

      console.error(
        "RESPOSTA INVÁLIDA:",
        data
      );

      return "⚠️ Gemini não respondeu.";

    }

    return "🤖 GEMINI:\n\n" + texto;

  } catch (erro) {

    console.error(
      "ERRO GEMINI:",
      erro
    );

    return "⚠️ Falha ao conectar Gemini.";

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

      if (e.key === "Enter") {

        e.preventDefault();

        enviarMensagem();

      }

    }
  );

}

// =========================
// WINDOW LOAD
// =========================

window.onload = function() {

  // =========================
  // TEMA
  // =========================

  const tema =
    localStorage.getItem("tema");

  if (tema === "dark") {

    document.body.classList.add(
      "dark"
    );

  }

  // =========================
  // TOGGLE IA
  // =========================

  const toggle =
    document.getElementById(
      "toggleIA"
    );

  if (toggle) {

    // inicia GPT desligado
    toggle.checked = false;

    modeloAtual = "gpt";

    toggle.addEventListener(
      "change",
      () => {

        if (toggle.checked) {

          modeloAtual =
            "gemini";

        } else {

          modeloAtual =
            "gpt";

        }

      }
    );

  }

  atualizarScroll();

};

// =========================
// DARK MODE
// =========================

function alternarTema() {

  document.body.classList.toggle(
    "dark"
  );

  localStorage.setItem(

    "tema",

    document.body.classList.contains(
      "dark"
    )
      ? "dark"
      : "light"

  );
}

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

  if (!robo || !tela) return;

  robo.style.transform =
    "translateX(320px)";

  setTimeout(() => {

    tela.style.opacity = "0";

    tela.style.pointerEvents =
      "none";

  }, 1800);

  setTimeout(() => {

    tela.style.display = "none";

  }, 3000);
}

// =========================
// VOZ / MICROFONE
// =========================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {

  const recognition =
    new SpeechRecognition();

  recognition.lang = "pt-BR";

  recognition.continuous = false;

  recognition.interimResults = false;

  const botaoMicrofone =
    document.getElementById(
      "btnMicrofone"
    );

  if (botaoMicrofone) {

    botaoMicrofone.addEventListener(
      "click",
      () => {

        recognition.start();

        botaoMicrofone.classList.add(
          "gravando"
        );

        console.log(
          "🎤 Ouvindo..."
        );

      }
    );

  }

  // =========================
  // RESULTADO DA VOZ
  // =========================

  recognition.onresult =
    function(event) {

      const texto =
        event.results[0][0]
        .transcript;

      console.log(
        "Texto reconhecido:",
        texto
      );

      const input =
        document.getElementById(
          "inputMensagem"
        );

      input.value = texto;

      enviarMensagem();

    };

  // =========================
  // FINALIZAÇÃO
  // =========================

  recognition.onend =
    function() {

      const botaoMicrofone =
        document.getElementById(
          "btnMicrofone"
        );

      if (botaoMicrofone) {

        botaoMicrofone.classList.remove(
          "gravando"
        );

      }

      console.log(
        "🎤 Microfone finalizado"
      );

    };

  // =========================
  // ERROS
  // =========================

  recognition.onerror =
    function(event) {

      console.error(
        "ERRO MICROFONE:",
        event.error
      );

      const botaoMicrofone =
        document.getElementById(
          "btnMicrofone"
        );

      if (botaoMicrofone) {

        botaoMicrofone.classList.remove(
          "gravando"
        );

      }

      alert(
        "Erro no microfone: " +
        event.error
      );

    };

} else {

  console.error(
    "SpeechRecognition não suportado"
  );

  alert(
    "Seu navegador não suporta reconhecimento de voz."
  );

}
// =========================
// REINICIAR CHAT
// =========================

function reiniciarChat() {

  // limpa conversa
  conversaAtual = [];

  // limpa mensagens
  const chatArea =
    document.getElementById("chatArea");

  if (chatArea) {

    chatArea.innerHTML = "";

  }

  // mostra tela inicial novamente
  const tela =
    document.getElementById("telaInicial");

  if (tela) {

    tela.style.display = "flex";

    setTimeout(() => {

      tela.style.opacity = "1";

      tela.style.pointerEvents = "all";

    }, 50);

  }

  // reset robô
  const robo =
    document.getElementById("robo");

  if (robo) {

    robo.style.transform =
      "translateX(0px)";

  }

  // limpa input
  const input =
    document.getElementById("inputMensagem");

  if (input) {

    input.value = "";

  }

  atualizarScroll();

  console.log(
    "🔄 Chat reiniciado"
  );
}
