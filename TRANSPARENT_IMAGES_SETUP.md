# Transparent Images Setup - Quick Guide

Get transparent background images in 3 steps.

## Step 1: Get Hugging Face Token (2 minutes)

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Name: `ai-kinetic-video-agent`
4. Type: `Read`
5. Click "Create token"
6. **Copy the token** (format: `hf_xxxxx...`)

## Step 2: Accept Model License (1 minute)

1. Go to https://huggingface.co/briaai/RMBG-1.4
2. Click "Agree and access repository"
3. Accept license

## Step 3: Configure & Run (2 minutes)

Create `.env` file:

```env
TOGETHER_BEARER_TOKEN=tgp_v1_YOUR_TOKEN_HERE
HUGGINGFACE_TOKEN=hf_YOUR_TOKEN_HERE
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

Start backend:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Start frontend (new terminal):

```bash
cd frontend
npm install
npm run dev
```

## Done! 🎉

Now when you generate assets:
1. Images are created with Together.ai FLUX
2. Backgrounds are removed with Hugging Face RMBG-1.4
3. Transparent PNGs are saved locally
4. Perfect for video overlays!

## What You Get

✅ **Transparent PNG** - No white background
✅ **High Quality** - SOTA background removal
✅ **Free** - No credit card needed
✅ **Automatic** - No manual steps
✅ **Retry Logic** - Handles cold starts

## Logs You'll See

```
[HH:MM:SS] Generating image for avatar_1...
[HH:MM:SS] Generated image URL: https://api.together.ai/shrt/...
[HH:MM:SS] Removing background for avatar_1...
[HH:MM:SS] Sending to Hugging Face RMBG-1.4 (Attempt 1/5)...
[HH:MM:SS] ⏳ Model loading... waiting 10s
[HH:MM:SS] Sending to Hugging Face RMBG-1.4 (Attempt 2/5)...
[HH:MM:SS] ✓ Asset avatar_1 saved with transparent background
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "HUGGINGFACE_TOKEN not set" | Add token to `.env` |
| "API error: 401" | Check token is correct |
| "Model loading... waiting" | Normal, wait for it |
| "Failed after 5 attempts" | Check token, accept license |

## For More Details

See `HUGGINGFACE_RMBG_SETUP.md` for complete documentation.

---

**Time to setup**: ~5 minutes
**Cost**: Free
**Result**: Transparent images for your videos
