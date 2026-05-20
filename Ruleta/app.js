const categories = [
  {
    title: "Saberes del Territorio",
    description:
      "¿Qué destreza práctica, arte o conocimiento tradicional de Tumaco sintieron que la ruleta reconoció en ustedes hoy? ¿Cómo se conecta eso con lo que les gustaría hacer en el futuro?",
    color: "#2f6f61",
  },
  {
    title: "Intereses y Pasiones",
    description:
      "¿Qué es aquello en lo que podrían pasar horas investigando o haciendo sin aburrirse? ¿Cómo se puede poner esa pasión al servicio de la comunidad?",
    color: "#4fa3a1",
  },
  {
    title: "Redes de Apoyo",
    description:
      "Cuando la ruleta se detuvo aquí, ¿quién fue la primera persona de su entorno familiar, de amigos o comunitario en la que pensaron como un impulso para sus metas?",
    color: "#7fa86d",
  },
  {
    title: "Fortalezas Personales",
    description:
      "¿Qué rasgo de su forma de ser (la resiliencia, la creatividad, la empatía) consideran que es su mayor herramienta para afrontar los retos del día a día?",
    color: "#c88a43",
  },
  {
    title: "Oportunidades del Entorno",
    description:
      "¿Qué espacios de formación académica, técnica o espacios comunitarios identifican actualmente en el municipio que les llame la atención para vincularse?",
    color: "#8e5a47",
  },
];

const wheel = document.getElementById("wheel");
const spinButton = document.getElementById("spinButton");
const shuffleButton = document.getElementById("shuffleButton");
const resultTitle = document.getElementById("resultTitle");
const resultDescription = document.getElementById("resultDescription");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let currentRotation = 0;
let isSpinning = false;
let activeIndex = -1;
let spinTimeoutId = null;

const wheelSize = 600;
const wheelCenter = wheelSize / 2;
const wheelRadius = 268;
const labelRadius = 154;

function polarToCartesian(centerX, centerY, radius, angleDegrees) {
  const angleInRadians = (angleDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.sin(angleInRadians),
    y: centerY - radius * Math.cos(angleInRadians),
  };
}

