document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const btnEmergencia = document.getElementById("btnEmergencia");
  const barraProgreso = document.getElementById("barraProgreso");
  const estadoCaso = document.getElementById("estadoCaso");
  const elementosReveal = document.querySelectorAll(".reveal");

  let audioCtx = null;
  let oscilador = null;
  let ganancia = null;
  let intervaloSirena = null;

  /* ---------- Sirena sintetizada con Web Audio API ---------- */
  function iniciarSirena() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioCtx = new AudioCtx();
    oscilador = audioCtx.createOscillator();
    ganancia = audioCtx.createGain();

    oscilador.type = "sawtooth";
    ganancia.gain.value = 0.03;

    oscilador.connect(ganancia);
    ganancia.connect(audioCtx.destination);

    let subiendo = true;
    const ahora = audioCtx.currentTime;
    oscilador.frequency.setValueAtTime(650, ahora);

    intervaloSirena = setInterval(() => {
      if (!audioCtx) return;
      const t = audioCtx.currentTime;
      const destino = subiendo ? 950 : 650;
      oscilador.frequency.linearRampToValueAtTime(destino, t + 1.2);
      subiendo = !subiendo;
    }, 1200);

    oscilador.start();
  }

  function detenerSirena() {
    clearInterval(intervaloSirena);
    intervaloSirena = null;

    if (oscilador) {
      try { oscilador.stop(); } catch (e) { /* ya detenido */ }
      oscilador.disconnect();
      oscilador = null;
    }
    if (ganancia) {
      ganancia.disconnect();
      ganancia = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
  }

  /* ---------- Activar / desactivar Modo Policial ---------- */
  function establecerEmergencia(activo) {
    body.classList.toggle("modo-emergencia", activo);
    btnEmergencia.setAttribute("aria-pressed", String(activo));
    btnEmergencia.textContent = activo ? "Desactivar Modo Policial" : "Activar Modo Policial";
    estadoCaso.textContent = activo ? "Alerta activa" : "En curso";

    if (activo) {
      iniciarSirena();
    } else {
      detenerSirena();
    }
  }

  btnEmergencia.addEventListener("click", () => {
    establecerEmergencia(!body.classList.contains("modo-emergencia"));
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key.toLowerCase() === "e" && !evento.ctrlKey && !evento.metaKey && !evento.altKey) {
      establecerEmergencia(!body.classList.contains("modo-emergencia"));
    }
  });

  /* ---------- Barra de progreso de lectura ---------- */
  function actualizarProgreso() {
    const documento = document.documentElement;
    const desplazable = documento.scrollHeight - documento.clientHeight;
    const porcentaje = desplazable > 0 ? (documento.scrollTop / desplazable) * 100 : 0;
    barraProgreso.style.width = porcentaje + "%";
  }

  window.addEventListener("scroll", actualizarProgreso, { passive: true });
  actualizarProgreso();

  /* ---------- Aparición de secciones al hacer scroll ---------- */
  if ("IntersectionObserver" in window) {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("visible");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    elementosReveal.forEach((el) => observador.observe(el));
  } else {
    elementosReveal.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Detener la sirena si la pestaña se oculta ---------- */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && body.classList.contains("modo-emergencia")) {
      establecerEmergencia(false);
    }
  });
});
