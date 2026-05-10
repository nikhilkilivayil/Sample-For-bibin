# Sample-For-bibin — RideHail (Uber-like clone)

A full-stack ride-hailing demo with a Node.js + Socket.IO backend and a React
Native (Expo) mobile app for both riders and drivers.

```
.
├── server/   # Node.js + Express + MongoDB + Socket.IO API
└── mobile/   # React Native (Expo) app for riders and drivers
```

## Features

### Rider
- Email/password sign up and sign in
- Live map with current location pin
- Choose vehicle type (Pool / Standard / Premium)
- Fare and ETA estimate before requesting
- Request ride and watch driver approach in real time
- Cancel ride, view trip history, rate the driver

### Driver
- Driver-specific sign up (license, vehicle details)
- Go online / offline toggle
- Receive nearby ride requests as live push events
- Accept ride, mark "arrived", "start trip", "complete"
- Periodic GPS location stream while online

### Server
- JWT-authenticated REST API (Express + express-validator)
- MongoDB via Mongoose with `2dsphere` geo index for matching
- Real-time channel via Socket.IO (rider/driver location, ride events, chat)
- Distance-based fare engine with three vehicle tiers

## Server — quick start

```bash
cd server
cp .env.example .env       # set MONGO_URI and JWT_SECRET
npm install
npm run dev                # http://localhost:4000
```

Health check: `GET http://localhost:4000/health`

### Key endpoints

| Method | Path                          | Description                          |
| ------ | ----------------------------- | ------------------------------------ |
| POST   | `/api/auth/register`          | Register rider or driver             |
| POST   | `/api/auth/login`             | Login, returns JWT                   |
| GET    | `/api/auth/me`                | Current user                         |
| POST   | `/api/rides/estimate`         | Fare/ETA estimate                    |
| POST   | `/api/rides`                  | Create ride request (rider)          |
| POST   | `/api/rides/:id/accept`       | Accept ride (driver)                 |
| POST   | `/api/rides/:id/arrived\|start\|complete` | Driver lifecycle           |
| POST   | `/api/rides/:id/cancel`       | Cancel ride (either party)           |
| POST   | `/api/rides/:id/rate`         | Rate completed ride                  |
| GET    | `/api/rides/history`          | List your rides                      |
| GET    | `/api/drivers/nearby`         | Search nearby online drivers         |
| POST   | `/api/drivers/status`         | Toggle online/offline                |
| POST   | `/api/drivers/location`       | Push driver location                 |

### Socket.IO events

Authenticate with JWT via `socket.handshake.auth.token`.

- `ride:new` — pushed to candidate drivers when a rider requests a ride
- `ride:accepted` / `ride:driver_arrived` / `ride:in_progress` / `ride:completed` / `ride:cancelled`
- `driver:location` (driver → server → ride room)
- `rider:location`
- `chat:message` — in-trip messaging

## Mobile — quick start

```bash
cd mobile
npm install
npx expo start
```

Open the Expo dev menu and run on iOS Simulator, Android Emulator, or Expo Go on
a physical device.

The mobile app reads the API URL from `app.json → expo.extra.apiBaseUrl`.
For physical devices, replace `http://localhost:4000` with your machine's LAN
IP (e.g. `http://192.168.1.50:4000`).

### Project layout (mobile)

```
mobile/src/
  components/     # Button, Input, Screen, MapPlaceholder
  context/        # Auth + Socket providers
  navigation/     # Root, Rider tabs, Driver tabs
  screens/        # Login, Register, Rider/Driver home, Tracking, History, Profile
  services/       # axios API client
  utils/          # theme, location helpers
```

## Architecture notes

- **Driver matching** is a `$nearSphere` query against the `Driver.location`
  geo index, filtered by `isOnline`, `isAvailable`, and optional vehicle type.
- **Real-time** is Socket.IO with three room types: per-user (`user:<id>`),
  per-ride (`ride:<id>`), and `drivers` for broadcast.
- **Auth** is stateless JWT; the same token is used for HTTP and socket auth.
- **Fares** are computed server-side; the client only renders an estimate.

## Development tips

- Test without a real map: `MapPlaceholder` falls back to a textual preview if
  `react-native-maps` is unavailable (e.g. on web).
- Seed a driver and request a ride from a second account on a different device
  or simulator to see the live flow.
- Set `CORS_ORIGIN` in the server `.env` to your Expo dev URL when needed.
