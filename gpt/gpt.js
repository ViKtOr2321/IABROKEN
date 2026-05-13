// =========================
// API KEY GPT
// =========================

async function carregarApiKeyGPT() {

  try {

    const res =
      await fetch(
        "./gpt/apiKeyGPT.json"
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
              conversaAtual.mensagens.map(
                m =>
                  `${m.role === "user"
                    ? "Usuário"
                    : "IA"}: ${m.content}`
              ).join("\n"),

            max_output_tokens:
              500

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
// VOZ AZURE
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

    const apiKey =
      await carregarApiKeyGPT();

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
              apiKey,

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

  } catch (erro) {

    console.error(
      "ERRO VOZ AZURE:",
      erro
    );

  }

}