const mongoDB = require("./connections/connection");
require("dotenv/config");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT;
const cors = require("cors");
const User = require("./Models/User");
mongoDB();
// Middleware
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

let room1 = [];
let room2 = [];
let room3 = [];
let room4 = [];

let jugadasRoom1 = [];
let jugadasRoom2 = [];
let jugadasRoom3 = [];
let jugadasRoom4 = [];

let puntajeRoom1 = [0, 0];
let puntajeRoom2 = [0, 0];
let puntajeRoom3 = [0, 0];
let puntajeRoom4 = [0, 0];

io.on("connection", async (socket) => {
  // Creacion de usuario
  const users = [];
  let ganadasUser;
  let perdidasUser;
  const getUserData = await User.findOne({ username: socket.username }).exec();
  if (getUserData == null) {
    const nuevoUser = new User({
      username: socket.username,
      ganadas: 0,
      perdidas: 0,
    });
    nuevoUser.save().then((data) => {
      ganadasUser = data.ganadas;
      perdidasUser = data.perdidas;
    });
  }
  for (let [id, socket] of io.of("/").sockets) {
    for (let user of users) {
      if (user.username == socket.username) {
        let err = {
          msg: "Usuario ya existe",
        };
        io.to(id).emit("error", err);
        socket.disconnect();
        return;
      }
    }
    users.push({
      userID: id,
      username: socket.username,
      ganadas: ganadasUser,
      perdidas: perdidasUser,
    });
  }
  // Si todo sale bien conecta y avisa que se conecto
  console.log(`User ${socket.username} connected`);
  socket.emit("users", users);
  let salas = {
    rooms: [room1, room2, room3, room4],
  };
  // Le envia datos de las salas
  io.to(socket.id).emit("datos de salas", salas);
  // Conexion a salas
  socket.on("conectarRoom1", (msg) => {
    if (room1.length >= 2) {
      let err = {
        msg: "Room 1 lleno",
      };
      io.to(msg.id).emit("error", err);
    } else {
      room1.push(msg.username);
      let Message = {
        msg: "Conected to room 1",
        users: room1,
        room: 1,
      };
      socket.join("room1");
      io.to("room1").emit("connected to room", Message);
      let conn = {
        msg: `Nuevo usuario conectado`,
        room: 1,
        users: room1,
      };
      io.emit("new connection room", conn);
    }
  });
  socket.on("conectarRoom2", (msg) => {
    if (room2.length >= 2) {
      let err = {
        msg: "Room 2 lleno",
      };
      io.to(msg.id).emit("error", err);
    } else {
      room2.push(msg.username);
      let Message = {
        msg: "Conected to room 2",
        users: room2,
        room: 2,
      };
      socket.join("room2");
      io.to("room2").emit("connected to room", Message);
      let conn = {
        msg: `Nuevo usuario conectado`,
        room: 2,
        users: room2,
      };
      io.emit("new connection room", conn);
    }
  });
  socket.on("conectarRoom3", (msg) => {
    if (room3.length >= 2) {
      let err = {
        msg: "Room 3 lleno",
      };
      io.to(msg.id).emit("error", err);
    } else {
      room3.push(msg.username);
      let Message = {
        msg: "Conected to room 3",
        users: room3,
        room: 3,
      };
      socket.join("room3");
      io.to("room3").emit("connected to room", Message);
      let conn = {
        msg: `Nuevo usuario conectado`,
        room: 3,
        users: room3,
      };
      io.emit("new connection room", conn);
    }
  });
  socket.on("conectarRoom4", (msg) => {
    if (room4.length >= 2) {
      let err = {
        msg: "Room 4 lleno",
      };
      io.to(msg.id).emit("error", err);
    } else {
      room4.push(msg.username);
      let Message = "";
      if (room4.length == 1) {
        Message = {
          msg: "Conected to room 4",
          users: room4,
          room: 4,
          startPlaying: false,
        };
      } else {
        Message = {
          msg: "Conected to room 4",
          users: room4,
          room: 4,
          startPlaying: true,
        };
      }
      socket.join("room4");
      io.to("room4").emit("connected to room", Message);
      let conn = {
        msg: `Nuevo usuario conectado`,
        room: 4,
        users: room4,
      };
      io.emit("new connection room", conn);
    }
  });
  // En partida
  socket.on("jugada", async (msg) => {
    switch (msg.room) {
      case 1:
        if (room1.length == 2) {
          if (jugadasRoom1.length == 1) {
            if (msg.username == jugadasRoom1[0].username) {
              let msg = {
                msg: `Ya jugaste esta ronda`,
              };
              io.to(socket.id).emit("error", msg);
              return;
            }
          }
          jugadasRoom1.push({ jugada: msg.jugada, username: msg.username });
          console.log("Jugadas de room 1: ");
          console.log(jugadasRoom1);
          if (jugadasRoom1.length == 2) {
            let resultado = resolverPartida(jugadasRoom1[0], jugadasRoom1[1]);
            console.log(`Emitiendo resultado, ganador... ${resultado}`);
            io.to(`room1`).emit("resultado", resultado);
            sumarPuntos(resultado, 1);
            if (puntajeRoom1[0] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room1[0]}`,
                ganador: room1[0],
              };
              // Sumarle ganada al usuario
              const usuarioUp = await User.findOne({
                username: room1[0],
              }).exec();
              let ganadasUsuario = usuarioUp.ganadas++;
              usuarioUp.update({ ganadas: ganadasUsuario }).exec();
              let indexUsuarioUp = users.indexOf(room1[0]);
              users[indexUsuarioUp].ganadas = ganadasUsuario;

              // Sumarle perdida al usuario
              const usuarioUpPer = await User.findOne({
                username: room1[1],
              }).exec();
              let perdidasUsuarioPer = usuarioUpPer.perdidas++;
              usuarioUpPer.update({ perdidas: perdidasUsuarioPer }).exec();
              let indexUsuarioUpPer = users.indexOf(room1[1]);
              users[indexUsuarioUpPer].perdidas = perdidasUsuarioPer;

              io.to("room1").emit("terminar partida", finMsg);
            } else if (puntajeRoom1[1] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room1[1]}`,
                ganador: room1[1],
              };
              // Sumarle ganada al usuario
              const usuarioUp = await User.findOne({
                username: room1[1],
              }).exec();
              let ganadasUsuario = usuarioUp.ganadas++;
              usuarioUp.update({ ganadas: ganadasUsuario }).exec();
              let indexUsuarioUp = users.indexOf(room1[1]);
              users[indexUsuarioUp].ganadas = ganadasUsuario;

              // Sumarle perdida al usuario
              const usuarioUpPer = await User.findOne({
                username: room1[0],
              }).exec();
              let perdidasUsuarioPer = usuarioUpPer.perdidas++;
              usuarioUpPer.update({ perdidas: perdidasUsuarioPer }).exec();
              let indexUsuarioUpPer = users.indexOf(room1[0]);
              users[indexUsuarioUpPer].perdidas = perdidasUsuarioPer;
              io.to("room1").emit("terminar partida", finMsg);
            }
            jugadasRoom1 = [];
          }
        } else {
          let msg = {
            msg: `Faltan jugadores para iniciar`,
          };
          io.to(socket.id).emit("error", msg);
        }
        break;
      case 2:
        if (room2.length == 2) {
          if (jugadasRoom2.length == 1) {
            if (msg.username == jugadasRoom2[0].username) {
              let msg = {
                msg: `Ya jugaste esta ronda`,
              };
              io.to(socket.id).emit("error", msg);
              return;
            }
          }
          jugadasRoom2.push({ jugada: msg.jugada, username: msg.username });
          if (jugadasRoom2.length == 2) {
            let resultado = resolverPartida(jugadasRoom2[0], jugadasRoom2[1]);
            io.to(`room2`).emit("resultado", resultado);
            sumarPuntos(resultado, 2);
            if (puntajeRoom2[0] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room2[0]}`,
                ganador: room2[0],
              };
              io.to("room2").emit("terminar partida", finMsg);
            } else if (puntajeRoom2[1] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room2[1]}`,
                ganador: room2[1],
              };
              io.to("room2").emit("terminar partida", finMsg);
            }
            jugadasRoom2 = [];
          }
        } else {
          let msg = {
            msg: `Faltan jugadores para iniciar`,
          };
          io.to(socket.id).emit("error", msg);
        }
        break;
      case 3:
        if (jugadasRoom3.length == 1) {
          if (msg.username == jugadasRoom3[0].username) {
            let msg = {
              msg: `Ya jugaste esta ronda`,
            };
            io.to(socket.id).emit("error", msg);
            return;
          }
        }
        if (room3.length == 2) {
          jugadasRoom3.push({ jugada: msg.jugada, username: msg.username });
          if (jugadasRoom3.length == 2) {
            let resultado = resolverPartida(jugadasRoom3[0], jugadasRoom3[1]);
            io.to(`room3`).emit("resultado", resultado);
            sumarPuntos(resultado, 3);
            if (puntajeRoom3[0] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room3[0]}`,
                ganador: room3[0],
              };
              io.to("room3").emit("terminar partida", finMsg);
            } else if (puntajeRoom3[1] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room3[1]}`,
                ganador: room3[1],
              };
              io.to("room3").emit("terminar partida", finMsg);
            }
            jugadasRoom3 = [];
          }
        } else {
          let msg = {
            msg: `Faltan jugadores para iniciar`,
          };
          io.to(socket.id).emit("error", msg);
        }
        break;
      case 4:
        if (jugadasRoom4.length == 1) {
          if (msg.username == jugadasRoom4[0].username) {
            let msg = {
              msg: `Ya jugaste esta ronda`,
            };
            io.to(socket.id).emit("error", msg);
            return;
          }
        }
        if (room4.length == 2) {
          jugadasRoom4.push({ jugada: msg.jugada, username: msg.username });
          if (jugadasRoom4.length == 2) {
            let resultado = resolverPartida(jugadasRoom4[0], jugadasRoom4[1]);
            io.to(`room4`).emit("resultado", resultado);
            sumarPuntos(resultado, 4);
            if (puntajeRoom4[0] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room4[0]}`,
                ganador: room4[0],
              };
              io.to("room4").emit("terminar partida", finMsg);
            } else if (puntajeRoom4[1] == 5) {
              let finMsg = {
                msg: `Partida finalizada, ganador ${room4[1]}`,
                ganador: room4[1],
              };
              io.to("room4").emit("terminar partida", finMsg);
            }
            jugadasRoom4 = [];
          }
        } else {
          let msg = {
            msg: `Faltan jugadores para iniciar`,
          };
          io.to(socket.id).emit("error", msg);
        }
        break;
    }
  });

  // Jugador se retira de la sala
  socket.on("retirarse", (msg) => {
    socket.leave(`room${msg.room}`);
    console.log(socket.username);
    switch (msg.room) {
      case 1:
        if (room1.length == 2) {
          let index1 = room1.indexOf(socket.username);
          if (index1 == 0) {
            room1.splice(0, 1);
          } else {
            room1.pop();
          }
        } else {
          room1 = [];
        }
        break;
      case 2:
        if (room2.length == 2) {
          let index2 = room2.indexOf(socket.username);
          if (index2 == 0) {
            room2.splice(0, 1);
          } else {
            room2.pop();
          }
        } else {
          room2 = [];
        }
        break;
      case 3:
        if (room3.length == 2) {
          let index3 = room3.indexOf(socket.username);
          if (index3 == 0) {
            room3.splice(0, 1);
          } else {
            room3.pop();
          }
        } else {
          room3 = [];
        }
        break;
      case 4:
        if (room4.length == 2) {
          let index4 = room4.indexOf(socket.username);
          if (index4 == 0) {
            room4.splice(0, 1);
          } else {
            room4.pop();
          }
        } else {
          room4 = [];
        }
        break;
    }
    let salas = {
      rooms: [room1, room2, room3, room4],
    };
    io.emit("datos de salas", salas);
    let msge = {
      user: socket.username,
      room: msg.room,
    };
    io.to(socket.id).emit("retirado", msge);
  });

  // Al desconectarse
  socket.on("disconnect", () => {
    console.log(`Usuario ${socket.username} se desconecto`);
    let rooms = [room1, room2, room3, room4];
    for (let room of rooms) {
      if (room.includes(socket.username)) {
        let index = room.indexOf(socket.username);
        if (index == 0) {
          room = room.splice(0, 1);
        } else {
          room.pop();
        }
      }
    }
    let salas = {
      rooms: rooms,
    };
    socket.broadcast.emit("datos de salas", salas);
  });
});

http.listen(port, () => {
  console.log(`listening on ${port}`);
});

function resolverPartida(JugadorUno, JugadorDos) {
  let ganador = "";
  switch (JugadorUno.jugada) {
    case "Piedra":
      if (JugadorDos.jugada == "Papel") {
        ganador = JugadorDos.username;
      } else if (JugadorDos.jugada == "Tijera") {
        ganador = JugadorUno.username;
      } else if (JugadorDos.jugada == "Piedra") {
        ganador = "Empate";
      }
      break;

    case "Papel":
      if (JugadorDos.jugada == "Papel") {
        ganador = "Empate";
      } else if (JugadorDos.jugada == "Tijera") {
        ganador = JugadorDos.username;
      } else if (JugadorDos.jugada == "Piedra") {
        ganador = JugadorUno.username;
      }
      break;

    case "Tijera":
      if (JugadorDos.jugada == "Papel") {
        ganador = JugadorUno.username;
      } else if (JugadorDos.jugada == "Tijera") {
        ganador = "Empate";
      } else if (JugadorDos.jugada == "Piedra") {
        ganador = JugadorDos.username;
      }
      break;
  }
  return ganador;
}

function sumarPuntos(resultado, room) {
  if (resultado == "Empate") {
    return;
  } else {
    switch (room) {
      case 1:
        let index1 = room1.indexOf(resultado);
        puntajeRoom1[index1]++;
        break;
      case 2:
        let index2 = room1.indexOf(resultado);
        puntajeRoom2[index2]++;
        break;
      case 3:
        let index3 = room1.indexOf(resultado);
        puntajeRoom3[index3]++;
        break;
      case 4:
        let index4 = room1.indexOf(resultado);
        puntajeRoom4[index4]++;
        break;
    }
  }
}
