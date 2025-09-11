# Railway Environment Variables

For Railway deployment, set these environment variables in your Railway dashboard:

## Required Variables:
- `PYTHON_API_URL`: `http://localhost:8000` (for Next.js to communicate with Python backend)
- `BACKEND_PORT`: `8000` (port for Python backend server)

## Optional Variables:
- `NODE_ENV`: `production`

The Railway service will automatically set `PORT` for the frontend, and our configuration handles the backend coordination.