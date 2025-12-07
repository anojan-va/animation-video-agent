FROM node:18-bullseye

WORKDIR /app

# Install system dependencies including Chrome and its dependencies
RUN apt-get update && apt-get install -y \
    # Base dependencies
    python3 \
    python3-pip \
    curl \
    wget \
    gnupg \
    xvfb \
    # FFmpeg and media
    ffmpeg \
    # Chrome dependencies
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxdamage1 \
    libxrandr2 \
    libgbm-dev \
    libasound2 \
    libxkbcommon0 \
    libxfixes3 \
    libxcomposite1 \
    libpango-1.0-0 \
    libcairo2 \
    libxss1 \
    libxtst6 \
    fonts-liberation \
    xdg-utils \
    gconf-service \
    # Additional Chrome dependencies
    libglib2.0-0 \
    libnss3-dev \
    libnspr4 \
    libgtk-3-0 \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-khmeros \
    fonts-kacst \
    fonts-freefont-ttf \
    # Build tools
    build-essential \
    libcairo2-dev \
    libpangocairo-1.0-0 \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Chrome environment variables
ENV CHROME_BIN=/usr/bin/google-chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV REMOTION_USER_POLL=1
ENV OPENGL_DISABLE=1
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Install Python backend dependencies
COPY backend/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy app.py (Hugging Face entry point)
COPY app.py .

# Install and build frontend
COPY frontend/package*.json ./frontend/
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm ci && npm run build

# Install remotion dependencies
WORKDIR /app/remotion
COPY remotion/package*.json ./
RUN npm install

# Copy remotion code
COPY remotion/ .

# Create necessary directories
WORKDIR /app
RUN mkdir -p /app/backend/public/assets /app/backend/public/audio /app/backend/public/scripts /app/remotion/out

# Set proper permissions
RUN chmod -R 755 /app

EXPOSE 7860

# Start backend (which serves frontend via app.py)
CMD ["python3", "app.py"]