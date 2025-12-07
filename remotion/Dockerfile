FROM node:18

WORKDIR /app

# Install system dependencies including Chrome dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    # Chrome dependencies
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libxshmfence1 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxcb1 \
    libx11-6 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    lsb-release \
    xdg-utils \
    wget \
    # Additional dependencies
    libglib2.0-0 \
    libnss3-dev \
    libnspr4 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libcairo2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libgl1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Puppeteer/Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium

# Create a non-root user
RUN groupadd -r remotion && useradd -r -g remotion -G audio,video remotion \
    && mkdir -p /home/remotion/Downloads \
    && chown -R remotion:remotion /home/remotion \
    && chown -R remotion:remotion /app

# Switch to non-root user
USER remotion

# Install Node.js dependencies
COPY --chown=remotion:remotion package*.json ./
RUN npm install

# Copy application code
COPY --chown=remotion:remotion . .

# Create output directory
RUN mkdir -p out

# Set proper permissions
RUN chmod -R 755 /app

CMD ["npm", "run", "start"]