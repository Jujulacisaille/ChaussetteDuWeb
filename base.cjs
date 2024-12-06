const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL client React
    methods: ["GET", "POST"], 
  },
});

let waitingPlayer = null; // Joueur en attente
let games = {}; // Suivi des parties actives

io.on("connection", (socket) => {
  console.log(`Joueur connecté : ${socket.id}`);

  // Permet de créer une partie si 2 joueurs sont connectés 
  if (waitingPlayer) {
    const roomId = `${waitingPlayer.id}-${socket.id}`;
    games[roomId] = {
      white: waitingPlayer.id,
      black: socket.id,
    };

    socket.join(roomId);
    waitingPlayer.join(roomId);

    // Rôles des joueurs
    io.to(roomId).emit("startGame", { roomId, color: "black" });
    io.to(waitingPlayer.id).emit("startGame", { roomId, color: "white" });

    waitingPlayer = null;
  } else {
    // Si Il n'y a pas de joueurs met le joueur connecté en attente
    waitingPlayer = socket;
    socket.emit("waiting", "En attente d'un deuxième joueur...");
  }

  // Gestion des déplacements
  socket.on("move", ({ roomId, move }) => {
    socket.to(roomId).emit("move", move);
  });

  // Gestion des messages de chat
  socket.on("chatMessage", ({ roomId, message }) => {
    const role = games[roomId].white === socket.id ? "white" : "black"; // Rôle basé sur la couleur
    io.to(roomId).emit("chatMessage", { user: role, text: message }); // Rôle envoyé au client
  });
  

  // Déconnexion du joueur
  socket.on("disconnect", () => {
    console.log(`Joueur déconnecté : ${socket.id}`);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }

    // Retirer le joueur de toutes les salles actives
    Object.keys(games).forEach((roomId) => {
      if (games[roomId].white === socket.id || games[roomId].black === socket.id) {
        socket.to(roomId).emit("chatMessage", {
          user: "System",
          text: "Un joueur a quitté la partie.",
        });
        delete games[roomId];
      }
    });
  });
});

server.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
