const URL = "https://walter-multiplayer.herokuapp.com/";
const socket = io(URL, { autoConnect: false });

// Datos de usuario
let User = {
  username: "",
  id: "",
  roomConnected: 0,
  jugada: "",
  puedeJugar: false,
  puntaje: 0,
};
let Enemigo = {
  username: "",
  puntaje: 0,
};
// Cargar usuario ya creado
if (localStorage.User) {
  let usuario = JSON.parse(localStorage.getItem("User"));
  User.id = usuario.id;
  User.username = usuario.username;
  onUsernameSelection(User.username);
}

// DOM
const seccionLogin = document.getElementById("login");
const seccionLobby = document.getElementById("lobby");
const seccionJuego = document.getElementById("contenedor");
const usernameTitle = document.getElementById("usernameTitle");
const nombresResultado = document.getElementById("nombres-resultado");
// Socket IO

// Recibir usuarios
socket.on("users", (users) => {
  users.forEach((user) => {
    console.log(user);
    if (user.username == User.username) {
      User.id = user.userID;
      let usuario = {
        id: user.userID,
        username: user.username,
      };
      let save = JSON.stringify(usuario);
      localStorage.setItem("User", save);
    }
  });
  seccionLogin.style.display = "none";
  usernameTitle.innerText = User.username;
  seccionLobby.style.display = "flex";
});
// Recibir error
socket.on("error", (msg) => {
  console.log(msg.msg);
});
// Recibir datos de salas
let sala = 1;
socket.on("datos de salas", (msg) => {
  console.log(msg);
  sala = 1;
  for (let room of msg.rooms) {
    actualizarSalas(sala, room);
    sala++;
  }
});
// Conectar a los rooms
// Room 1
const roomUnoBoton = document.getElementById("room1");
roomUnoBoton.addEventListener("click", () => {
  let msg = {
    username: User.username,
    id: User.id,
  };
  socket.emit("conectarRoom1", msg);
});
// Room 2
const roomDosBoton = document.getElementById("room2");
roomDosBoton.addEventListener("click", () => {
  let msg = {
    username: User.username,
    id: User.id,
  };
  socket.emit("conectarRoom2", msg);
});
// Room 3
const roomTresBoton = document.getElementById("room3");
roomTresBoton.addEventListener("click", () => {
  let msg = {
    username: User.username,
    id: User.id,
  };
  socket.emit("conectarRoom3", msg);
});
// Room 4
const roomCuatroBoton = document.getElementById("room4");
roomCuatroBoton.addEventListener("click", () => {
  let msg = {
    username: User.username,
    id: User.id,
  };
  socket.emit("conectarRoom4", msg);
});
// Recibe que se conecta
socket.on("connected to room", (msg) => {
  console.log(msg);
  User.roomConnected = msg.room;
  seccionLobby.style.display = "none";
  seccionJuego.style.display = "flex";
  for (let user of msg.users) {
    if (user != User.username) {
      Enemigo.username = user;
    }
  }
  if (msg.users.length == 2) {
    User.puedeJugar = true;
    WalterHabla.innerText = `Podemos empezar a jugar`;
    nombresResultado.innerText = `${User.username} - ${Enemigo.username}`;
  }
});
// Recibe que alguien se conecto
// Room users
socket.on("new connection room", (msg) => {
  actualizarSalas(msg.room, msg.users);
});

// Funciones
// Actualizar stock salas
function actualizarSalas(room, users) {
  const roomUsersUno = document.getElementById("room1Users");
  const roomUsersDos = document.getElementById("room2Users");
  const roomUsersTres = document.getElementById("room3Users");
  const roomUsersCuatro = document.getElementById("room4Users");
  switch (room) {
    case 1:
      roomUsersUno.innerText = `${users.length}/2`;
      break;
    case 2:
      roomUsersDos.innerText = `${users.length}/2`;
      break;
    case 3:
      roomUsersTres.innerText = `${users.length}/2`;
      break;
    case 4:
      roomUsersCuatro.innerText = `${users.length}/2`;
      break;
  }
}

