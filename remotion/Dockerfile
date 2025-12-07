FROM node:18

# Install system dependencies for Chrome and Remotion
RUN apt-get update && apt-get install -y \
    ffmpeg \
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
    fonts-liberation \
    xdg-utils \
    wget \
    gconf-service \
    && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt-get install -y ./google-chrome-stable_current_amd64.deb || true

# Set environment variables
ENV CHROME_BIN=/usr/bin/google-chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# Hugging Face Spaces optimizations
ENV REMOTION_USER_POLL=1
ENV OPENGL_DISABLE=1
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create output directory
RUN mkdir -p out

# Set proper permissions
RUN chmod -R 755 /app

# Start command
CMD ["npm", "run", "start"]