function describeSlice(centerX, centerY, radius, startAngle, endAngle) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle);
  const end = polarToCartesian(centerX, centerY, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function wrapTitle(title, maxLength = 14) {
  const words = title.split(" ");
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildLabelMarkup(title, x, y) {
  const lines = wrapTitle(title);

  return `
    <text class="segment-label" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">
      ${lines
        .map((line, index) => {
          const dy = index === 0 ? `${-((lines.length - 1) * 0.58).toFixed(2)}em` : "1.15em";
          return `<tspan x="${x}" dy="${dy}">${line}</tspan>`;
        })
        .join("")}
    </text>
  `;
}

function renderWheel() {
  const segmentAngle = 360 / categories.length;
  const slices = categories
    .map((category, index) => {
      const startAngle = index * segmentAngle - segmentAngle / 2;
      const endAngle = startAngle + segmentAngle;
      const midAngle = startAngle + segmentAngle / 2;
      const labelPoint = polarToCartesian(wheelCenter, wheelCenter, labelRadius, midAngle);

      return `
        <g>
          <path class="segment-path" d="${describeSlice(wheelCenter, wheelCenter, wheelRadius, startAngle, endAngle)}" fill="${category.color}" />
          ${buildLabelMarkup(category.title, labelPoint.x, labelPoint.y)}
        </g>
      `;
    })
    .join("");

  wheel.innerHTML = `
    <svg class="wheel-svg" viewBox="0 0 ${wheelSize} ${wheelSize}" role="img" aria-label="Ruleta interactiva">
      <defs>
        <radialGradient id="wheelGlow" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.12" />
          <stop offset="70%" stop-color="#ffffff" stop-opacity="0.02" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="wheelCenterFill" cx="50%" cy="38%" r="66%">
          <stop offset="0%" stop-color="#21463d" />
          <stop offset="100%" stop-color="#08120f" />
        </radialGradient>
      </defs>
      <circle cx="${wheelCenter}" cy="${wheelCenter}" r="${wheelRadius + 6}" class="wheel-rim" />
      ${slices}
      <circle cx="${wheelCenter}" cy="${wheelCenter}" r="88" fill="url(#wheelCenterFill)" class="wheel-center-disc" />
      <circle cx="${wheelCenter}" cy="${wheelCenter}" r="140" fill="url(#wheelGlow)" pointer-events="none" opacity="0.9" />
    </svg>
  `;
}

function getIndexFromRotation(rotation) {
  const segmentAngle = 360 / categories.length;
  // Normalizar solo para calcular, sin afectar currentRotation
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  // El puntero está en 0°, encontrar qué segmento está ahí
  // La relación es inversa: rotación positiva = segmentos se desplazan en orden inverso bajo el puntero
  const index = (categories.length - Math.round(normalizedRotation / segmentAngle)) % categories.length;
  return index;
}

function setActiveCategory(index) {
  activeIndex = index;
  const category = categories[index];

  resultTitle.textContent = category.title;
  resultDescription.textContent = category.description;
}

function resetSelection() {
  activeIndex = -1;
  resultTitle.textContent = "Sin selección";
  resultDescription.textContent =
    "Pulsa Girar ruleta para descubrir una categoría.";
}

function spinWheel() {
  if (isSpinning) {
    return;
  }

  if (spinTimeoutId) {
    window.clearTimeout(spinTimeoutId);
    spinTimeoutId = null;
  }

  isSpinning = true;
  spinButton.disabled = true;
  shuffleButton.disabled = true;

  const segmentAngle = 360 / categories.length;
  const targetIndex = Math.floor(Math.random() * categories.length);
  const turns = 5 + Math.floor(Math.random() * 4);
  
  // Normalizar rotación actual para saber dónde estamos (0-360)
  const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
  
  // Rotación necesaria para poner el segmento targetIndex en el puntero
  // La relación es inversa: segmento i requiere rotación (numSegmentos - i) * segmentAngle
  const targetRotation = (categories.length - targetIndex) * segmentAngle;
  
  // Calcular cuánto necesitamos girar desde la posición actual
  // Siempre giramos hacia adelante (clockwise)
  let additionalRotation;
  if (targetRotation <= normalizedCurrent) {
    additionalRotation = 360 - normalizedCurrent + targetRotation;
  } else {
    additionalRotation = targetRotation - normalizedCurrent;
  }
  
  // Añadir vueltas completas
  const finalRotation = currentRotation + turns * 360 + additionalRotation;
  
  const finishSpin = () => {
    isSpinning = false;
    spinButton.disabled = false;
    shuffleButton.disabled = false;
    
    // Calcular el índice real basado en la rotación final
    const actualIndex = getIndexFromRotation(finalRotation);
    setActiveCategory(actualIndex);
  };

  wheel.style.setProperty("--rotation", `${finalRotation}deg`);
  // Guardar la rotación actual para el siguiente spin
  currentRotation = finalRotation;

  if (reducedMotionQuery.matches) {
    finishSpin();
    return;
  }

  const handleDone = (event) => {
    if (event.target !== wheel) {
      return;
    }

    window.clearTimeout(spinTimeoutId);
    spinTimeoutId = null;
    finishSpin();
  };

  wheel.addEventListener("transitionend", handleDone, { once: true });
  spinTimeoutId = window.setTimeout(finishSpin, 4700);
}

spinButton.addEventListener("click", spinWheel);
shuffleButton.addEventListener("click", () => {
  if (isSpinning) {
    return;
  }

  if (spinTimeoutId) {
    window.clearTimeout(spinTimeoutId);
    spinTimeoutId = null;
  }

  wheel.style.setProperty("--rotation", "0deg");
  currentRotation = 0;
  resetSelection();
});

renderWheel();
resetSelection();