// Conectar
function onUsernameSelection(username) {
  socket.auth = { username };
  socket.connect();
}

// Login
const botonLogin = document.getElementById("iniciarBoton");
const inputUsername = document.getElementById("inputUsername");

botonLogin.addEventListener("click", () => {
  if (inputUsername.value.length < 5) return;
  onUsernameSelection(inputUsername.value);
  User.username = inputUsername.value;
});

// EL JUEGO

// botones
const BotonPiedra = document.getElementById("piedra");
const BotonPapel = document.getElementById("papel");
const BotonTijera = document.getElementById("tijera");

// Elementos de texto
const Respuesta = document.getElementById("respuesta");
const WalterHabla = document.getElementById("walterHabla");
const Resultado = document.getElementById("resultado");
// Variables
let puntajeJugador = 0;
let puntajeWalter = 0;
let opcionesDeJuego = ["Piedra", "Papel", "Tijera"];

// Eleccion del jugador local
BotonPiedra.addEventListener("click", () => {
  if (User.puedeJugar) {
    emitirAServidor("Piedra");
    BotonPiedra.style.backgroundColor = "green";
  }
});

BotonPapel.addEventListener("click", () => {
  if (User.puedeJugar) {
    emitirAServidor("Papel");
    BotonPapel.style.backgroundColor = "green";
  }
});

BotonTijera.addEventListener("click", () => {
  if (User.puedeJugar) {
    emitirAServidor("Tijera");
    BotonTijera.style.backgroundColor = "green";
  }
});

// Emitir a Servidor
function emitirAServidor(jugada) {
  let Jugada = {
    jugada: jugada,
    room: User.roomConnected,
    username: User.username,
  };
  User.jugada = jugada;
  User.yaJugo = true;
  socket.emit("jugada", Jugada);
  WalterHabla.innerText = `Esperando a ${Enemigo.username}...`;
}

// Listener de resultado
socket.on("resultado", (msg) => {
  if (msg == User.username) {
    User.puntaje++;
    WalterHabla.innerText = `Ganaste!`;
    switch (User.jugada) {
      case "Piedra":
        Respuesta.innerHTML = `<i class="fas fa-hand-scissors"></i>`;
        break;
      case "Papel":
        Respuesta.innerHTML = `<i class="fas fa-hand-rock"></i>`;
        break;
      case "Tijera":
        Respuesta.innerHTML = `<i class="fas fa-hand-paper"></i>`;
        break;
    }
  } else if (msg == "Empate") {
    WalterHabla.innerText = `Empate!`;
    switch (User.jugada) {
      case "Piedra":
        Respuesta.innerHTML = `<i class="fas fa-hand-rock"></i>`;
        break;
      case "Papel":
        Respuesta.innerHTML = `<i class="fas fa-hand-paper"></i>`;
        break;
      case "Tijera":
        Respuesta.innerHTML = `<i class="fas fa-hand-scissors"></i>`;
        break;
    }
  } else {
    Enemigo.puntaje++;
    WalterHabla.innerText = `Perdiste!`;
    switch (User.jugada) {
      case "Piedra":
        Respuesta.innerHTML = `<i class="fas fa-hand-paper"></i>`;
        break;
      case "Papel":
        Respuesta.innerHTML = `<i class="fas fa-hand-scissors"></i>`;
        break;
      case "Tijera":
        Respuesta.innerHTML = `<i class="fas fa-hand-rock"></i>`;
        break;
    }
  }
  Resultado.innerText = `${User.puntaje} - ${Enemigo.puntaje}`;
  setTimeout(() => {
    BotonPiedra.removeAttribute("style");
    BotonPapel.removeAttribute("style");
    BotonTijera.removeAttribute("style");
  }, 1000 * 2);
});

