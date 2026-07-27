const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// Store active rooms: { [pinCode]: { members: Set, state: { currentTime, isPlaying, playbackRate, animeId, ep } } }
const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoomPin = null;
  let username = `User_${Math.floor(1000 + Math.random() * 9000)}`;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'CREATE_ROOM': {
          const pin = data.pin;
          rooms.set(pin, {
            members: new Set([ws]),
            state: { currentTime: 0, isPlaying: false, playbackRate: 1.0 }
          });
          currentRoomPin = pin;
          ws.send(JSON.stringify({ type: 'ROOM_CREATED', pin, username }));
          break;
        }

        case 'JOIN_ROOM': {
          const pin = data.pin;
          if (rooms.has(pin)) {
            const room = rooms.get(pin);
            room.members.add(ws);
            currentRoomPin = pin;
            ws.send(JSON.stringify({ type: 'ROOM_JOINED', pin, state: room.state, username }));
            
            // Broadcast member join to room
            broadcastToRoom(pin, { type: 'CHAT_MESSAGE', user: 'Система', text: `${username} присоединился к комнате` });
          } else {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Комната с таким ПИН-кодом не найдена' }));
          }
          break;
        }

        case 'SYNC_PLAYBACK': {
          // Play/Pause, Seek, Speed change synchronization
          if (currentRoomPin && rooms.has(currentRoomPin)) {
            const room = rooms.get(currentRoomPin);
            room.state = { ...room.state, ...data.payload };
            broadcastToRoom(currentRoomPin, {
              type: 'PLAYBACK_UPDATED',
              payload: room.state,
              sender: username
            }, ws);
          }
          break;
        }

        case 'SEND_CHAT': {
          if (currentRoomPin) {
            broadcastToRoom(currentRoomPin, {
              type: 'CHAT_MESSAGE',
              user: username,
              text: data.text,
              time: new Date().toLocaleTimeString().slice(0, 5)
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomPin && rooms.has(currentRoomPin)) {
      const room = rooms.get(currentRoomPin);
      room.members.delete(ws);
      if (room.members.size === 0) {
        rooms.delete(currentRoomPin);
      } else {
        broadcastToRoom(currentRoomPin, { type: 'CHAT_MESSAGE', user: 'Система', text: `${username} покинул комнату` });
      }
    }
  });
});

function broadcastToRoom(pin, data, excludeWs = null) {
  const room = rooms.get(pin);
  if (!room) return;
  const jsonStr = JSON.stringify(data);
  for (const client of room.members) {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(jsonStr);
    }
  }
}

console.log(`Watch Party WebSocket Server running on port ${PORT}`);
