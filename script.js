import OBR from "@owlbear-rodeo/sdk";

// =========================================
// VARIÁVEIS GLOBAIS
// =========================================
let currentCharacterId = null;
let isGM = false;
let currentPlayerId = null;
let allCharacters = {};
let hideMyRolls = false;
let itemAtual = null;

// =========================================
// INICIALIZAÇÃO COM OWLEEAR SDK
// =========================================
async function init() {
    await OBR.onReady();
    
    // Verificar se é mestre (HOST)
    const role = await OBR.room.getRole();
    isGM = (role === "HOST");
    
    // Obter ID do jogador atual
    const player = await OBR.player.get();
    currentPlayerId = player.id;
    
    // Configurar interface baseada no papel
    setupInterface();
    
    // Carregar dados
    await loadAllData();
    
    // Configurar listeners
    setupListeners();
    
    // Configurar botão de dado genérico
    document.getElementById("btnRolarDadoGenerico")?.addEventListener("click", () => rolarDadoGenerico());
    
    // Configurar checkbox de ocultar rolagens (só mestre)
    const ocultarCheck = document.getElementById("ocultarRolagensMestre");
    if (ocultarCheck && isGM) {
        ocultarCheck.addEventListener("change", (e) => {
            hideMyRolls = e.target.checked;
        });
    }
}

// =========================================
// CONFIGURAR INTERFACE
// =========================================
function setupInterface() {
    const painelMestre = document.getElementById("painelMestre");
    const modoIndicator = document.getElementById("modoIndicator");
    
    if (isGM) {
        painelMestre.style.display = "block";
        modoIndicator.innerHTML = "👑 Modo: MESTRE - Você pode editar todas as fichas";
        modoIndicator.style.background = "#4a3d25";
        
        // Configurar criação de personagem
        document.getElementById("btnCriarPersonagem")?.addEventListener("click", criarNovoPersonagem);
        document.getElementById("listaPersonagens")?.addEventListener("change", (e) => {
            if (e.target.value) {
                carregarPersonagem(e.target.value);
            }
        });
    } else {
        painelMestre.style.display = "none";
        modoIndicator.innerHTML = "🎮 Modo: JOGADOR - Você só vê sua própria ficha";
        modoIndicator.style.background = "#2a4a2a";
        
        // Jogador não pode criar personagens
        const btnCriar = document.getElementById("btnCriarPersonagem");
        if (btnCriar) btnCriar.style.display = "none";
    }
}

