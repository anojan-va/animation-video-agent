# AI Kinetic Video Agent - Complete Setup Guide

Your application is now **fully deployed** to Hugging Face Spaces with complete end-to-end video generation!

## 🎯 What You Have

A complete AI video generation pipeline:

```
Upload Audio + Script
        ↓
Generate Assets (FLUX + RMBG-1.4)
        ↓
Render Video (Remotion)
        ↓
Download MP4
```

## 🚀 Getting Started (5 minutes)

### Step 1: Add Secrets to Hugging Face

1. Go to: https://huggingface.co/spaces/anojan1991/ai-kinetic-video-agent
2. Click **Settings** (gear icon)
3. Scroll to **"Repository secrets"**
4. Add two secrets:

**Secret 1: Together.ai Token**
- Name: `TOGETHER_BEARER_TOKEN`
- Value: Your Together.ai bearer token

**Secret 2: Hugging Face Token**
- Name: `HUGGINGFACE_TOKEN`
- Value: Your Hugging Face access token

### Step 2: Restart Space

1. Click **"Restart"** button
2. Wait for "Running" status (5-15 minutes)

### Step 3: Use the App

1. **Upload Files**
   - Audio file (MP3/WAV)
   - Script file (JSON)

2. **Generate Assets**
   - Click "Start Generation"
   - Watch logs for progress
   - Wait for completion (2-3 minutes)

3. **Render Video**
   - Click "Render Video"
   - Watch rendering progress
   - Wait for completion (5-10 minutes)

4. **Download**
   - Click "Download Video"
   - Save MP4 to your computer

## 📋 Requirements

### Tokens Needed

1. **Together.ai Bearer Token**
   - Get from: https://together.ai
   - Format: `tgp_v1_...`
   - Used for: Image generation (FLUX.1-schnell)

2. **Hugging Face Access Token**
   - Get from: https://huggingface.co/settings/tokens
   - Format: `hf_...`
   - Used for: Background removal (RMBG-1.4)

### Files Needed

1. **Audio File**
   - Format: MP3, WAV, or similar
   - Duration: Any length
   - Used for: Video audio track

2. **Script File**
   - Format: JSON
   - Structure: See example below
   - Used for: Asset generation and video composition

### Example Script

```json
{
  "title": "My Video",
  "duration": 30,
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "layout": "default",
  "scenes": [
    {
      "type": "visual",
      "prompt": "A beautiful landscape with mountains",
      "duration": 5,
      "motion": "slide_in_left"
    },
    {
      "type": "text",
      "content": "Welcome to my video!",
      "duration": 3,
      "motion": "pop_in"
    }
  ]
}
```

## 🔧 Components

### Backend (FastAPI)
- Asset generation with idempotency
- Retry logic with exponential backoff
- WebSocket for real-time logs
- Video rendering API

### Frontend (React + Vite)
- File upload UI
- Real-time log console
- Asset preview grid
- Progress tracking
- Render button
- Download button

### Renderer (Remotion)
- Video composition
- Motion presets
- Layout templates
- FFmpeg encoding

## 📊 Performance

### Asset Generation
- Per asset: 6-32 seconds
- 5 assets: 2-3 minutes

### Video Rendering
- Typical: 5-10 minutes
- Long videos: 10-20 minutes

### Total Time
- Small project: 7-13 minutes
- Large project: 15-30 minutes

## 🎨 Customization

### Layouts
Edit `remotion/src/config/Layouts.ts`:
- `default` - Standard layout
- `narrator_left_prop_right` - Narrator on left
- `centered` - Centered content
- `split_horizontal` - Split screen

### Motion Presets
Edit `remotion/src/config/MotionPresets.ts`:
- `slide_in_left/right` - Sliding animation
- `pop_in` - Pop animation
- `shake` - Shake effect
- `highlight_red` - Red highlight
- `fade_in` - Fade animation
- `bounce` - Bounce effect

### Video Settings
Edit `remotion/src/Video.tsx`:
- Resolution (1920x1080)
- Frame rate (30fps)
- Duration
- Colors

## 🔐 Security

✅ Secrets stored securely in Hugging Face
✅ No tokens in code or git history
✅ CORS enabled for frontend
✅ File upload validation
✅ API authentication ready

## 📚 Documentation

- **REMOTION_DEPLOYMENT.md** - Remotion integration details
- **HUGGINGFACE_SECRETS_SETUP.md** - Secret setup guide
- **TRANSPARENT_IMAGES_SETUP.md** - Background removal guide
- **TOGETHER_AI_INTEGRATION.md** - Image generation guide
- **QUICKSTART.md** - Quick reference

## 🐛 Troubleshooting

### "TOGETHER_BEARER_TOKEN not set"
→ Add secret to Hugging Face Settings

### "HUGGINGFACE_TOKEN not set"
→ Add secret to Hugging Face Settings

### "No assets generated yet"
→ Click "Start Generation" first

### "Render failed"
→ Check logs for specific error

### Space is slow
→ Normal for free tier, wait for completion

### Video not found
→ Check logs, rendering may still be in progress

## 📞 Support

- **Remotion**: https://www.remotion.dev/docs
- **Together.ai**: https://together.ai/docs
- **Hugging Face**: https://huggingface.co/docs/hub
- **FFmpeg**: https://ffmpeg.org/documentation.html

## ✅ Checklist

- [ ] Add TOGETHER_BEARER_TOKEN secret
- [ ] Add HUGGINGFACE_TOKEN secret
- [ ] Restart Space
- [ ] Wait for "Running" status
- [ ] Upload audio file
- [ ] Upload script file
- [ ] Click "Start Generation"
- [ ] Wait for assets to complete
- [ ] Click "Render Video"
- [ ] Wait for video to complete
- [ ] Click "Download Video"
- [ ] Share your video!

## 🎉 You're All Set!

Your AI Kinetic Video Agent is ready to use. Start creating amazing videos!

---

**Space URL**: https://huggingface.co/spaces/anojan1991/ai-kinetic-video-agent
**Status**: ✅ Deployed and Ready
**Last Updated**: December 6, 2025
