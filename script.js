let itemAtual = null;

/* =========================================
SALVAR
========================================= */

function salvarFicha(){

const dados = {};

document
.querySelectorAll("input")
.forEach((input,index)=>{

if(input.type === "file"){
return;
}

dados[`input_${index}`] =
input.value;

});

document
.querySelectorAll("textarea")
.forEach((textarea,index)=>{

dados[`textarea_${index}`] =
textarea.value;

});

const descricoes = [];

document
.querySelectorAll(".item-popup")
.forEach(item=>{

descricoes.push(
item.dataset.descricao || ""
);

});

dados.descricoes = descricoes;

[
"vantagensContainer",
"desvantagensContainer",
"periciasContainer",
"magiasContainer",
"itensContainer",
"equipamentosContainer",
"tiposDanoContainer",
"vantagemUnicaContainer",
"kitContainer"
]
.forEach(id=>{

const el =
document.getElementById(id);

if(el){

dados[id] = el.innerHTML;

}

});

localStorage.setItem(
"fichaRPG",
JSON.stringify(dados)
);

}

/* =========================================
RESTAURAR
========================================= */

function restaurarFicha(){

const dados = JSON.parse(
localStorage.getItem(
"fichaRPG"
)
);

if(!dados){
return;
}

[
"vantagensContainer",
"desvantagensContainer",
"periciasContainer",
"magiasContainer",
"itensContainer",
"equipamentosContainer",
"tiposDanoContainer",
"vantagemUnicaContainer",
"kitContainer"
]
.forEach(id=>{

if(dados[id]){

document.getElementById(id).innerHTML =
dados[id];

}

});

document
.querySelectorAll("input")
.forEach((input,index)=>{

if(input.type === "file"){
return;
}

const valor =
dados[`input_${index}`];

if(valor !== undefined){

input.value = valor;

}

});

document
.querySelectorAll("textarea")
.forEach((textarea,index)=>{

const valor =
dados[`textarea_${index}`];

if(valor !== undefined){

textarea.value = valor;

}

});

document
.querySelectorAll(".item-popup")
.forEach((item,index)=>{

if(
dados.descricoes &&
dados.descricoes[index]
){

item.dataset.descricao =
dados.descricoes[index];

}

});

reativarEventos();

}

/* =========================================
ABAS
========================================= */

function abrirAba(
event,
id
){

document
.querySelectorAll(".aba-conteudo")
.forEach(aba=>{

aba.classList.remove(
"ativa"
);

});

document
.querySelectorAll(".aba-btn")
.forEach(btn=>{

btn.classList.remove(
"ativa"
);

});

document
.getElementById(id)
.classList.add(
"ativa"
);

event.currentTarget
.classList.add(
"ativa"
);

}

/* =========================================
EVENTOS
========================================= */

function reativarEventos(){

document
.querySelectorAll(".excluir-btn-item")
.forEach(btn=>{

btn.onclick = function(){

btn.parentElement.remove();

salvarFicha();

};

});

document
.querySelectorAll(".editar-btn")
.forEach(btn=>{

btn.onclick = function(){

abrirEditor(
btn.parentElement
);

};

});

document
.querySelectorAll(".abrir-btn")
.forEach(btn=>{

btn.onclick = function(){

const bloco =
btn.parentElement;

const nome =
bloco.querySelector("input")?.value
||
"Descrição";

abrirPopup(
nome,
bloco.dataset.descricao
||
"Sem descrição"
);

};

});

document
.querySelectorAll(".excluir-kit")
.forEach(btn=>{

btn.onclick = function(){

btn.closest(".kit-item").remove();

salvarFicha();

};

});

document
.querySelectorAll("input, textarea")
.forEach(el=>{

el.addEventListener(
"input",
salvarFicha
);

});

}

/* =========================================
AVATAR
========================================= */

const inputImagem =
document.getElementById(
"uploadImagem"
);

const preview =
document.getElementById(
"preview"
);

const avatarSalvo =
localStorage.getItem(
"avatar"
);

if(avatarSalvo){

preview.src = avatarSalvo;

}