// =========================================
// CARREGAR DADOS DO OWLEEAR
// =========================================
async function loadAllData() {
    try {
        // Carregar todos os personagens do storage da sala
        const storage = await OBR.room.getStorage();
        allCharacters = storage.characters || {};
        
        if (isGM) {
            // Mestre vê todos os personagens
            updateCharacterList();
            if (Object.keys(allCharacters).length > 0) {
                const firstId = Object.keys(allCharacters)[0];
                await carregarPersonagem(firstId);
            } else {
                // Nenhum personagem, criar um padrão?
                await criarNovoPersonagem();
            }
        } else {
            // Jogador: encontrar seu personagem
            let myCharacter = null;
            for (const [id, char] of Object.entries(allCharacters)) {
                if (char.ownerId === currentPlayerId) {
                    myCharacter = { id, ...char };
                    break;
                }
            }
            
            if (myCharacter) {
                await carregarPersonagem(myCharacter.id);
            } else {
                // Jogador sem personagem, aguardar mestre criar um para ele
                document.getElementById("selecionarPersonagemJogador").style.display = "block";
                document.getElementById("nomePersonagemSelecionado").innerText = "Aguardando mestre criar seu personagem...";
                // Desabilitar campos
                enableAllFields(false);
            }
        }
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// =========================================
// ATUALIZAR LISTA DE PERSONAGENS (MESTRE)
// =========================================
function updateCharacterList() {
    const select = document.getElementById("listaPersonagens");
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um personagem</option>';
    
    for (const [id, char] of Object.entries(allCharacters)) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${char.nome || "Sem nome"} (${char.ownerId === currentPlayerId ? "Você" : "Jogador"})`;
        select.appendChild(option);
    }
}

// =========================================
// CRIAR NOVO PERSONAGEM
// =========================================
async function criarNovoPersonagem() {
    const newId = `char_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const novoPersonagem = {
        nome: "Novo Personagem",
        ownerId: currentPlayerId,
        avatar: "",
        atributos: {
            forca: 0, bonusForca: 0,
            habilidade: 0, bonusHabilidade: 0,
            resistencia: 0, bonusResistencia: 0,
            armadura: 0, bonusArmadura: 0,
            pdf: 0, bonusPdf: 0,
            pvTotal: 0, pvAtual: 0,
            pmTotal: 0, pmAtual: 0,
            pontos: 10, xp: 0, dinheiro: 0
        },
        vantagemUnica: [],
        vantagens: [],
        desvantagens: [],
        pericias: [],
        magias: [],
        itens: [],
        equipamentos: [],
        tiposDano: [],
        kits: [],
        historico: []
    };
    
    allCharacters[newId] = novoPersonagem;
    await salvarTodosPersonagens();
    
    if (isGM) {
        updateCharacterList();
        await carregarPersonagem(newId);
    }
}

// =========================================
// CARREGAR PERSONAGEM
// =========================================
async function carregarPersonagem(characterId) {
    currentCharacterId = characterId;
    const character = allCharacters[characterId];
    if (!character) return;
    
    // Verificar permissão de edição
    const canEdit = isGM || character.ownerId === currentPlayerId;
    
    // Preencher campos
    document.getElementById("nomePersonagemInput").value = character.nome || "";
    if (character.avatar) {
        document.getElementById("preview").src = character.avatar;
    }
    
    // Atributos
    document.getElementById("forca").value = character.atributos?.forca || 0;
    document.getElementById("bonusForca").value = character.atributos?.bonusForca || 0;
    document.getElementById("habilidade").value = character.atributos?.habilidade || 0;
    document.getElementById("bonusHabilidade").value = character.atributos?.bonusHabilidade || 0;
    document.getElementById("resistencia").value = character.atributos?.resistencia || 0;
    document.getElementById("bonusResistencia").value = character.atributos?.bonusResistencia || 0;
    document.getElementById("armadura").value = character.atributos?.armadura || 0;
    document.getElementById("bonusArmadura").value = character.atributos?.bonusArmadura || 0;
    document.getElementById("pdf").value = character.atributos?.pdf || 0;
    document.getElementById("bonusPdf").value = character.atributos?.bonusPdf || 0;
    document.getElementById("pvTotal").value = character.atributos?.pvTotal || 0;
    document.getElementById("pvAtual").value = character.atributos?.pvAtual || 0;
    document.getElementById("pmTotal").value = character.atributos?.pmTotal || 0;
    document.getElementById("pmAtual").value = character.atributos?.pmAtual || 0;
    document.getElementById("pontosPersonagem").value = character.atributos?.pontos || 10;
    document.getElementById("xp").value = character.atributos?.xp || 0;
    document.getElementById("dinheiro").value = character.atributos?.dinheiro || 0;
    
    // Carregar listas
    carregarLista("vantagemUnicaContainer", character.vantagemUnica || [], "vantagem única");
    carregarLista("vantagensContainer", character.vantagens || [], "vantagem");
    carregarLista("desvantagensContainer", character.desvantagens || [], "desvantagem");
    carregarLista("periciasContainer", character.pericias || [], "pericia");
    carregarLista("magiasContainer", character.magias || [], "magia");
    carregarLista("itensContainer", character.itens || [], "item");
    carregarLista("equipamentosContainer", character.equipamentos || [], "equipamento");
    carregarLista("tiposDanoContainer", character.tiposDano || [], "tipo dano");
    carregarKits(character.kits || []);
    
    // Carregar histórico
    const historico = document.getElementById("resultado");
    if (historico && character.historico) {
        historico.innerHTML = character.historico.join("");
    }
    
    // Habilitar/desabilitar campos
    enableAllFields(canEdit);
    
    // Para jogador, mostrar qual personagem está usando
    if (!isGM) {
        document.getElementById("selecionarPersonagemJogador").style.display = "block";
        document.getElementById("nomePersonagemSelecionado").innerText = character.nome || "Sem nome";
    }
    
    // Configurar listeners de auto-salvamento
    setupAutoSave();
}

// =========================================
// CARREGAR LISTA GENÉRICA
// =========================================
function carregarLista(containerId, itens, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";
    itens.forEach((item, index) => {
        const bloco = document.createElement("div");
        bloco.className = "item-popup";
        bloco.innerHTML = `
            <input type="text" placeholder="${tipo === 'vantagem única' ? 'Vantagem Única' : 'Nome'}" value="${item.nome || ''}">
            <input type="number" value="${item.custo || 0}" min="-5" class="custo">
            <button class="popup-btn editar-btn" data-index="${index}">✏️</button>
            <button class="popup-btn abrir-btn" data-index="${index}">📖</button>
            <button class="popup-btn excluir-btn-item" data-index="${index}">❌</button>
        `;
        bloco.dataset.descricao = item.descricao || "";
        container.appendChild(bloco);
    });
    
    // Reativar eventos dos botões
    reativarEventosContainer(containerId, tipo);
}

// =========================================
// CARREGAR KITS
// =========================================
function carregarKits(kits) {
    const container = document.getElementById("kitContainer");
    if (!container) return;
    
    container.innerHTML = "";
    kits.forEach((kit, index) => {
        const kitDiv = document.createElement("div");
        kitDiv.className = "kit-item";
        kitDiv.innerHTML = `
            <div class="kit-linha">
                <input type="text" placeholder="Nome do Kit" value="${kit.nome || ''}">
                <input type="number" value="${kit.custo || 0}" min="0" class="kit-custo">
            </div>
            ${kit.descricoes.map((desc, i) => `
                <div class="item-popup">
                    <input type="text" placeholder="Descrição ${i+1}" value="${desc.texto || ''}">
                    <button class="popup-btn editar-btn" data-desc-index="${i}">✏️</button>
                    <button class="popup-btn abrir-btn" data-desc-index="${i}">📖</button>
                </div>
            `).join('')}
            <button class="excluir-kit" data-index="${index}">❌ Excluir Kit</button>
        `;
        container.appendChild(kitDiv);
    });
}

// =========================================
// SALVAR TODOS PERSONAGENS
// =========================================
async function salvarTodosPersonagens() {
    await OBR.room.setStorage({ characters: allCharacters });
}

// =========================================
// SALVAR PERSONAGEM ATUAL
// =========================================
async function salvarPersonagemAtual() {
    if (!currentCharacterId) return;
    
    const character = allCharacters[currentCharacterId];
    if (!character) return;
    
    // Salvar nome e avatar
    character.nome = document.getElementById("nomePersonagemInput").value;
    
    // Salvar atributos
    character.atributos = {
        forca: parseInt(document.getElementById("forca").value) || 0,
        bonusForca: parseInt(document.getElementById("bonusForca").value) || 0,
        habilidade: parseInt(document.getElementById("habilidade").value) || 0,
        bonusHabilidade: parseInt(document.getElementById("bonusHabilidade").value) || 0,
        resistencia: parseInt(document.getElementById("resistencia").value) || 0,
        bonusResistencia: parseInt(document.getElementById("bonusResistencia").value) || 0,
        armadura: parseInt(document.getElementById("armadura").value) || 0,
        bonusArmadura: parseInt(document.getElementById("bonusArmadura").value) || 0,
        pdf: parseInt(document.getElementById("pdf").value) || 0,
        bonusPdf: parseInt(document.getElementById("bonusPdf").value) || 0,
        pvTotal: parseInt(document.getElementById("pvTotal").value) || 0,
        pvAtual: parseInt(document.getElementById("pvAtual").value) || 0,
        pmTotal: parseInt(document.getElementById("pmTotal").value) || 0,
        pmAtual: parseInt(document.getElementById("pmAtual").value) || 0,
        pontos: parseInt(document.getElementById("pontosPersonagem").value) || 10,
        xp: parseInt(document.getElementById("xp").value) || 0,
        dinheiro: parseInt(document.getElementById("dinheiro").value) || 0
    };
    
    // Salvar listas
    character.vantagemUnica = extrairLista("vantagemUnicaContainer");
    character.vantagens = extrairLista("vantagensContainer");
    character.desvantagens = extrairLista("desvantagensContainer");
    character.pericias = extrairLista("periciasContainer");
    character.magias = extrairLista("magiasContainer");
    character.itens = extrairLista("itensContainer");
    character.equipamentos = extrairLista("equipamentosContainer");
    character.tiposDano = extrairLista("tiposDanoContainer");
    character.kits = extrairKits();
    
    // Salvar histórico (como array de strings HTML)
    const historicoDiv = document.getElementById("resultado");
    if (historicoDiv) {
        character.historico = Array.from(historicoDiv.children).map(child => child.outerHTML);
    }
    
    await salvarTodosPersonagens();
}

// =========================================
// EXTRAIR LISTA GENÉRICA
// =========================================
function extrairLista(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    const itens = [];
    const blocos = container.children;
    
    for (let i = 0; i < blocos.length; i++) {
        const bloco = blocos[i];
        const inputs = bloco.querySelectorAll("input");
        const nome = inputs[0]?.value || "";
        const custo = parseInt(inputs[1]?.value) || 0;
        const descricao = bloco.dataset.descricao || "";
        
        itens.push({ nome, custo, descricao });
    }
    
    return itens;
}

// =========================================
// EXTRAIR KITS
// =========================================
function extrairKits() {
    const container = document.getElementById("kitContainer");
    if (!container) return [];
    
    const kits = [];
    const kitDivs = container.children;
    
    for (let i = 0; i < kitDivs.length; i++) {
        const kitDiv = kitDivs[i];
        const nome = kitDiv.querySelector(".kit-linha input[type='text']")?.value || "";
        const custo = parseInt(kitDiv.querySelector(".kit-custo")?.value) || 0;
        
        const descricoes = [];
        const descDivs = kitDiv.querySelectorAll(".item-popup");
        for (let j = 0; j < descDivs.length; j++) {
            const descDiv = descDivs[j];
            const texto = descDiv.querySelector("input")?.value || "";
            const descricao = descDiv.dataset.descricao || "";
            descricoes.push({ texto, descricao });
        }
        
        kits.push({ nome, custo, descricoes });
    }
    
    return kits;
}

// =========================================
// ROLAR DADO E COMPARTILHAR
// =========================================
async function rolarDado(mensagem, resultadoNumerico = null) {
    const heroi = document.getElementById("nomePersonagemInput").value || "Personagem";
    const isGMRoll = isGM;
    
    // Verificar se deve ocultar
    if (isGMRoll && hideMyRolls) {
        // Só mostra para o mestre
        adicionarAoHistoricoLocal(mensagem);
    } else {
        // Compartilhar com todos
        await OBR.broadcast.sendMessage("roll", {
            characterName: heroi,
            message: mensagem,
            timestamp: Date.now()
        });
        adicionarAoHistoricoLocal(mensagem);
    }
    
    animarDado();
}

function adicionarAoHistoricoLocal(conteudoHtml) {
    const historico = document.getElementById("resultado");
    if (!historico) return;
    
    const card = document.createElement("div");
    card.className = "historico-card";
    card.innerHTML = conteudoHtml;
    
    historico.appendChild(card);
    historico.scrollTop = historico.scrollHeight;
    
    salvarPersonagemAtual();
}

// Função compartilhada para o histórico (global)
window.adicionarAoHistorico = function(conteudoHtml) {
    adicionarAoHistoricoLocal(conteudoHtml);
};

window.limparHistorico = function() {
    const historico = document.getElementById("resultado");
    if (historico) {
        historico.innerHTML = "";
        salvarPersonagemAtual();
    }
};

// =========================================
// ROLAGENS EXISTENTES (Adaptadas)
// =========================================
window.testarAtributo = function(nome, atributoId, bonusId) {
    const heroi = document.getElementById("nomePersonagemInput").value || "Personagem";
    const dado = Math.floor(Math.random()*6)+1;
    const atributo = parseInt(document.getElementById(atributoId).value)||0;
    const bonus = parseInt(document.getElementById(bonusId).value)||0;
    const alvo = atributo + bonus;
    const sucesso = dado <= alvo;
    
    animarDado();
    
    const htmlResultado = `
        <span style="color:#d9b97d; font-size:11px;"><b>[${heroi}]</b></span><br>
        <b>🎲 Teste de ${nome}</b><br>
        Resultado: <b>${dado}</b> (Alvo: ${alvo})<br>
        <span style="font-size: 11px; color: #aaa;">Atributo: ${atributo} | Bônus: ${bonus}</span><br>
        ${sucesso ? "<span style='color: #4cd137;'>✅ <b>SUCESSO</b></span>" : "<span style='color: #e84118;'>❌ <b>FALHA</b></span>"}
    `;
    
    rolarDado(htmlResultado);
};

window.ataqueCurto = function() {
    const heroi = document.getElementById("nomePersonagemInput").value || "Personagem";
    const dado = Math.floor(Math.random()*6)+1;
    let f = parseInt(document.getElementById("forca").value)||0;
    let bonus = parseInt(document.getElementById("bonusForca").value)||0;
    const h = parseInt(document.getElementById("habilidade").value)||0;
    let critico = "";
    
    animarDado();
    
    if(dado === 6){
        f = f * 2;
        bonus = bonus * 2;
        critico = " 🔥 <b>CRÍTICO!</b>";
    }
    
    const total = dado + f + bonus + h;
    
    const htmlResultado = `
        <span style="color:#d9b97d; font-size:11px;"><b>[${heroi}]</b></span><br>
        <b>⚔️ Ataque Curto</b>${critico}<br>
        Total (FA): <b>${total}</b><br>
        <span style="font-size: 11px; color: #aaa;">Dado [${dado}] + F [${f}] + H [${h}] + Mod [${bonus}]</span>
    `;
    
    rolarDado(htmlResultado);
};

window.ataqueDistancia = function() {
    const heroi = document.getElementById("nomePersonagemInput").value || "Personagem";
    const dado = Math.floor(Math.random()*6)+1;
    let pdf = parseInt(document.getElementById("pdf").value)||0;
    let bonus = parseInt(document.getElementById("bonusPdf").value)||0;
    const h = parseInt(document.getElementById("habilidade").value)||0;
    let critico = "";
    
    animarDado();
    
    if(dado === 6){
        pdf = pdf * 2;
        bonus = bonus * 2;
        critico = " 🔥 <b>CRÍTICO!</b>";
    }
    
    const total = dado + pdf + bonus + h;
    
    const htmlResultado = `
        <span style="color:#d9b97d; font-size:11px;"><b>[${heroi}]</b></span><br>
        <b>🏹 Ataque à Distância</b>${critico}<br>
        Total (FA): <b>${total}</b><br>
        <span style="font-size: 11px; color: #aaa;">Dado [${dado}] + PdF [${pdf}] + H [${h}] + Mod [${bonus}]</span>
    `;
    
    rolarDado(htmlResultado);
};

window.defesa = function() {
    const heroi = document.getElementById("nomePersonagemInput").value || "Personagem";
    const dado = Math.floor(Math.random()*6)+1;
    let armadura = parseInt(document.getElementById("armadura").value)||0;
    let bonus = parseInt(document.getElementById("bonusArmadura").value)||0;
    const h = parseInt(document.getElementById("habilidade").value)||0;
    let critico = "";
    
    animarDado();
    
    if(dado === 6){
        armadura = armadura * 2;
        bonus = bonus * 2;
        critico = " 🔥 <b>CRÍTICO!</b>";
    }
    
    const total = dado + armadura + bonus + h;
    
    const htmlResultado = `
        <span style="color:#d9b97d; font-size:11px;"><b>[${heroi}]</b></span><br>
        <b>🛡️ Defesa</b>${critico}<br>
        Total (FD): <b>${total}</b><br>
        <span style="font-size: 11px; color: #aaa;">Dado [${dado}] + A [${armadura}] + H [${h}] + Mod [${bonus}]</span>
    `;
    
    rolarDado(htmlResultado);
};

// =========================================
// DADO GENÉRICO CUSTOMIZÁVEL
// =========================================
function rolarDadoGenerico() {
    const input = document.getElementById("dadoCustomizavel");
    const expressao = input.value.trim();
    const heroi = document.getElementById("nomePersonagemInput").value || "Personagem";
    
    if (!expressao) return;
    
    animarDado();
    
    try {
        // Parse de expressões como "2d6", "1d20+3", "3d8-2"
        const resultado = resolverExpressaoDado(expressao);
        
        const htmlResultado = `
            <span style="color:#d9b97d; font-size:11px;"><b>[${heroi}]</b></span><br>
            <b>🎲 Dado Genérico: ${expressao}</b><br>
            Resultado: <b>${resultado}</b>
        `;
        
        rolarDado(htmlResultado);
    } catch (e) {
        const htmlResultado = `
            <span style="color:#d9b97d; font-size:11px;"><b>[${heroi}]</b></span><br>
            <b>🎲 Dado Inválido: ${expressao}</b><br>
            <span style="color: #e84118;">❌ Formato inválido (use ex: 1d6, 2d20+3)</span>
        `;
        rolarDado(htmlResultado);
    }
}

function resolverExpressaoDado(expressao) {
    // Regex para formatos como "3d6", "1d20+5", "2d8-2"
    const match = expressao.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) throw new Error("Formato inválido");
    
    const quantidade = parseInt(match[1]);
    const lados = parseInt(match[2]);
    const modificador = match[3] ? parseInt(match[3]) : 0;
    
    let total = 0;
    for (let i = 0; i < quantidade; i++) {
        total += Math.floor(Math.random() * lados) + 1;
    }
    total += modificador;
    
    return total;
}

// =========================================
// LISTAS DINÂMICAS
// =========================================
window.adicionarItem = function(containerId, tipo) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    if(containerId === "vantagemUnicaContainer" && container.children.length >= 1){
        return;
    }
    
    const bloco = document.createElement("div");
    bloco.className = "item-popup";
    const placeholder = tipo === "vantagem única" ? "Vantagem Única" : "Nome";
    
    bloco.innerHTML = `
        <input type="text" placeholder="${placeholder}">
        <input type="number" value="0" min="-5" class="custo">
        <button class="popup-btn editar-btn">✏️</button>
        <button class="popup-btn abrir-btn">📖</button>
        <button class="popup-btn excluir-btn-item">❌</button>
    `;
    
    container.appendChild(bloco);
    reativarEventosContainer(containerId, tipo);
    salvarPersonagemAtual();
};

