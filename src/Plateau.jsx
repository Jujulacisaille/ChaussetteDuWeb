//Améliorations possibles : créer un fichier Chat.jsx pour mettre le composant Chat dedans

// Imports
import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx"; // composant pour générer le plateau d'échecs
import { Chess } from "chess.js";// composant pour les props permettant de déplacer les pièces vérifier les déplacements illégaux
import io from "socket.io-client";


// Connexion au serveur
const socket = io("http://localhost:3000");

// Composant pour le Chat
const Chat = ({ socket, roomId, color }) => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Réception des messages
    socket.on("chatMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    // Nettoyage des messages
    return () => {
      socket.off("chatMessage");
    };
  }, [socket]);

  // Permet d'envoyer un message au serveur Socket.io
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { roomId, message });
      // Vide le champ texte pour le prochain message
      setMessage("");
    }
  };

  return (
    <div>
      <div style={{ height: "200px", overflowY: "scroll", border: "1px solid black" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>
              {msg.user === color ? "moi" : "ennemi"}:
            </strong>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};


 // Composant Plateau
  const Plateau = () => {
    const [game, setGame] = useState(new Chess());
    const [color, setColor] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [waiting, setWaiting] = useState(true);
  
    useEffect(() => {
      // Écran d'attente
      socket.on("waiting", (message) => {
        setWaiting(true);
        console.log(message);
      });
  
      // Début de la partie
      socket.on("startGame", ({ roomId, color }) => {
        setRoomId(roomId);
        setColor(color);
        setWaiting(false);
      });
  
      // Déplacements reçus du serveur
      socket.on("move", (move) => {
        game.move(move);
        setGame(new Chess(game.fen()));
      });
  
      //Nettoyage des événements
      return () => {
        socket.off("waiting");
        socket.off("startGame");
        socket.off("move");
      };
    }, [game]);
    // Fonction pour gérer les déplacements
    const handleMove = (source, target) => {

      // Vérification de la couleur du joueur pour savoir si c'est à lui de jouer
      if (color !== (game.turn() === "w" ? "white" : "black")) {
        console.log("Ce n'est pas votre tour");
        return false;
      }
  
      // Permet d'effectuer un déplacement, on vient par la suite vérifier si le déplacement est légal
      const move = game.move({
        from: source,
        to: target,
        promotion: "q", // Promotion automatique en reine
      });
  
      // Vérification de la légalité du déplacement
      if (!move) {
        console.log("Mouvement illégal");
        return false;
      }
      // Mise à jour du jeu 
      setGame(new Chess(game.fen())); 
      socket.emit("move", { roomId, move });
      return true;
    };
  
    // Verification de qui doit jouer
    const isYourTurn = color === (game.turn() === "w" ? "white" : "black");
  
    return (
      <div style={{ margin: "auto", width: "560px" }}>
        {waiting ? (
          <h1>En attente d'un autre joueur...</h1>
        ) : (
          <>
            <h1>Vous jouez en tant que : {color}</h1>
            <h2>
              {isYourTurn ? "C'est à vous de jouer !" : "En attente de l'adversaire..."}
            </h2>
            {/* le composant Chessboard ici est issus de la librairie chessboardjsx et les différents props viennent de la librairie chess.js. Ils permettent de générer le plateau et les pièces, ainsi que de détecer les déplacements illégaux */}
            <Chessboard
              position={game.fen()}
              draggable={isYourTurn} 
              orientation={color}
              onDrop={({ sourceSquare, targetSquare }) =>
                handleMove(sourceSquare, targetSquare)
              }
            />
            <Chat socket={socket} roomId={roomId} color={color} />
          </>
        )}
      </div>
    );
  };
  
export default Plateau;