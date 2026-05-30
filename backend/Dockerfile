FROM python:3.11-slim

# liboqs (oqs package) compiles from C source — needs these build tools
RUN apt-get update && apt-get install -y \
    cmake ninja-build build-essential libssl-dev git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (cached layer unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

EXPOSE 10000

# Render sets $PORT; fall back to 10000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
