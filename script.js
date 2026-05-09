// ========================================
// HISTÓRICO DE CONVERSAS
// ========================================

let historicoConversas = [];

// ========================================
// CONVERSA ATUAL
// ========================================

let conversaAtual = null;

// =========================
// MODELO ATUAL
// =========================

let modeloAtual = "gpt";

// =========================
// PROMPT SISTEMA
// =========================

const promptSistema = `
Você é o BrokerAI.

Regras:
- Responda em português do Brasil
- Seja claro, direto e profissional
- Use linguagem simples
- Dê sugestões práticas
- Não invente informações
`;

// =========================
// CONTROLE DE ÁUDIO
// =========================

let audioAtual = null;

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
  if (conversaAtual.length === 0) {

    iniciarAnimacao();

  }

  conversaAtual.mensagens.push({
  role: "user",
  content: texto
});

// salva na memória global
memoriaGlobal.push({
  role: "user",
  content: texto
});

  adicionarMensagem(
    "usuario",
    texto
  );

  input.value = "";

  // mensagem IA
  const msgIA =
    adicionarMensagem(
      "ia",
      "Pensando..."
    );

  try {

    let resposta = "";

    // =========================
    // ESCOLHE MODELO
    // =========================

    if (modeloAtual === "gpt") {

      resposta =
        await chamarIA();

    } else {

      resposta =
        await chamarGemini();

    }

    conversaAtual.mensagens.push({
  role: "assistant",
  content: resposta
});

    // efeito digitando
    efeitoDigitando(
      msgIA,
      resposta
    );

    // =========================
    // VOZ AUTOMÁTICA
    // =========================

    if (modeloAtual === "gpt") {

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
      "ERRO GERAL:",
      erro
    );

    msgIA.innerText =
      "Erro ao conectar com IA.";

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

  if (!chatArea) return null;

  const msg =
    document.createElement(
      "div"
    );

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

function efeitoDigitando(
  elemento,
  texto
) {

  if (!elemento) return;

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

      if (i >= texto.length) {

        clearInterval(
          intervalo
        );

      }

    }, 15);

}

// =========================
// LIMPAR TEXTO
// =========================