window.adicionarTipoDano = function() {
    window.adicionarItem("tiposDanoContainer", "tipo dano");
};

window.adicionarKit = function() {
    const container = document.getElementById("kitContainer");
    if(!container) return;
    
    const kit = document.createElement("div");
    kit.className = "kit-item";
    
    kit.innerHTML = `
        <div class="kit-linha">
            <input type="text" placeholder="Nome do Kit">
            <input type="number" value="0" min="0" class="kit-custo">
        </div>
        <div class="item-popup">
            <input type="text" placeholder="Descrição 1">
            <button class="popup-btn editar-btn">✏️</button>
            <button class="popup-btn abrir-btn">📖</button>
        </div>
        <div class="item-popup">
            <input type="text" placeholder="Descrição 2">
            <button class="popup-btn editar-btn">✏️</button>
            <button class="popup-btn abrir-btn">📖</button>
        </div>
        <div class="item-popup">
            <input type="text" placeholder="Descrição 3">
            <button class="popup-btn editar-btn">✏️</button>
            <button class="popup-btn abrir-btn">📖</button>
        </div>
        <button class="excluir-kit">❌ Excluir Kit</button>
    `;
    
    container.appendChild(kit);
    reativarEventosKit(kit);
    salvarPersonagemAtual();
};

// =========================================
// REATIVAR EVENTOS
// =========================================
function reativarEventosContainer(containerId, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.querySelectorAll(".excluir-btn-item").forEach(btn => {
        btn.onclick = () => {
            btn.parentElement.remove();
            salvarPersonagemAtual();
        };
    });
    
    container.querySelectorAll(".editar-btn").forEach(btn => {
        btn.onclick = () => {
            itemAtual = btn.parentElement;
            abrirEditor();
        };
    });
    
    container.querySelectorAll(".abrir-btn").forEach(btn => {
        btn.onclick = () => {
            const bloco = btn.parentElement;
            const nome = bloco.querySelector("input")?.value || "Descrição";
            abrirPopup(nome, bloco.dataset.descricao || "Sem descrição");
        };
    });
}