// Funciones del juego
function resolverJuego(eleccionDeJugador) {
  let eleccionDeWalter =
    opcionesDeJuego[Math.floor(Math.random() * opcionesDeJuego.length)];
  resolverResultado(eleccionDeJugador, eleccionDeWalter);
}

function resolverResultado(jugador, walter) {
  Respuesta.removeAttribute("style");
  switch (jugador) {
    case "Piedra":
      if (walter == "Papel") {
        Respuesta.innerHTML = `<i class="fas fa-hand-paper"></i>`;
        actualizarPuntaje("pierde", jugador);
      } else if (walter == "Tijera") {
        Respuesta.style.transform = "rotate(270deg)";
        Respuesta.innerHTML = `<i class="fas fa-hand-scissors"></i>`;
        actualizarPuntaje("gana", jugador);
      } else if (walter == "Piedra") {
        Respuesta.innerHTML = `<i class="fas fa-hand-rock"></i>`;
        actualizarPuntaje("empate", jugador);
      }
      break;

    case "Papel":
      if (walter == "Papel") {
        Respuesta.innerHTML = `<i class="fas fa-hand-paper"></i>`;
        actualizarPuntaje("empate", jugador);
      } else if (walter == "Tijera") {
        Respuesta.style.transform = "rotate(270deg)";
        Respuesta.innerHTML = `<i class="fas fa-hand-scissors"></i>`;
        actualizarPuntaje("pierde", jugador);
      } else if (walter == "Piedra") {
        Respuesta.innerHTML = `<i class="fas fa-hand-rock"></i>`;
        actualizarPuntaje("gana", jugador);
      }
      break;

    case "Tijera":
      if (walter == "Papel") {
        Respuesta.innerHTML = `<i class="fas fa-hand-paper"></i>`;
        actualizarPuntaje("gana", jugador);
      } else if (walter == "Tijera") {
        Respuesta.style.transform = "rotate(270deg)";
        Respuesta.innerHTML = `<i class="fas fa-hand-scissors"></i>`;
        actualizarPuntaje("empate", jugador);
      } else if (walter == "Piedra") {
        Respuesta.innerHTML = `<i class="fas fa-hand-rock"></i>`;
        actualizarPuntaje("pierde", jugador);
      }
      break;
  }
}

function actualizarPuntaje(caso, jugadaJugador) {
  switch (caso) {
    case "gana":
      puntajeJugador++;
      WalterHabla.innerText = `Uh me ganaste`;
      if (jugadaJugador == "Piedra") {
        backgroundColor(BotonPiedra, "green");
      } else if (jugadaJugador == "Tijera") {
        backgroundColor(BotonTijera, "green");
      } else if (jugadaJugador == "Papel") {
        backgroundColor(BotonPapel, "green");
      }
      break;

    case "pierde":
      puntajeWalter++;
      WalterHabla.innerText = `No sabes sumar, beso`;
      if (jugadaJugador == "Piedra") {
        backgroundColor(BotonPiedra, "red");
      } else if (jugadaJugador == "Tijera") {
        backgroundColor(BotonTijera, "red");
      } else if (jugadaJugador == "Papel") {
        backgroundColor(BotonPapel, "red");
      }
      break;

    case "empate":
      WalterHabla.innerText = `Bue empatamos`;
      if (jugadaJugador == "Piedra") {
        backgroundColor(BotonPiedra, "yellow");
      } else if (jugadaJugador == "Tijera") {
        backgroundColor(BotonTijera, "yellow");
      } else if (jugadaJugador == "Papel") {
        backgroundColor(BotonPapel, "yellow");
      }
      break;
  }
  Resultado.innerText = `${puntajeJugador} - ${puntajeWalter}`;
}

function backgroundColor(objeto, color) {
  objeto.style.backgroundColor = color;
  setTimeout(() => {
    objeto.removeAttribute("style");
  }, 400);
}
