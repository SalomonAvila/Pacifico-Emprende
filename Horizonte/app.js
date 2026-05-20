document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Tema desde LocalStorage (sincronizar con documentElement)
  const savedTheme = localStorage.getItem('pacifico_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }

  // Escuchar Toggle de Tema
  const themeToggle = document.getElementById('themeToggleButton');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      const isLight = document.documentElement.classList.contains('light-theme');
      localStorage.setItem('pacifico_theme', isLight ? 'light' : 'dark');
    });
  }

  const form = document.getElementById('horizonteForm');
  const exportButton = document.getElementById('exportPdfButton');
  const STORAGE_KEY = 'pacifico_horizonte_data';

  // Campos a persistir
  const fields = [
    'saberes_territorio',
    'redes_apoyo',
    'intereses',
    'problema_tumaco',
    'obstaculos_entorno',
    'herramientas_internas',
    'ruta_llegada',
    'meta_años'
  ];

  // 1. Cargar datos preexistentes desde LocalStorage
  loadFormData();

  // 2. Escuchar cambios e interactividad
  // Escucha el evento input en general para campos de texto y change para selectores
  form.addEventListener('input', debounce(saveFormData, 300));
  form.addEventListener('change', saveFormData);

  // 3. Auto-ajuste de altura para textareas en móviles/escritorio
  const textareas = form.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    // Ajustar altura inicial basada en el contenido cargado
    adjustHeight(textarea);
    
    // Ajustar en cada pulsación o entrada de datos
    textarea.addEventListener('input', () => {
      adjustHeight(textarea);
    });
  });

  // 4. Lógica de impresión
  exportButton.addEventListener('click', () => {
    // Disparar la impresión nativa del sistema
    window.print();
  });

  /**
   * Carga los datos guardados en LocalStorage y rellena el formulario.
   */
  function loadFormData() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return;

      const data = JSON.parse(savedData);
      
      fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element && data[fieldId] !== undefined) {
          element.value = data[fieldId];
        }
      });
    } catch (error) {
      console.error('Error al cargar datos desde LocalStorage:', error);
    }
  }

  /**
   * Recopila los valores de los inputs y los guarda en LocalStorage.
   */
  function saveFormData() {
    try {
      const data = {};
      fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
          data[fieldId] = element.value;
        }
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error al guardar datos en LocalStorage:', error);
    }
  }

  /**
   * Ajusta la altura de los textareas para que no aparezca barra de desplazamiento.
   * @param {HTMLTextAreaElement} element 
   */
  function adjustHeight(element) {
    // Restablecer altura para recalcular correctamente
    element.style.height = 'auto';
    // Establecer nueva altura basada en scrollHeight
    element.style.height = (element.scrollHeight) + 'px';
  }

  /**
   * Debounce simple para evitar escrituras en disco excesivas en LocalStorage en móviles antiguos.
   */
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }
});
