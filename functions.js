let jugador = "";
let preguntasTotales = [];
let preguntasJuego = [];
let preguntasFalladas = [];
let rondaActual = 1;
let aciertos = 0;
let fallos = 0;
const preguntasPorRonda = 2;
const cantidadPreguntas = 4;

const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const nombreJugador = document.getElementById("nombre-jugador");
const nombreMostrado = document.getElementById("nombre-mostrado");
const rondaMostrada = document.getElementById("ronda-mostrada");
const marcadorCorrectas = document.getElementById("marcador-correctas");
const marcadorMalas = document.getElementById("marcador-malas");
const contenedorRonda = document.getElementById("contenedor-ronda");
const botonIniciar = document.getElementById("boton-iniciar");
const botonComprobar = document.getElementById("boton-comprobar");
const ventanaFinal = document.getElementById("ventana-final");
const tituloFinal = document.getElementById("titulo-final");
const textoFinal = document.getElementById("texto-final");
const estadisticasFinal = document.getElementById("estadisticas-final");
const botonReiniciar = document.getElementById("boton-reiniciar");

const nombreGuardado = localStorage.getItem("quizmaster_nombre");
if (nombreGuardado) {
	nombreJugador.value = nombreGuardado;
}

function barajarArray(lista) {
	for (let indice = lista.length - 1; indice > 0; indice--) {
		const posicion = Math.floor(Math.random() * (indice + 1));
		[lista[indice], lista[posicion]] = [lista[posicion], lista[indice]];
	}

	return lista;
}

async function cargarPreguntas() {
	try {
		const respuesta = await fetch("questions.json");
		preguntasTotales = await respuesta.json();
		return true;
	} catch (error) {
		console.error("Error al cargar las preguntas:", error);
		alert("No se pudieron cargar las preguntas del servidor.");
		return false;
	}
}

botonIniciar.addEventListener("click", async function () {
	jugador = nombreJugador.value.trim();

	if (jugador === "") {
		alert("Escribe tu nombre para empezar.");
		return;
	}

	if (preguntasTotales.length === 0) {
		const cargadas = await cargarPreguntas();
		if (!cargadas) {
			return;
		}
	}

	preguntasJuego = barajarArray([...preguntasTotales]).slice(0, cantidadPreguntas);
	rondaActual = 1;
	aciertos = 0;
	fallos = 0;
	preguntasFalladas = [];

	localStorage.setItem("quizmaster_nombre", jugador);
	nombreMostrado.textContent = `Jugador: ${jugador}`;
	marcadorCorrectas.textContent = aciertos;
	marcadorMalas.textContent = fallos;
	pantallaInicio.classList.add("oculto");
	pantallaJuego.classList.remove("oculto");
	renderizarRonda();
});

function renderizarRonda() {
	const inicio = (rondaActual - 1) * preguntasPorRonda;
	const preguntasDeRonda = preguntasJuego.slice(inicio, inicio + preguntasPorRonda);

	rondaMostrada.textContent = `Ronda ${rondaActual} de 2`;
	contenedorRonda.innerHTML = "";

	const listaPreguntas = document.createElement("div");
	listaPreguntas.classList.add("lista-preguntas");

	preguntasDeRonda.forEach(function (pregunta, indice) {
		const numero = inicio + indice + 1;
		const opcionesMezcladas = barajarArray([...pregunta.opciones]);
		const tarjeta = document.createElement("div");
		tarjeta.classList.add("tarjeta-pregunta");
		tarjeta.dataset.respuestaCorrecta = pregunta.correcta;
		tarjeta.innerHTML = `
			<p class="numero-pregunta">Pregunta ${numero}</p>
			<h2>${pregunta.pregunta}</h2>
			<div class="rejilla-opciones">
				${opcionesMezcladas.map(function (opcion) {
					return `<button class="boton-opcion" type="button" onclick="seleccionarOpcion(this)">${opcion}</button>`;
				}).join("")}
			</div>
		`;
		listaPreguntas.appendChild(tarjeta);
	});

	contenedorRonda.appendChild(listaPreguntas);
}

