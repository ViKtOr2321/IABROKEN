let conversaAtual = [];

function enviarMensagem() {
  const input = document.getElementById("inputMensagem");
  const chatArea = document.getElementById("chatArea");

  const texto = input.value.trim();

  if (texto === "") return;

  // Se for a primeira mensagem → limpa chat (nova conversa)
  if (conversaAtual.length === 0) {
    chatArea.innerHTML = "";
  }

  conversaAtual.push({ tipo: "usuario", texto });

  adicionarMensagem("usuario", texto);

  input.value = "";

  setTimeout(() => {
    const resposta = gerarResposta(texto);

    conversaAtual.push({ tipo: "ia", texto: resposta });

    adicionarMensagem("ia", resposta);
  }, 500);
}

function adicionarMensagem(tipo, texto) {
  const chatArea = document.getElementById("chatArea");

  const msg = document.createElement("div");
  msg.classList.add("mensagem", tipo);
  msg.innerText = texto;

  chatArea.appendChild(msg);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function gerarResposta(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("casa")) return "Você quer comprar ou alugar uma casa?";
  if (texto.includes("apartamento")) return "Qual cidade você procura?";
  if (texto.includes("preço")) return "Qual seu orçamento?";

  return "Pode me dar mais detalhes?";
}

// Botão para nova conversa manual
function novaConversa() {
  conversaAtual = [];
  document.getElementById("chatArea").innerHTML = "";
}
document.getElementById("inputMensagem")
  .addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      enviarMensagem('chatArea.scrollTop = chatArea.scrollHeight;');
    }
});
function alternarTema() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("tema", "dark");
  } else {
    localStorage.setItem("tema", "light");
  }
}

window.onload = function() {
  const tema = localStorage.getItem("tema");

  if (tema === "dark") {
    document.body.classList.add("dark");
  }
};
