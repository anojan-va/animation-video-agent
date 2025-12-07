FROM node:18-bullseye

WORKDIR /app

# Install system dependencies including FFmpeg, Python, and build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    ffmpeg \
    libcairo2-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgif-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Install frontend dependencies
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Build frontend
COPY frontend/ .
RUN npm run build

# Install remotion dependencies
WORKDIR /app/remotion
COPY remotion/package*.json ./
RUN npm install

# Copy remotion code
COPY remotion/ .

# Create necessary directories
WORKDIR /app
RUN mkdir -p /app/backend/public/assets /app/backend/public/audio /app/backend/public/scripts /app/remotion/out

EXPOSE 7860

# Start both backend and frontend
CMD ["python3", "backend/main.py"]
