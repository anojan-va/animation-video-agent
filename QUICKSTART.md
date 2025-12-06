# Quick Start Guide

Get the AI Kinetic Video Agent up and running in 5 minutes.

## 1. Install Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

### Remotion
```bash
cd remotion
npm install
```

## 2. Configure Environment

Copy and edit the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:
```env
FAL_API_KEY=your_key_here
RMBG_API_KEY=your_key_here
```

## 3. Start Services

Open 3 terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python main.py
```
Runs on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Runs on `http://localhost:5173`

**Terminal 3 - Remotion (optional, for preview):**
```bash
cd remotion
npm run start
```
Runs on `http://localhost:3000`

## 4. Create Your First Video

### Step 1: Prepare Files

Create `my_script.json`:
```json
{
  "project_settings": { "fps": 30 },
  "visual_track": [
    {
      "id": "scene_01",
      "layout": "narrator_left_prop_right",
      "assets": {
        "avatar": {
          "id": "avatar_1",
          "prompt": "Cartoon man in business suit"
        },
        "prop": {
          "id": "prop_1",
          "prompt": "Stack of money"
        }
      }
    }
  ],
  "text_track": [
    {
      "text": "MONEY",
      "start": 0.5,
      "end": 1.5,
      "style": "pop_in"
    }
  ]
}
```

Prepare an audio file: `my_audio.mp3`

### Step 2: Upload and Generate

1. Open `http://localhost:5173`
2. Click "Select Audio" and choose `my_audio.mp3`
3. Click "Select Script" and choose `my_script.json`
4. Click "Start Generation"
5. Watch the live logs and asset grid

### Step 3: Render

Once generation completes:

1. Open `http://localhost:3000` (Remotion)
2. Click "Render" to create the final video
3. Video saves to `remotion/out/video.mp4`

## Common Issues

### "API Key not found"
- Make sure `.env` file exists and has your API keys
- Restart backend after editing `.env`

### "Port already in use"
- Change port in `.env` or kill existing process
- Backend: `BACKEND_PORT=8001`
- Frontend: `npm run dev -- --port 5174`

### "Assets not generating"
- Check API keys are valid
- Check internet connection
- Try clicking "Retry" button

### "WebSocket connection failed"
- Make sure backend is running on port 8000
- Check CORS settings in `backend/main.py`

## Next Steps

- Read `README.md` for full documentation
- Check `examples/example_script.json` for more complex examples
- Explore motion presets in `remotion/src/config/MotionPresets.ts`
- Customize layouts in `remotion/src/config/Layouts.ts`

## Architecture Overview

```
┌─────────────────┐
│   React UI      │ (Frontend)
│  - File Upload  │
│  - Live Logs    │
│  - Asset Grid   │
└────────┬────────┘
         │ WebSocket
         │ HTTP
         ▼
┌─────────────────┐
│   FastAPI       │ (Backend)
│  - Asset Gen    │
│  - Idempotency  │
│  - Retry Logic  │
└────────┬────────┘
         │ File I/O
         ▼
┌─────────────────┐
│   Remotion      │ (Renderer)
│  - Video Comp   │
│  - Text Layer   │
│  - MP4 Export   │
└─────────────────┘
```

## Support

For detailed information, see:
- `README.md` - Full documentation
- `doc/PRD.txt` - Product requirements
- `examples/example_script.json` - Example configuration
