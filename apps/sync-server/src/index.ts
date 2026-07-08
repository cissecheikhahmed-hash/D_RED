import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { router } from "./routes.js";
import { attachIo } from "./realtime.js";
import { store } from "./store.js";
import { demarrerBoucleAutonome } from "./autonomieEngine.js";

const PORT = 4000;

// Origines des deux apps front-end en développement local — pas de "*" pour rester explicite sur le périmètre du prototype.
const ORIGINES_AUTORISEES = ["http://localhost:3000", "http://localhost:3001"];

const app = express();
app.use(cors({ origin: ORIGINES_AUTORISEES }));
app.use(express.json());
app.use(router);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ORIGINES_AUTORISEES },
});
attachIo(io);

io.on("connection", (socket) => {
  socket.emit("state:sync", store.snapshot());
});

demarrerBoucleAutonome();

httpServer.listen(PORT, () => {
  console.log(`D.RED sync-server à l'écoute sur http://localhost:${PORT}`);
});
