# Multi-stage Dockerfile for Next.js + Python backend
FROM node:20-alpine AS base

# Install system dependencies for Python packages
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    python3-dev \
    cairo-dev \
    pango-dev \
    gdk-pixbuf-dev \
    libffi-dev \
    jpeg-dev \
    openjpeg-dev \
    zlib-dev \
    freetype-dev \
    lcms2-dev \
    libwebp-dev \
    tcl-dev \
    tk-dev \
    harfbuzz-dev \
    fribidi-dev \
    libimagequant-dev \
    libxcb-dev \
    libxml2-dev \
    libxslt-dev \
    poppler-utils \
    ghostscript

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE $PORT

# Start both services
CMD npm run start:railway