function reativarEventosKit(kitDiv) {
    kitDiv.querySelectorAll(".excluir-kit").forEach(btn => {
        btn.onclick = () => {
            kitDiv.remove();
            salvarPersonagemAtual();
        };
    });
    
    kitDiv.querySelectorAll(".editar-btn").forEach(btn => {
        btn.onclick = () => {
            itemAtual = btn.parentElement;
            abrirEditor();
        };
    });
    
    kitDiv.querySelectorAll(".abrir-btn").forEach(btn => {
        btn.onclick = () => {
            const bloco = btn.parentElement;
            const nome = bloco.querySelector("input")?.value || "Descrição";
            abrirPopup(nome, bloco.dataset.descricao || "Sem descrição");
        };
    });
}

// =========================================
// POPUPS
// =========================================
function abrirPopup(titulo, texto){
    document.getElementById("popupTitulo").innerText = titulo;
    document.getElementById("popupTexto").innerText = texto;
    document.getElementById("popup").classList.remove("oculto");
}

window.fecharPopup = function() {
    document.getElementById("popup").classList.add("oculto");
};

function abrirEditor(){
    document.getElementById("editorTexto").value = itemAtual?.dataset.descricao || "";
    document.getElementById("popupEditor").classList.remove("oculto");
}

window.fecharEditor = function() {
    document.getElementById("popupEditor").classList.add("oculto");
};