function limparTextoParaFala(
  texto
) {

  return texto

    // remove emojis
    .replace(
      /[\u{1F300}-\u{1FAFF}]/gu,
      ""
    )

    // remove markdown
    .replace(
      /[*#_~`>|<{}\[\]\\\/+=]/g,
      ""
    )

    // remove espaços excessivos
    .replace(/\s+/g, " ")

    // separa palavras grudadas
    .replace(
      /([a-záàâãéèêíïóôõöúç])([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ])/g,
      "$1 $2"
    )

    // mantém acentos corretos
    .normalize("NFC")

    .trim();

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
// API KEYS
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
      await fetch(
        "apiKey.json"
      );

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
// GPT CHAT
// =========================

async function chamarIA() {

  try {

    const apiKey =
      await carregarApiKeyGPT();

    if (!apiKey) {

      return "API Key GPT não encontrada.";

    }

    const endpoint =
      "https://georg-ml7854jc-swedencentral.cognitiveservices.azure.com";

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
              conversaAtual.map(
                m =>
                  `${m.role === "user"
                    ? "Usuário"
                    : "IA"}: ${m.content}`
              ).join("\n"),

            max_output_tokens:
              300

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

      return "Erro no GPT.";

    }

    const data =
      await resposta.json();
    
    console.log(data);

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

    console.error(
      "ERRO GPT:",
      erro
    );

    return "Falha ao conectar GPT.";

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

      return "API Key Gemini não encontrada.";

    }

    const historicoLimitado =
      conversaAtual.slice(-8);

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
                      historicoLimitado.map(
                        m =>
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

              maxOutputTokens:
                2000

            }

          })

        }
      );

    if (!response.ok) {

      const erroTexto =
        await response.text();

      console.error(
        "ERRO GEMINI:",
        erroTexto
      );

      return "Erro no Gemini.";

    }

    const data =
      await response.json();

    const partes =
      data?.candidates?.[0]
      ?.content?.parts || [];

    const texto =
      partes.map(
        p => p.text
      ).join("");

    return texto;

  } catch (erro) {

    console.error(
      "ERRO GEMINI:",
      erro
    );

    return "Falha ao conectar Gemini.";

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

  const tema =
    localStorage.getItem(
      "tema"
    );

  if (tema === "dark") {

    document.body.classList.add(
      "dark"
    );

  }

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

        if (toggle.checked) {

          modeloAtual =
            "gemini";

          console.log(
            "Gemini ativado"
          );

        } else {

          modeloAtual =
            "gpt";

          console.log(
            "GPT ativado"
          );

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

  if (!robo || !tela)
    return;

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

// =========================
// MICROFONE INTELIGENTE
// =========================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let recognition = null;

// =========================
// CONFIG
// =========================

const palavraChave =
  "broker";

let ouvindoComando =
  false;

let textoCapturado =
  "";

// =========================
// INICIAR
// =========================

if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();

  recognition.lang =
    "pt-BR";

  recognition.continuous =
    true;

  recognition.interimResults =
    true;

  // =========================
  // RESULTADO VOZ
  // =========================

  recognition.onresult =
    function(event) {

      let textoTemp = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        textoTemp +=
          event.results[i][0]
          .transcript;

      }

      textoTemp =
        textoTemp.toLowerCase();

      console.log(
        "🎤 Ouvindo:",
        textoTemp
      );

      // =========================
      // DETECTA PALAVRA CHAVE
      // =========================

      if (
        !ouvindoComando &&
        textoTemp.includes(
          palavraChave
        )
      ) {

        ouvindoComando = true;

        textoCapturado = "";

        console.log(
          "🤖 Palavra-chave detectada"
        );

        return;

      }

      // =========================
      // CAPTURA COMANDO
      // =========================

      if (ouvindoComando) {

        textoCapturado =
          textoTemp
            .replace(
              palavraChave,
              ""
            )
            .trim();

        const input =
          document.getElementById(
            "inputMensagem"
          );

        if (input) {

          input.value =
            textoCapturado;

        }

      }

    };

// =========================
// CONTROLE SILÊNCIO
// =========================

let timeoutSilencio = null;

// =========================
// RESULTADO VOZ
// =========================

recognition.onresult =
  function(event) {

    let textoTemp = "";

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      textoTemp +=
        event.results[i][0]
        .transcript;

    }

    textoTemp =
      textoTemp.toLowerCase();

    console.log(
      "🎤 Ouvindo:",
      textoTemp
    );

    // =========================
    // PALAVRA CHAVE
    // =========================

    if (
      !ouvindoComando &&
      textoTemp.includes(
        palavraChave
      )
    ) {

      ouvindoComando = true;

      textoCapturado = "";

      console.log(
        "🤖 Palavra-chave detectada"
      );

      return;

    }

    // =========================
    // CAPTURA TEXTO
    // =========================

    if (ouvindoComando) {

      textoCapturado =
        textoTemp
          .replace(
            palavraChave,
            ""
          )
          .trim();

      const input =
        document.getElementById(
          "inputMensagem"
        );

      if (input) {

        input.value =
          textoCapturado;

      }

      // =========================
      // RESET TIMER
      // =========================

      clearTimeout(
        timeoutSilencio
      );

      timeoutSilencio =
        setTimeout(
          async () => {

            if (
              textoCapturado.trim() !== ""
            ) {

              console.log(
                "📨 Enviando mensagem..."
              );

              ouvindoComando =
                false;

              await enviarMensagem();

            }

          },
          2000 // 2 segundos sem falar
        );

    }

  };
  // =========================
  // REINICIA AUTOMÁTICO
  // =========================

  recognition.onend =
    function() {

      console.log(
        "🔄 Reiniciando reconhecimento..."
      );

      recognition.start();

    };

  // =========================
  // ERRO
  // =========================

  recognition.onerror =
    function(event) {

      console.error(
        "ERRO MICROFONE:",
        event.error
      );

    };

  // =========================
  // START
  // =========================

  recognition.start();

  console.log(
    "🎤 Escutando palavra-chave..."
  );

}

