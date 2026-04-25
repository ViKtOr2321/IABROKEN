let conversaAtual = [];

// 🔹 ENVIAR MENSAGEM
async function enviarMensagem() {
  const input = document.getElementById("inputMensagem");
  const chatArea = document.getElementById("chatArea");

  const texto = input.value.trim();
  if (texto === "") return;

  if (conversaAtual.length === 0) {
    chatArea.innerHTML = "";
  }

  conversaAtual.push({ role: "user", content: texto });

  adicionarMensagem("usuario", texto);
  input.value = "";

  const thinkingMsg = adicionarMensagem("ia", "Pensando...");

  try {
    const resposta = await chamarIA();

    if (thinkingMsg && thinkingMsg.parentNode) {
      thinkingMsg.parentNode.removeChild(thinkingMsg);
    }

    conversaAtual.push({ role: "assistant", content: resposta });

    adicionarMensagem("ia", resposta);

  } catch (erro) {
    if (thinkingMsg && thinkingMsg.parentNode) {
      thinkingMsg.parentNode.removeChild(thinkingMsg);
    }

    adicionarMensagem("ia", "Erro ao conectar com a IA.");
    console.error("ERRO COMPLETO:", erro);
  }
}

// 🔹 ADICIONAR MENSAGEM
function adicionarMensagem(tipo, texto) {
  const chatArea = document.getElementById("chatArea");

  const msg = document.createElement("div");
  msg.classList.add("mensagem", tipo);
  msg.innerText = texto;

  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;

  return msg;
}

// 🔹 CARREGAR API KEY
async function carregarApiKey() {
  const response = await fetch("apiKey.json");
  const data = await response.json();
  return data.apiKey;
}

// 🔹 CHAMAR AZURE OPENAI
async function chamarIA() {
  const apiKey = await carregarApiKey();

  const endpoint = "https://georg-ml7854jc-swedencentral.cognitiveservices.azure.com";

  const response = await fetch(
    `${endpoint}/openai/responses?api-version=2025-04-01-preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        model: "gpt-5.2-chat", // ⚠️ use o nome do seu deployment
        input: conversaAtual
          .map(m => `${m.role === "user" ? "Usuário" : "IA"}: ${m.content}`)
          .join("\n"),
        max_output_tokens: 300
      })
    }
  );

  const data = await response.json();
  console.log("JSON PARSEADO:", data);

  if (!data.output) {
    console.error("ERRO API:", data);
    throw new Error("Erro na resposta da API");
  }

  // 🔥 EXTRAÇÃO CORRETA DA RESPOSTA
  const mensagem = data.output.find(item => item.type === "message");

  if (!mensagem || !mensagem.content || !mensagem.content.length) {
    throw new Error("Resposta inválida da IA");
  }

  const texto = mensagem.content.find(c => c.type === "output_text");

  return texto ? texto.text : "Sem resposta da IA";
}

// 🔹 ENTER PARA ENVIAR
document.getElementById("inputMensagem")
  .addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      enviarMensagem();
    }
});

// 🔹 NOVA CONVERSA
function novaConversa() {
  conversaAtual = [];
  document.getElementById("chatArea").innerHTML = "";
}

// 🔹 DARK MODE
function alternarTema() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("tema", "dark");
  } else {
    localStorage.setItem("tema", "light");
  }
}

// 🔹 CARREGAR TEMA
window.onload = function() {
  const tema = localStorage.getItem("tema");

  if (tema === "dark") {
    document.body.classList.add("dark");
  }
};