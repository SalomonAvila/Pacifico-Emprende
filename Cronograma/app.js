document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'pacifico_kanban_data';

  // Estructura de datos inicial por defecto
  const defaultData = {
    puerto_final: [
      { id: 'pf-1', text: 'Completar mi educación y comenzar a trabajar o estudiar mi carrera soñada en el Pacífico.' }
    ],
    estaciones_intermedias: [
      { id: 'ei-1', text: 'Obtener un cupo de formación técnica o ingresar a la educación superior en mi ruta elegida.' }
    ],
    timonazo_inmediato: [
      { id: 'ti-1', text: 'Averiguar los requisitos de matrícula e inscribirme a los programas de mi interés.' }
    ]
  };

  let boardData = {};

  // 1. Inicializar datos
  initBoardData();

  // 2. Vincular botones globales de "+ Agregar"
  document.querySelectorAll('.add-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const colId = btn.dataset.column;
      createAndAppendTask(colId);
    });
  });

  // 3. Vincular botón de exportación a PDF
  const exportBtn = document.getElementById('exportKanbanButton');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.print();
    });
  }

  /**
   * Inicializa los datos del tablero desde LocalStorage o usa la plantilla predeterminada.
   */
  function initBoardData() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        boardData = JSON.parse(savedData);
      } else {
        boardData = JSON.parse(JSON.stringify(defaultData)); // clonar
        localStorage.setItem(STORAGE_KEY, JSON.stringify(boardData));
      }
    } catch (e) {
      console.error('Error al parsear LocalStorage:', e);
      boardData = JSON.parse(JSON.stringify(defaultData));
    }
    
    // Renderizar todo el tablero inicialmente
    renderColumn('puerto_final', 'tasks-puerto-final');
    renderColumn('estaciones_intermedias', 'tasks-estaciones-intermedias');
    renderColumn('timonazo_inmediato', 'tasks-timonazo-inmediato');
  }

  /**
   * Renderiza una columna completa a partir de los datos.
   */
  function renderColumn(colId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const tasks = boardData[colId] || [];

    tasks.forEach(task => {
      const cardElement = createTaskCardDOM(colId, task);
      container.appendChild(cardElement);
    });
  }

  /**
   * Crea el elemento DOM de una tarjeta Kanban.
   */
  function createTaskCardDOM(colId, task) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.setAttribute('role', 'listitem');
    card.dataset.id = task.id;

    // Creador del editor de texto editable
    const editor = document.createElement('textarea');
    editor.className = 'card-editor';
    editor.placeholder = 'Escribe una meta o acción...';
    editor.value = task.text;
    editor.rows = 1;
    editor.setAttribute('aria-label', `Editar meta de la columna`);

    // Botón Eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.setAttribute('aria-label', 'Eliminar meta');

    card.appendChild(editor);
    card.appendChild(deleteBtn);

    // --- LÓGICA DE EVENTOS EN LA TARJETA ---

    // Ajustar altura inicial y en eventos
    setTimeout(() => adjustHeight(editor), 0);
    editor.addEventListener('input', () => {
      adjustHeight(editor);
      // Guardar inmediatamente en memoria y LocalStorage ante el evento input
      task.text = editor.value;
      saveToStorage();
    });

    // Evento para eliminar
    deleteBtn.addEventListener('click', () => {
      removeTask(colId, task.id, card);
    });

    return card;
  }

  /**
   * Crea una nueva tarea vacía en memoria, la añade al DOM y le da foco inmediato.
   */
  function createAndAppendTask(colId) {
    const newId = 'task-' + Date.now();
    const newTask = { id: newId, text: '' };

    // Añadir a datos de memoria
    if (!boardData[colId]) {
      boardData[colId] = [];
    }
    boardData[colId].push(newTask);
    saveToStorage();

    // Obtener contenedor DOM
    let containerId = '';
    if (colId === 'puerto_final') containerId = 'tasks-puerto-final';
    else if (colId === 'estaciones_intermedias') containerId = 'tasks-estaciones-intermedias';
    else if (colId === 'timonazo_inmediato') containerId = 'tasks-timonazo-inmediato';

    const container = document.getElementById(containerId);
    if (!container) return;

    // Crear y añadir al DOM
    const cardDOM = createTaskCardDOM(colId, newTask);
    container.appendChild(cardDOM);

    // Enfocar el editor inmediatamente en dispositivos móviles/escritorio para facilitar escritura rápida
    const editor = cardDOM.querySelector('.card-editor');
    if (editor) {
      editor.focus();
    }
  }

  /**
   * Elimina una tarea tanto de memoria como del DOM aplicando una micro-animación.
   */
  function removeTask(colId, taskId, cardDOM) {
    // Eliminar de los datos en memoria
    if (boardData[colId]) {
      boardData[colId] = boardData[colId].filter(t => t.id !== taskId);
      saveToStorage();
    }

    // Efecto visual de eliminación (animación) antes de remover del DOM
    cardDOM.style.transition = 'opacity 200ms ease, transform 200ms ease';
    cardDOM.style.opacity = '0';
    cardDOM.style.transform = 'scale(0.9) translateY(-6px)';

    setTimeout(() => {
      cardDOM.remove();
    }, 200);
  }

  /**
   * Guarda los datos actuales en LocalStorage.
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(boardData));
    } catch (e) {
      console.error('Error al guardar datos en LocalStorage:', e);
    }
  }

  /**
   * Ajusta la altura del editor de texto de forma dinámica.
   */
  function adjustHeight(element) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }
});
