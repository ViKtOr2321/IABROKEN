let conversaAtual = [];

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

  conversaAtual.push({
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

    conversaAtual.push({
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
// MICROFONE
// =========================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    "pt-BR";

  recognition.continuous =
    false;

  recognition.interimResults =
    false;

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
          "Microfone ouvindo..."
        );

      }
    );

  }

  recognition.onresult =
    function(event) {

      const texto =
        event.results[0][0]
        .transcript;

      const input =
        document.getElementById(
          "inputMensagem"
        );

      input.value = texto;

      enviarMensagem();

    };

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

    };

}

// =========================
// REINICIAR CHAT
// =========================

function reiniciarChat() {

  conversaAtual = [];

  const chatArea =
    document.getElementById(
      "chatArea"
    );

  if (chatArea) {

    chatArea.innerHTML =
      "";

  }

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
// GEMINI TEXT TO SPEECH
// =========================

async function falarTextoGemini(
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

    const apiKey =
      await carregarapiKeyGemini();

    texto =
      limparTextoParaFala(
        texto
      );

    const endpoint =
      "https://ai.google.dev/gemini-api/docs/pricing?hl=pt-br#gemini-2.5-flash-preview-tts" 
     apiKey;

    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            contents: [
              {
                parts: [
                  {
                    text:
                      texto
                  }
                ]
              }
            ],

            generationConfig: {

              responseModalities: [
                "AUDIO"
              ]

            }

          })

        }
      );

    if (!response.ok) {

      const erro =
        await response.text();

      console.error(
        "ERRO GEMINI TTS:",
        erro
      );

      return;

    }

    const result =
      await response.json();

    console.log(
      "GEMINI TTS:",
      result
    );

    const audioBase64 =
      result?.candidates?.[0]
      ?.content?.parts?.find(
        p => p.inlineData
      )?.inlineData?.data;

    if (!audioBase64) {

      console.error(
        "Áudio Gemini não encontrado."
      );

      return;

    }

    const audioBytes =
      Uint8Array.from(
        atob(audioBase64),
        c => c.charCodeAt(0)
      );

    const audioBlob =
      new Blob(
        [audioBytes],
        {
          type: "audio/wav"
        }
      );

    const audioUrl =
      URL.createObjectURL(
        audioBlob
      );

    audioAtual =
      new Audio(audioUrl);

    await audioAtual.play();

    console.log(
      "Gemini falando..."
    );

  } catch (erro) {

    console.error(
      "ERRO GEMINI VOZ:",
      erro
    );

  }

}