inputImagem.addEventListener(
"change",
function(event){

const arquivo =
event.target.files[0];

if(!arquivo){
return;
}

const leitor =
new FileReader();

leitor.onload = function(e){

preview.src =
e.target.result;

localStorage.setItem(
"avatar",
e.target.result
);

salvarFicha();

};

leitor.readAsDataURL(
arquivo
);

}
);

/* =========================================
POPUPS
========================================= */

function abrirPopup(
titulo,
texto
){

document.getElementById(
"popupTitulo"
).innerText = titulo;

document.getElementById(
"popupTexto"
).innerText = texto;

document.getElementById(
"popup"
).classList.remove(
"oculto"
);

}

function fecharPopup(){

document.getElementById(
"popup"
).classList.add(
"oculto"
);

}

function abrirEditor(item){

itemAtual = item;

document.getElementById(
"editorTexto"
).value =
item.dataset.descricao
||
"";

document.getElementById(
"popupEditor"
).classList.remove(
"oculto"
);

}

function fecharEditor(){

document.getElementById(
"popupEditor"
).classList.add(
"oculto"
);

}

function salvarDescricao(){

if(itemAtual){

itemAtual.dataset.descricao =
document.getElementById(
"editorTexto"
).value;

}

salvarFicha();

fecharEditor();

}

/* =========================================
DADO
========================================= */

function animarDado(){

const dado =
document.getElementById(
"dice3d"
);

dado.classList.remove(
"rolando"
);

void dado.offsetWidth;

dado.classList.add(
"rolando"
);

}

/* =========================================
ROLAGEM DE ATRIBUTO
========================================= */

function testarAtributo(
nome,
atributoId,
bonusId
){

animarDado();

const dado =
Math.floor(
Math.random()*6
)+1;

const atributo =
parseInt(
document.getElementById(
atributoId
).value
)||0;

const bonus =
parseInt(
document.getElementById(
bonusId
).value
)||0;

const total =
atributo + bonus + dado;

document.getElementById(
"resultado"
).innerHTML = `

<b>${nome}</b>

<br><br>

🎲 ${dado}

<br>

📌 ${atributo}

<br>

➕ ${bonus}

<br><br>

🧮 ${total}

`;

}

/* =========================================
ATAQUE CURTO
========================================= */

function ataqueCurto(){

animarDado();

const dado =
Math.floor(Math.random()*6)+1;

let f =
parseInt(
document.getElementById("forca").value
)||0;

let bonus =
parseInt(
document.getElementById("bonusForca").value
)||0;

const h =
parseInt(
document.getElementById("habilidade").value
)||0;

let critico = "";

if(dado === 6){

f = f * 2;

bonus = bonus * 2;

critico = `

<br><br>

🔥 <b>CRÍTICO!</b>

<br>

Força e bônus dobrados!

`;

}

const total =
dado + f + bonus + h;

document.getElementById(
"resultado"
).innerHTML = `

⚔️ <b>Ataque Curto</b>

<br><br>

🎲 ${dado}

<br>

💪 ${f}

<br>

➕ ${bonus}

<br>

🎯 ${h}

${critico}

<br><br>

🧮 ${total}

`;

}

/* =========================================
ATAQUE DISTÂNCIA
========================================= */

function ataqueDistancia(){

animarDado();

const dado =
Math.floor(Math.random()*6)+1;

let pdf =
parseInt(
document.getElementById("pdf").value
)||0;

let bonus =
parseInt(
document.getElementById("bonusPdf").value
)||0;

const h =
parseInt(
document.getElementById("habilidade").value
)||0;

let critico = "";

if(dado === 6){

pdf = pdf * 2;

bonus = bonus * 2;

critico = `

<br><br>

🔥 <b>CRÍTICO!</b>

<br>

PdF e bônus dobrados!

`;

}

const total =
dado + pdf + bonus + h;

document.getElementById(
"resultado"
).innerHTML = `

🏹 <b>Ataque Distância</b>

<br><br>

🎲 ${dado}

<br>

💥 ${pdf}

<br>

➕ ${bonus}

<br>

🎯 ${h}

${critico}

<br><br>

🧮 ${total}

`;

}

