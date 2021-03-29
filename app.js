const mongoDB = require("./connections/connection");
require("dotenv/config");
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT;

// mongoDB();
// Middleware
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

const room1 = [];
const room2 = [];
const room3 = [];
const room4 = [];

let jugadasRoom1 = [];
let jugadasRoom2 = [];
let jugadasRoom3 = [];
let jugadasRoom4 = [];

io.on("connection", (socket) => {
  // Creacion de usuario
  const users = [];
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
  socket.on("jugada", (msg) => {
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
          room = room.pop();
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
