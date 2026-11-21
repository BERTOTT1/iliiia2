document.addEventListener("DOMContentLoaded", () => {

  const STORAGE_KEY = "benjamim_trajetoria_state_v2";

  let state = loadState();
  let activeArenaContext = null;
  let activeEssayIndex = 0;
  let filteredEssays = [...ESSAYS_DATA];
  let currentFilterAxis = "todos";
  let currentSearchTerm = "";
  let lastFocusedElement = null;

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Storage indisponível:", e);
    }
    return {
      chapters: structuredClone(INITIAL_CHAPTERS),
      schools: structuredClone(INITIAL_SCHOOLS),
      memories: structuredClone(INITIAL_MEMORIES)
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Não foi possível salvar no localStorage:", e);
    }
  }

  const chaptersGrid = document.getElementById("chaptersGrid");

  function renderChapters() {
    chaptersGrid.innerHTML = "";
    state.chapters.forEach((cap, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-card";
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `
        <div>
          <div class="chapter-card-top">
            <span class="chapter-round-badge">${escapeHTML(cap.round)}</span>
            <span class="chapter-stage-pill">${escapeHTML(cap.stage)}</span>
          </div>
          <h3 class="chapter-card-title">${escapeHTML(cap.title)}</h3>
          <p class="chapter-card-hook">${escapeHTML(cap.hook)}</p>
        </div>
        <div class="chapter-card-action">
          <span>ABRIR PAINEL DO CAPÍTULO</span>
          <span aria-hidden="true">→</span>
        </div>
      `;
      btn.addEventListener("click", () => openArenaModal("chapter", idx, btn));
      chaptersGrid.appendChild(btn);
    });
  }

  const schoolsBoard = document.getElementById("schoolsBoard");

  function renderSchools() {
    schoolsBoard.innerHTML = "";
    state.schools.forEach((school, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "school-credential";
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `
        <div>
          <div class="credential-header">
            <span>${escapeHTML(school.code)} // REGISTRO</span>
            <span class="credential-punch" aria-hidden="true"></span>
          </div>
          <h3 class="school-name">${escapeHTML(school.name)}</h3>
          <p class="school-brief">${escapeHTML(school.brief)}</p>
        </div>
        <div class="credential-footer">
          <span>INSPECIONAR CREDENCIAL</span>
          <span aria-hidden="true">↗</span>
        </div>
      `;
      btn.addEventListener("click", () => openArenaModal("school", idx, btn));
      schoolsBoard.appendChild(btn);
    });
  }

  const memoriesGrid = document.getElementById("memoriesGrid");

  function renderMemories() {
    memoriesGrid.innerHTML = "";
    state.memories.forEach((mem, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-slip";
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `
        <span class="memory-code">${escapeHTML(mem.code)}</span>
        <h3 class="memory-title">${escapeHTML(mem.title)}</h3>
        <p class="memory-desc">${escapeHTML(mem.description)}</p>
        <span class="memory-open-tag">CLIQUE PARA LER REGISTRO COMPLETO →</span>
      `;
      btn.addEventListener("click", () => openArenaModal("memory", idx, btn));
      memoriesGrid.appendChild(btn);
    });
  }

  document.getElementById("addMemoryBtn").addEventListener("click", (e) => {
    const nextNum = String(state.memories.length + 1).padStart(2, "0");
    state.memories.push({
      id: "mem-" + Date.now(),
      code: `OBS-${nextNum} // NOVO REGISTRO`,
      title: "Nova Memória Escolar",
      description: "Clique em editar para registrar uma lembrança específica.",
      fullText: "Escreva aqui os detalhes dessa experiência vivida durante a trajetória escolar.",
      learning: "Aprendizado conquistado neste momento."
    });
    saveState();
    renderMemories();
    openArenaModal("memory", state.memories.length - 1, e.currentTarget, true);
  });

  const arenaModal = document.getElementById("arenaModal");
  const arenaModalTag = document.getElementById("arenaModalTag");
  const arenaModalTitle = document.getElementById("arenaModalTitle");
  const arenaModalBody = document.getElementById("arenaModalBody");
  const arenaEditToggleBtn = document.getElementById("arenaEditToggleBtn");

  function openArenaModal(type, index, triggerEl = null, startEditing = false) {
    if (triggerEl) lastFocusedElement = triggerEl;
    activeArenaContext = { type, index, isEditing: startEditing };
    renderArenaModalContent();
    arenaModal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("closeArenaModal").focus();
  }

  function closeArenaModal() {
    arenaModal.hidden = true;
    document.body.style.overflow = "";
    activeArenaContext = null;
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function renderArenaModalContent() {
    if (!activeArenaContext) return;
    const { type, index, isEditing } = activeArenaContext;

    if (type === "chapter") {
      const item = state.chapters[index];
      arenaModalTag.textContent = `${item.round} • ${item.stage}`;
      arenaModalTitle.textContent = item.title;
      arenaEditToggleBtn.textContent = isEditing ? "✓ SALVAR ALTERAÇÕES" : "✎ EDITAR CAPÍTULO";

      if (!isEditing) {
        arenaModalBody.innerHTML = `
          <div class="detail-block">
            <h4>Experiências Vividas</h4>
            <p>${escapeHTML(item.experience)}</p>
          </div>
          <div class="detail-block gold-accent">
            <h4>Momentos Marcantes</h4>
            <p>${escapeHTML(item.highlights)}</p>
          </div>
          <div class="detail-block red-accent">
            <h4>Dificuldades Enfrentadas</h4>
            <p>${escapeHTML(item.difficulties)}</p>
          </div>
          <div class="detail-block">
            <h4>Aprendizados Adquiridos</h4>
            <p>${escapeHTML(item.learnings)}</p>
          </div>
        `;
      } else {
        arenaModalBody.innerHTML = `
          <div class="edit-form-group">
            <label for="editCapTitle">Título da Fase</label>
            <input id="editCapTitle" type="text" value="${escapeAttr(item.title)}">
          </div>
          <div class="edit-form-group">
            <label for="editCapExp">Experiências Vividas</label>
            <textarea id="editCapExp">${escapeHTML(item.experience)}</textarea>
          </div>
          <div class="edit-form-group">
            <label for="editCapHigh">Momentos Marcantes</label>
            <textarea id="editCapHigh">${escapeHTML(item.highlights)}</textarea>
          </div>
          <div class="edit-form-group">
            <label for="editCapDiff">Dificuldades Enfrentadas</label>
            <textarea id="editCapDiff">${escapeHTML(item.difficulties)}</textarea>
          </div>
          <div class="edit-form-group">
            <label for="editCapLearn">Aprendizados Adquiridos</label>
            <textarea id="editCapLearn">${escapeHTML(item.learnings)}</textarea>
          </div>
        `;
      }
    } else if (type === "school") {
      const item = state.schools[index];
      arenaModalTag.textContent = `CREDENCIAL INSTITUCIONAL • ${item.code} (SEM DATA VINCULADA)`;
      arenaModalTitle.textContent = item.name;
      arenaEditToggleBtn.textContent = isEditing ? "✓ SALVAR CREDENCIAL" : "✎ EDITAR CREDENCIAL";

      if (!isEditing) {
        arenaModalBody.innerHTML = `
          <div class="detail-block">
            <h4>Identificação &amp; Síntese</h4>
            <p>${escapeHTML(item.brief)}</p>
          </div>
          <div class="detail-block gold-accent">
            <h4>Registro Institucional</h4>
            <p>${escapeHTML(item.details)}</p>
          </div>
          <div class="detail-block">
            <h4>Campo Opcional / Observações Posteriores</h4>
            <p>${escapeHTML(item.extraNotes || "Nenhuma observação adicional inserida ainda. Clique em 'Editar Credencial' para complementar.")}</p>
          </div>
        `;
      } else {
        arenaModalBody.innerHTML = `
          <div class="edit-form-group">
            <label for="editSchoolName">Nome da Instituição</label>
            <input id="editSchoolName" type="text" value="${escapeAttr(item.name)}">
          </div>
          <div class="edit-form-group">
            <label for="editSchoolBrief">Breve Descrição</label>
            <input id="editSchoolBrief" type="text" value="${escapeAttr(item.brief)}">
          </div>
          <div class="edit-form-group">
            <label for="editSchoolDetails">Registro Institucional</label>
            <textarea id="editSchoolDetails">${escapeHTML(item.details)}</textarea>
          </div>
          <div class="edit-form-group">
            <label for="editSchoolExtra">Informações Complementares (Opcional)</label>
            <textarea id="editSchoolExtra">${escapeHTML(item.extraNotes)}</textarea>
          </div>
        `;
      }
    } else if (type === "memory") {
      const item = state.memories[index];
      arenaModalTag.textContent = `ARQUIVO DE MEMÓRIA • ${item.code}`;
      arenaModalTitle.textContent = item.title;
      arenaEditToggleBtn.textContent = isEditing ? "✓ SALVAR MEMÓRIA" : "✎ EDITAR MEMÓRIA";

      if (!isEditing) {
        arenaModalBody.innerHTML = `
          <div class="detail-block">
            <h4>Descrição Resumida</h4>
            <p>${escapeHTML(item.description)}</p>
          </div>
          <div class="detail-block gold-accent">
            <h4>Relato Completo</h4>
            <p>${escapeHTML(item.fullText)}</p>
          </div>
          <div class="detail-block red-accent">
            <h4>Aprendizado Associado</h4>
            <p>${escapeHTML(item.learning)}</p>
          </div>
        `;
      } else {
        arenaModalBody.innerHTML = `
          <div class="edit-form-group">
            <label for="editMemTitle">Título da Memória</label>
            <input id="editMemTitle" type="text" value="${escapeAttr(item.title)}">
          </div>
          <div class="edit-form-group">
            <label for="editMemDesc">Descrição</label>
            <input id="editMemDesc" type="text" value="${escapeAttr(item.description)}">
          </div>
          <div class="edit-form-group">
            <label for="editMemFull">Texto Complementar</label>
            <textarea id="editMemFull">${escapeHTML(item.fullText)}</textarea>
          </div>
          <div class="edit-form-group">
            <label for="editMemLearn">Aprendizados</label>
            <textarea id="editMemLearn">${escapeHTML(item.learning)}</textarea>
          </div>
        `;
      }
    }
  }

  arenaEditToggleBtn.addEventListener("click", () => {
    if (!activeArenaContext) return;
    const { type, index, isEditing } = activeArenaContext;

    if (isEditing) {
      if (type === "chapter") {
        const cap = state.chapters[index];
        cap.title = document.getElementById("editCapTitle").value.trim() || cap.title;
        cap.experience = document.getElementById("editCapExp").value.trim();
        cap.highlights = document.getElementById("editCapHigh").value.trim();
        cap.difficulties = document.getElementById("editCapDiff").value.trim();
        cap.learnings = document.getElementById("editCapLearn").value.trim();
        renderChapters();
      } else if (type === "school") {
        const sc = state.schools[index];
        sc.name = document.getElementById("editSchoolName").value.trim() || sc.name;
        sc.brief = document.getElementById("editSchoolBrief").value.trim();
        sc.details = document.getElementById("editSchoolDetails").value.trim();
        sc.extraNotes = document.getElementById("editSchoolExtra").value.trim();
        renderSchools();
      } else if (type === "memory") {
        const mem = state.memories[index];
        mem.title = document.getElementById("editMemTitle").value.trim() || mem.title;
        mem.description = document.getElementById("editMemDesc").value.trim();
        mem.fullText = document.getElementById("editMemFull").value.trim();
        mem.learning = document.getElementById("editMemLearn").value.trim();
        renderMemories();
      }
      saveState();
      activeArenaContext.isEditing = false;
    } else {
      activeArenaContext.isEditing = true;
    }

    renderArenaModalContent();
  });

  document.getElementById("arenaPrevBtn").addEventListener("click", () => {
    if (!activeArenaContext) return;
    const list = getActiveArenaList();
    activeArenaContext.index = (activeArenaContext.index - 1 + list.length) % list.length;
    activeArenaContext.isEditing = false;
    renderArenaModalContent();
  });

  document.getElementById("arenaNextBtn").addEventListener("click", () => {
    if (!activeArenaContext) return;
    const list = getActiveArenaList();
    activeArenaContext.index = (activeArenaContext.index + 1) % list.length;
    activeArenaContext.isEditing = false;
    renderArenaModalContent();
  });

  function getActiveArenaList() {
    if (activeArenaContext.type === "chapter") return state.chapters;
    if (activeArenaContext.type === "school") return state.schools;
    return state.memories;
  }

  document.getElementById("closeArenaModal").addEventListener("click", closeArenaModal);
  document.getElementById("arenaFooterCloseBtn").addEventListener("click", closeArenaModal);
  arenaModal.addEventListener("click", (e) => {
    if (e.target === arenaModal) closeArenaModal();
  });

  const essaysGrid = document.getElementById("essaysGrid");
  const essaySearchInput = document.getElementById("essaySearch");
  const filterButtons = document.querySelectorAll(".pill-btn");

  function renderEssays() {
    filteredEssays = ESSAYS_DATA.filter((essay) => {
      const matchesAxis = currentFilterAxis === "todos" || essay.axis === currentFilterAxis;
      const q = currentSearchTerm.toLowerCase();
      const matchesQuery =
        !q ||
        essay.title.toLowerCase().includes(q) ||
        essay.paragraphs.some((p) => p.toLowerCase().includes(q));
      return matchesAxis && matchesQuery;
    });

    essaysGrid.innerHTML = "";

    if (filteredEssays.length === 0) {
      essaysGrid.innerHTML = `
        <div style="grid-column: span 12; padding: 2rem; border: 1px dashed #8A6828; text-align: center; font-family: var(--font-mono);">
          Nenhuma lâmina textual encontrada para o filtro selecionado.
        </div>
      `;
      return;
    }

    filteredEssays.forEach((essay, idx) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = `essay-plate ${essay.layoutStyle}`;
      card.setAttribute("role", "listitem");
      card.innerHTML = `
        <div>
          <div class="plate-catalog-header">
            <span>${escapeHTML(essay.catalogLabel)}</span>
            <span class="plate-axis-tag">${escapeHTML(essay.axis)}</span>
          </div>
          <h3 class="plate-essay-title" style="margin-top: 0.75rem;">${escapeHTML(essay.title)}</h3>
          <p class="plate-excerpt" style="margin-top: 0.65rem;">${escapeHTML(essay.paragraphs[0])}</p>
        </div>
        <div class="plate-read-footer">
          <span>ABRIR LÂMINA DE LEITURA</span>
          <span aria-hidden="true">→</span>
        </div>
      `;
      card.addEventListener("click", () => openReaderModal(idx, card));
      essaysGrid.appendChild(card);
    });
  }

  essaySearchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value.trim();
    renderEssays();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilterAxis = btn.dataset.filter;
      renderEssays();
    });
  });

  const readerModal = document.getElementById("readerModal");
  const readerSpecimenCode = document.getElementById("readerSpecimenCode");
  const readerAxisBadge = document.getElementById("readerAxisBadge");
  const readerModalTitle = document.getElementById("readerModalTitle");
  const readerEssayText = document.getElementById("readerEssayText");
  const readerPositionIndicator = document.getElementById("readerPositionIndicator");
  const readerScrollContainer = document.getElementById("readerScrollContainer");

  function openReaderModal(index, triggerEl = null) {
    if (triggerEl) lastFocusedElement = triggerEl;
    activeEssayIndex = index;
    renderReaderPage();
    readerModal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("closeReaderModal").focus();
  }

  function closeReaderModal() {
    readerModal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function renderReaderPage() {
    const essay = filteredEssays[activeEssayIndex];
    if (!essay) return;

    readerSpecimenCode.textContent = essay.catalogLabel;
    readerAxisBadge.textContent = essay.axis;
    readerModalTitle.textContent = essay.title;
    readerEssayText.innerHTML = essay.paragraphs
      .map((p) => `<p>${escapeHTML(p)}</p>`)
      .join("");
    readerPositionIndicator.textContent = `Lâmina ${activeEssayIndex + 1} de ${filteredEssays.length}`;
    readerScrollContainer.scrollTop = 0;
  }

  document.getElementById("readerPrevBtn").addEventListener("click", () => {
    activeEssayIndex = (activeEssayIndex - 1 + filteredEssays.length) % filteredEssays.length;
    renderReaderPage();
  });

  document.getElementById("readerNextBtn").addEventListener("click", () => {
    activeEssayIndex = (activeEssayIndex + 1) % filteredEssays.length;
    renderReaderPage();
  });

  document.getElementById("closeReaderModal").addEventListener("click", closeReaderModal);
  readerModal.addEventListener("click", (e) => {
    if (e.target === readerModal) closeReaderModal();
  });

  const revealBtn = document.getElementById("revealConclusionBtn");
  const revealBtnLabel = document.getElementById("revealBtnLabel");
  const finalChapterContent = document.getElementById("finalChapterContent");

  revealBtn.addEventListener("click", () => {
    const isHidden = finalChapterContent.hidden;
    finalChapterContent.hidden = !isHidden;
    revealBtn.setAttribute("aria-expanded", String(isHidden));
    revealBtnLabel.textContent = isHidden
      ? "OCULTAR O ÚLTIMO CAPÍTULO"
      : "REVELAR O ÚLTIMO CAPÍTULO";

    if (isHidden) {
      finalChapterContent.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");
  const navLinks = document.querySelectorAll(".nav-link");

  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.jump;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
      if (btn.dataset.openFirst === "chapter") {
        setTimeout(() => openArenaModal("chapter", 0, btn), 450);
      }
    });
  });

  const sections = document.querySelectorAll("main > section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.toggle("active", link.dataset.section === id);
          });
        }
      });
    },
    { rootMargin: "-35% 0px -50% 0px" }
  );

  sections.forEach((sec) => observer.observe(sec));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!arenaModal.hidden) closeArenaModal();
      if (!readerModal.hidden) closeReaderModal();
    }
  });

  function escapeHTML(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHTML(str).replace(/'/g, "&#39;");
  }

  renderChapters();
  renderSchools();
  renderMemories();
  renderEssays();
});