// =========================
// REINICIAR CHAT
// =========================

function reiniciarChat() {

  // cria nova conversa
  const novaConversa = {

    id: Date.now(),

    titulo: "Nova conversa",

    mensagens: []

  };

  // salva no histórico
  historicoConversas.push(
    novaConversa
  );

  // define conversa atual
  conversaAtual =
    novaConversa;

  // limpa área do chat
  const chatArea =
    document.getElementById(
      "chatArea"
    );

  if (chatArea) {

    chatArea.innerHTML = "";

  }

  // atualiza sidebar
  renderizarConversas();

  // tela inicial
  const tela =
    document.getElementById(
      "telaInicial"
    );

  if (tela) {

    tela.style.display =
      "flex";

    setTimeout(() => {

      tela.style.opacity =
        "1";

      tela.style.pointerEvents =
        "all";

    }, 50);

  }

  // robô
  const robo =
    document.getElementById(
      "robo"
    );

  if (robo) {

    robo.style.transform =
      "translateX(0px)";

  }

}

// =========================
// AZURE TEXT TO SPEECH
// =========================

async function falarTextoAzure(
  texto
) {

  try {

    if (
      !texto ||
      texto.trim() === ""
    ) return;

    if (audioAtual) {

      audioAtual.pause();

      audioAtual = null;

    }

    const res =
      await fetch(
        "apiKey.json"
      );

    const data =
      await res.json();

    const speechKey =
      data.apiKeyGPT;

    const endpoint =
      "https://swedencentral.tts.speech.microsoft.com/cognitiveservices/v1";

    texto =
      limparTextoParaFala(
        texto
      );

    const ssml = `
<speak version='1.0' xml:lang='pt-BR'>
    <voice name='pt-BR-AntonioNeural'>
        <prosody rate="1.03" pitch="-4%">
            ${texto}
        </prosody>
    </voice>
</speak>
`;

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {

            "Ocp-Apim-Subscription-Key":
              speechKey,

            "Content-Type":
              "application/ssml+xml",

            "X-Microsoft-OutputFormat":
              "audio-24khz-48kbitrate-mono-mp3"

          },

          body: ssml

        }
      );

    if (!response.ok) {

      const erro =
        await response.text();

      console.error(
        "ERRO AZURE:",
        erro
      );

      return;

    }

    const audioBlob =
      await response.blob();

    const audioUrl =
      URL.createObjectURL(
        audioBlob
      );

    audioAtual =
      new Audio(audioUrl);

    audioAtual.play();

    console.log(
      "Azure falando..."
    );

  } catch (erro) {

    console.error(
      "ERRO VOZ AZURE:",
      erro
    );

  }

}

// =========================
// GEMINI TEXT TO SPEECH (FIX FINAL)
// =========================