/* =========================================
DEFESA
========================================= */

function defesa(){

animarDado();

const dado =
Math.floor(Math.random()*6)+1;

let armadura =
parseInt(
document.getElementById("armadura").value
)||0;

let bonus =
parseInt(
document.getElementById("bonusArmadura").value
)||0;

const h =
parseInt(
document.getElementById("habilidade").value
)||0;

let critico = "";

if(dado === 6){

armadura = armadura * 2;

bonus = bonus * 2;

critico = `

<br><br>

🔥 <b>CRÍTICO!</b>

<br>

Armadura e bônus dobrados!

`;

}

const total =
dado + armadura + bonus + h;

document.getElementById(
"resultado"
).innerHTML = `

🛡️ <b>Defesa</b>

<br><br>

🎲 ${dado}

<br>

🛡️ ${armadura}

<br>

➕ ${bonus}

<br>

🎯 ${h}

${critico}

<br><br>

🧮 ${total}

`;

}

/* =========================================
ADICIONAR ITEM
========================================= */

function adicionarItem(
containerId,
tipo
){

const container =
document.getElementById(
containerId
);

/* LIMITE VANTAGEM ÚNICA */

if(
containerId ===
"vantagemUnicaContainer"
&&
container.children.length >= 1
){
return;
}

const bloco =
document.createElement(
"div"
);

bloco.className =
"item-popup";

const placeholder =
tipo === "vantagem única"
?
"Vantagem Única"
:
"Nome";

bloco.innerHTML = `

<input
type="text"
placeholder="${placeholder}"
>

<input
type="number"
value="0"
min="0"
class="custo"
>

<button class="popup-btn editar-btn">
✏️
</button>

<button class="popup-btn abrir-btn">
📖
</button>

<button class="popup-btn excluir-btn-item">
❌
</button>

`;

container.appendChild(
bloco
);

reativarEventos();

salvarFicha();

}

/* =========================================
TIPOS DE DANO
========================================= */

function adicionarTipoDano(){

adicionarItem(
"tiposDanoContainer",
"tipo dano"
);

}

/* =========================================
KIT
========================================= */

function adicionarKit(){

const container =
document.getElementById(
"kitContainer"
);

const kit =
document.createElement(
"div"
);

kit.className =
"kit-item";

kit.innerHTML = `

<div class="kit-linha">

<input
type="text"
placeholder="Nome do Kit"
>

<input
type="number"
value="0"
min="0"
class="kit-custo"
>

</div>

<div class="item-popup">

<input
type="text"
placeholder="Descrição 1"
>

<button class="popup-btn editar-btn">
✏️
</button>

<button class="popup-btn abrir-btn">
📖
</button>

</div>

<div class="item-popup">

<input
type="text"
placeholder="Descrição 2"
>

<button class="popup-btn editar-btn">
✏️
</button>

<button class="popup-btn abrir-btn">
📖
</button>

</div>

<div class="item-popup">

<input
type="text"
placeholder="Descrição 3"
>

<button class="popup-btn editar-btn">
✏️
</button>

<button class="popup-btn abrir-btn">
📖
</button>

</div>

<button class="add-btn excluir-kit">

❌ Excluir Kit

</button>

`;

container.appendChild(
kit
);

reativarEventos();

salvarFicha();

}

/* =========================================
INICIALIZAÇÃO
========================================= */

restaurarFicha();

reativarEventos();

if(
document.getElementById(
"vantagensContainer"
).children.length === 0
){

for(let i=0;i<3;i++){

adicionarItem(
"vantagensContainer",
"vantagem"
);

adicionarItem(
"desvantagensContainer",
"desvantagem"
);

adicionarItem(
"periciasContainer",
"pericia"
);

adicionarItem(
"magiasContainer",
"magia"
);

adicionarItem(
"itensContainer",
"item"
);

adicionarItem(
"equipamentosContainer",
"equipamento"
);

}

adicionarTipoDano();

adicionarItem(
"vantagemUnicaContainer",
"vantagem única"
);

}