window.salvarDescricao = function() {
    if(itemAtual){
        itemAtual.dataset.descricao = document.getElementById("editorTexto").value;
    }
    salvarPersonagemAtual();
    window.fecharEditor();
};

// =========================================
// AVATAR
// =========================================
const inputImagem = document.getElementById("uploadImagem");
const preview = document.getElementById("preview");

if (inputImagem) {
    inputImagem.addEventListener("change", function(event){
        const arquivo = event.target.files[0];
        if(!arquivo) return;
        
        const leitor = new FileReader();
        leitor.onload = async function(e){
            preview.src = e.target.result;
            if (currentCharacterId && allCharacters[currentCharacterId]) {
                allCharacters[currentCharacterId].avatar = e.target.result;
                await salvarTodosPersonagens();
            }
        };
        leitor.readAsDataURL(arquivo);
    });
}

// =========================================
// AUTO-SAVE
// =========================================
function setupAutoSave() {
    const inputs = document.querySelectorAll("input, textarea");
    inputs.forEach(el => {
        el.removeEventListener("input", salvarPersonagemAtual);
        el.addEventListener("input", salvarPersonagemAtual);
    });
}

function enableAllFields(enabled) {
    const inputs = document.querySelectorAll("input, textarea, button:not(.teste-btn):not(#btnRolarDadoGenerico)");
    inputs.forEach(el => {
        if (el.type !== "file") {
            el.disabled = !enabled;
        }
    });
    
    // Botões de teste sempre habilitados (rolagem não depende de edição)
    document.querySelectorAll(".teste-btn, #btnRolarDadoGenerico").forEach(btn => {
        btn.disabled = false;
    });
}

// =========================================
// ANIMAÇÃO DADO
// =========================================
function animarDado(){
    const dado = document.getElementById("dice3d");
    if (!dado) return;
    dado.classList.remove("rolando");
    void dado.offsetWidth;
    dado.classList.add("rolando");
}

// =========================================
// RECEBER MENSAGENS BROADCAST
// =========================================
OBR.broadcast.onMessage("roll", (message) => {
    adicionarAoHistoricoLocal(message.data.message);
});

// =========================================
// ABAS
// =========================================
window.abrirAba = function(event, id){
    document.querySelectorAll(".aba-conteudo").forEach(aba => aba.classList.remove("ativa"));
    document.querySelectorAll(".aba-btn").forEach(btn => btn.classList.remove("ativa"));
    
    document.getElementById(id).classList.add("ativa");
    event.currentTarget.classList.add("ativa");
};

// =========================================
// INICIAR
// =========================================
init();