async function falarTextoGemini(texto) {
  try {
    if (!texto || texto.trim() === "") return;

    // PARA ÁUDIO ANTERIOR
    if (audioAtual) {
      audioAtual.pause();
      audioAtual.currentTime = 0;
      audioAtual = null;
    }

    const apiKey = await carregarApiKeyGemini();
    const textoLimpo = limparTextoParaFala(texto);
    
    // MODELO 3.1 TTS PREVIEW
    // const model = "gemini-3.1-flash-tts-preview";
    "gemini-2.5-flash-preview-tts" 
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: textoLimpo }]
        }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoide" // Tente "Aoide" ou "Kore"
              }
            }
          }
        }
      })
    });

    const data = await response.json();

    // 1. Verifica se a API retornou erro de cota ou segurança
    if (data.error) {
      console.error("Erro na API Gemini:", data.error.message);
      return;
    }

    // 2. Localiza a parte do áudio
    const audioPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (audioPart && audioPart.inlineData && audioPart.inlineData.data) {
      const audioBase64 = audioPart.inlineData.data;
      
      // O Gemini 3.1 geralmente envia áudio/pcm ou áudio/mp3. 
      // Vamos usar audio/mp3 como padrão de fallback se o mimeType vier vazio.
      const mimeType = audioPart.inlineData.mimeType || "audio/mp3";
      
      console.log("Áudio recebido, tipo:", mimeType);

      // 3. Monta a URL do áudio com segurança
      const audioSrc = `data:${mimeType};base64,${audioBase64}`;
      audioAtual = new Audio();
      
      // Evento de erro para nos dizer exatamente o que o navegador não gostou
      audioAtual.onerror = (e) => {
        console.error("Erro interno do elemento Audio:", e);
      };

      audioAtual.src = audioSrc;
      
      // Toca o áudio
      audioAtual.play().catch(e => {
        console.warn("Reprodução automática bloqueada ou falhou:", e);
      });

      console.log("Gemini falando...");
    } else {
      console.error("A API não retornou dados de áudio (inlineData ausente). Verifique sua API Key ou limite de uso.");
    }

  } catch (erro) {
    console.error("ERRO CRÍTICO NO PROCESSO DE VOZ:", erro);
  }
}
// ========================================
// NOVA CONVERSA
// ========================================

document
  .getElementById(
    "btnNovaConversa"
  )
  ?.addEventListener(
    "click",
    function() {

      // SALVA CONVERSA ATUAL
      conversas.push({

        id: Date.now(),

        mensagens: [
          ...conversaAtual
        ]

      });

      // LIMPA CHAT VISUAL
      const chatArea =
        document.getElementById(
          "chatArea"
        );

      if (chatArea) {

        chatArea.innerHTML = "";

      }

      // NOVA MEMÓRIA
      conversaAtual = [];

      console.log(
        "Nova conversa criada"
      );

    }
  );
  // ========================================
// ATUALIZA SIDEBAR
// ========================================

function atualizarListaConversas() {

  const lista =
    document.getElementById(
      "listaConversas"
    );

  if (!lista) return;

  lista.innerHTML = "";

  conversas.forEach(
    (conversa, index) => {

      const item =
        document.createElement(
          "div"
        );

      item.classList.add(
        "conversa-item"
      );

      // TÍTULO
      let titulo =
        "Nova conversa";

      const primeiraMensagem =
        conversa.mensagens.find(
          m => m.role === "user"
        );

      if (primeiraMensagem) {

        titulo =
          primeiraMensagem.content.substring(
            0,
            30
          );

      }

      item.innerText =
        titulo;

      lista.appendChild(
        item
      );

    }
  );

}
// =========================
// RENDERIZAR CONVERSAS
// =========================

function renderizarConversas() {

  const lista =
    document.getElementById(
      "listaConversas"
    );

  if (!lista) return;

  // limpa sidebar
  lista.innerHTML = "";

  historicoConversas.forEach(
    (conversa, index) => {

      const item =
        document.createElement(
          "div"
        );

      item.classList.add(
        "conversa-item"
      );

      // conversa ativa
      if (
        conversa.mensagens ===
        conversaAtual
      ) {

        item.classList.add(
          "ativa"
        );

      }

      // título
      item.innerText =
        conversa.titulo ||
        `Conversa ${index + 1}`;

      // clicar conversa
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
    conversa.mensagens;

  const chatArea =
    document.getElementById(
      "chatArea"
    );

  if (!chatArea) return;

  // limpa tela
  chatArea.innerHTML = "";

  // recria mensagens
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