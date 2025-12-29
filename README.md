# SAMVAAD AI

SAMVAAD AI is a comprehensive chat application with AI-powered audio transcription capabilities. The platform enables real-time messaging with advanced speech-to-text features, speaker diarization, and voice conversation analysis.

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [API Endpoints](#api-endpoints)
- [Technologies Used](#technologies-used)
- [Contributing](#contributing)

## Features
- Real-time chat with WebSocket support
- Audio transcription using Whisper ASR
- Speaker diarization to identify different speakers
- Multi-user chat rooms
- User authentication and authorization
- File sharing capabilities
- Responsive UI with dark/light theme support

## Project Structure
```
SAMVAAD AI/
├── ai-services/          # Python FastAPI service for audio processing
│   ├── app/
│   │   ├── routes/
│   │   └── services/
│   ├── .env
│   └── requirements.txt
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   ├── .env
│   └── package.json
└── client/               # React/Vite frontend
    ├── src/
    ├── .env
    └── package.json
```

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Python (v3.8 or higher)
- MongoDB (local installation or cloud instance)
- Docker and Docker Compose (optional, for containerized deployment)

## Installation

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Client Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### AI Services Setup
1. Navigate to the ai-services directory:
   ```bash
   cd ai-services
   ```
2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

### Backend Configuration
1. Copy `.env.sample` to `.env` in the backend directory
2. Update the following variables:
   - `DB_URL`: MongoDB connection string
   - `JWT_SECRET_KEY`: Secret key for JWT tokens
   - `PORT`: Port for the backend server (default: 5000)
   - `CORS_URL`: Frontend URL for CORS (default: http://localhost:3002)

### Client Configuration
1. Copy `.env.sample` to `.env` in the client directory
2. Update the following variables:
   - `VITE_SERVER_URL`: Backend server URL (default: http://localhost:5000)
   - `VITE_SOCKET_URI`: Socket server URL (default: http://localhost:5000)

### AI Services Configuration
1. Create `.env` file in the ai-services directory (or copy from template if available)
2. Set up required environment variables for the AI services

## Running the Application

### Method 1: Manual Start (Development)

1. **Start MongoDB**
   - If using local MongoDB, ensure the MongoDB service is running
   - If using MongoDB Atlas, ensure your connection string is correct in the backend `.env`

2. **Start the backend server**:
   ```bash
   cd backend
   npm run dev
   ```
   The backend will start on `http://localhost:5000`

3. **Start the frontend**:
   ```bash
   cd client
   npm run dev
   ```
   The frontend will start on `http://localhost:3002`

4. **Start the AI services**:
   ```bash
   cd ai-services
   uvicorn app.main:app --reload --port 8000
   ```
   The AI services will start on `http://localhost:8000`

### Method 2: Using Docker (Recommended)

1. Ensure Docker and Docker Compose are installed
2. Navigate to the project root directory
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
   This will start all services (backend, frontend, MongoDB) with a single command

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
CORS_URL=http://localhost:3002
SERVER_URL=http://localhost:5000
DB_URL=mongodb://mongod:27017
DB_NAME=ZenChat
DB_MIN_POOL_SIZE=2
DB_MAX_POOL_SIZE=5
COOKIE_VALIDITY_SEC=172800
ACCESS_TOKEN_VALIDITY_SEC=182800
REFRESH_TOKEN_VALIDITY_SEC=604800
TOKEN_ISSUER=api.zenchat.com
TOKEN_AUDIENCE=zenchat.com
JWT_SECRET_KEY=your-super-secret-jwt-key-here
```

#### Client (.env)
```env
VITE_SERVER_URL=http://localhost:5000/
VITE_SOCKET_URI=http://localhost:5000
VITE_SIGNALLING_SERVER_URL=https://signallingserver.bytenode.xyz/
```

## API Endpoints

### Backend API
- `GET /health` - Health check endpoint
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /api/chat` - Get user chats
- `POST /api/chat/access` - Access a chat
- `POST /api/chat/create-group` - Create a group chat
- `DELETE /api/chat/:chatId` - Delete a chat
- `GET /api/messages/:chatId` - Get messages for a chat
- `POST /api/messages` - Send a message

### AI Services API
- `GET /` - Health check
- `POST /api/transcribe` - Transcribe audio file with speaker diarization

## Technologies Used

### Backend
- Node.js
- TypeScript
- Express.js
- MongoDB with Mongoose ODM
- Socket.io for real-time communication
- JWT for authentication
- BCrypt for password hashing

### Frontend
- React.js
- Vite (bundler)
- Tailwind CSS
- Socket.io-client
- React Router DOM

### AI Services
- Python
- FastAPI
- PyTorch
- Hugging Face Transformers
- Faster Whisper
- Pyannote.audio

### Other Tools
- Docker & Docker Compose
- Nodemon (development)
- ESLint

## Docker Deployment

The project includes a `docker-compose.yml` file for easy containerized deployment:

```yaml
version: "3.8"

services:
  backend:
    build:
      context: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    depends_on:
      - mongo
    volumes:
      - zenchatbackend_data:/app

  client:
    build:
      context: ./client
    ports:
      - "3002:80"
    env_file:
      - ./client/.env
    depends_on:
      - backend

  mongo:
    image: mongo:latest
    container_name: mongod
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=ZenChat

volumes:
  mongo_data:
  zenchatbackend_data:
```

To deploy with Docker:
1. Ensure all environment files are configured properly
2. Run `docker-compose up --build` from the project root

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