window.seleccionarOpcion = function (botonPulsado) {
	const opciones = botonPulsado.parentElement.querySelectorAll(".boton-opcion");

	opciones.forEach(function (boton) {
		boton.classList.remove("seleccionada");
	});

	botonPulsado.classList.add("seleccionada");
};

botonComprobar.addEventListener("click", function () {
	const tarjetas = contenedorRonda.querySelectorAll(".tarjeta-pregunta");
	let todasRespondidas = true;

	tarjetas.forEach(function (tarjeta) {
		if (!tarjeta.querySelector(".boton-opcion.seleccionada")) {
			todasRespondidas = false;
		}
	});

	if (!todasRespondidas) {
		alert("Responde las dos preguntas de la ronda.");
		return;
	}

	let fallosEnEstaRonda = 0;

	tarjetas.forEach(function (tarjeta) {
		const opcionElegida = tarjeta.querySelector(".boton-opcion.seleccionada").textContent;
		const opcionCorrecta = tarjeta.dataset.respuestaCorrecta;
		const enunciado = tarjeta.querySelector("h2").textContent;

		if (opcionElegida === opcionCorrecta) {
			aciertos++;
		} else {
			fallos++;
			fallosEnEstaRonda++;
			preguntasFalladas.push({
				pregunta: enunciado,
				tuRespuesta: opcionElegida,
				correcta: opcionCorrecta
			});
		}
	});

	marcadorCorrectas.textContent = aciertos;
	marcadorMalas.textContent = fallos;

	if (fallosEnEstaRonda > 0) {
		mostrarVentanaFinal("¡Juego terminado!", "Has fallado al menos una pregunta de la ronda.", false);
	} else if (rondaActual < cantidadPreguntas / preguntasPorRonda) {
		alert("¡Excelente! Has pasado de ronda.");
		rondaActual++;
		renderizarRonda();
	} else {
		mostrarVentanaFinal(`¡Felicidades, ${jugador}!`, "Has completado las dos rondas.", true);
	}
});

function mostrarVentanaFinal(titulo, mensaje, haGanado) {
	tituloFinal.textContent = titulo;
	textoFinal.textContent = mensaje;

	let contenido = `<p><strong>Aciertos:</strong> ${aciertos} | <strong>Fallos:</strong> ${fallos}</p>`;

	if (preguntasFalladas.length > 0) {
		contenido += "<p>Respuestas incorrectas:</p>";

		preguntasFalladas.forEach(function (preguntaFallada) {
			contenido += `
				<p>${preguntaFallada.pregunta}</p>
				<p>Tu respuesta: ${preguntaFallada.tuRespuesta}</p>
				<p>Respuesta correcta: ${preguntaFallada.correcta}</p>
			`;
		});
	}

	estadisticasFinal.innerHTML = contenido;
	ventanaFinal.classList.remove("oculto");
	enviarDatosBackend(haGanado);
}

async function enviarDatosBackend(haGanado) {
	const datos = {
		jugador: jugador,
		aciertos: aciertos,
		fallos: fallos,
		haGanado: haGanado
	};

	try {
		const respuesta = await fetch("backend.php", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(datos)
		});

		if (!respuesta.ok) {
			console.warn("No se pudieron guardar los datos. Revisa que exista backend.php.");
		}
	} catch (error) {
		console.warn("No se pudo conectar con el servidor.", error);
	}
}

botonReiniciar.addEventListener("click", function () {
	ventanaFinal.classList.add("oculto");
	pantallaJuego.classList.add("oculto");
	pantallaInicio.classList.remove("oculto");
	contenedorRonda.innerHTML = "";

	rondaActual = 1;
	aciertos = 0;
	fallos = 0;
	preguntasFalladas = [];
});
