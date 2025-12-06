# Quick Setup: Together.ai Bearer Token

## What You Need

Your Together.ai bearer token from the curl command:
```
tgp_v1_DUS_-N0CE5fGZ4EKDiXskwEs1-pMoe2f6LSFw0Rdm3w
```

## Setup Steps

### 1. Create `.env` File

In the project root directory, create a file named `.env`:

```env
TOGETHER_BEARER_TOKEN=tgp_v1_DUS_-N0CE5fGZ4EKDiXskwEs1-pMoe2f6LSFw0Rdm3w
RMBG_API_KEY=your_remove_bg_api_key_here
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

**Replace the token with your actual token!**

### 2. Start Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend will run on `http://localhost:8000`

### 3. Start Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Upload and Generate

1. Open http://localhost:5173 in browser
2. Upload audio file and JSON script
3. Click "Generate"
4. Watch real-time logs
5. Generated images appear in asset grid

## How It Works

1. **You provide**: Bearer token in `.env`
2. **Backend reads**: `TOGETHER_BEARER_TOKEN` environment variable
3. **API call**: Sends request to Together.ai with your token
4. **Image generation**: FLUX.1-schnell creates images
5. **Download**: Images are downloaded and saved locally
6. **Display**: Frontend shows generated images

## Token Format

Your token should look like:
```
tgp_v1_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

- Starts with `tgp_v1_`
- Followed by random characters
- About 50+ characters total

## Troubleshooting

### "Warning: TOGETHER_BEARER_TOKEN not set"

**Problem**: Token not in `.env`

**Solution**:
1. Create `.env` file in project root
2. Add your token: `TOGETHER_BEARER_TOKEN=tgp_v1_...`
3. Restart backend

### "API error: 401 Unauthorized"

**Problem**: Invalid or expired token

**Solution**:
1. Check token is correct
2. Copy entire token (no spaces)
3. Verify token format starts with `tgp_v1_`

### "No image data in response"

**Problem**: API request failed

**Solution**:
1. Check backend logs for error details
2. Verify token is valid
3. Try with simpler prompt

## File Locations

```
ai-kinetic-video-agent/
├── .env                    ← Create this file with your token
├── backend/
│   ├── main.py
│   ├── builder.py         ← Uses TOGETHER_BEARER_TOKEN
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Next Steps

1. ✅ Create `.env` with token
2. ✅ Install dependencies: `pip install -r requirements.txt`
3. ✅ Start backend: `python backend/main.py`
4. ✅ Start frontend: `npm run dev`
5. ✅ Upload files and generate

## Support

- Check `TOGETHER_AI_INTEGRATION.md` for detailed API info
- Check `README.md` for full documentation
- Check backend logs for error messages

---

**Status**: Ready to use
**Token Format**: `tgp_v1_...`
**API**: Together.ai FLUX.1-schnell
