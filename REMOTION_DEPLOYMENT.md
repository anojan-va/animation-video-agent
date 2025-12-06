# Remotion Integration on Hugging Face Spaces

Your AI Kinetic Video Agent now includes **complete end-to-end video generation** on Hugging Face Spaces!

## What's New

✅ **Remotion Renderer** - Integrated into Docker
✅ **Video API Endpoint** - `/api/render-video`
✅ **Render Button** - In the frontend UI
✅ **Download Video** - Direct MP4 download
✅ **Real-time Logs** - Watch rendering progress

## Complete Workflow

```
1. Upload Audio + Script
        ↓
2. Generate Assets
   - Together.ai FLUX (image generation)
   - Hugging Face RMBG-1.4 (background removal)
        ↓
3. Render Video
   - Remotion (video composition)
   - FFmpeg (video encoding)
        ↓
4. Download MP4
   - Ready to share!
```

## What's Included in Docker

### System Dependencies
- **Node.js 18** - JavaScript runtime
- **Python 3** - Backend runtime
- **FFmpeg** - Video encoding
- **Build tools** - C++ compiler, Cairo, Pango

### Node Packages
- **Remotion 4.0.0** - Video composition
- **React 18.2.0** - UI components
- **TypeScript 5.2.2** - Type safety

### Python Packages
- **FastAPI** - Web framework
- **httpx** - HTTP client
- **Pillow** - Image processing

## How It Works

### 1. Asset Generation (5-30 seconds per asset)

```python
# Together.ai FLUX generates image
image_url = "https://api.together.ai/shrt/..."

# Hugging Face RMBG-1.4 removes background
transparent_png = "avatar_1.png"
```

### 2. Video Rendering (2-10 minutes)

```typescript
// Remotion reads assets and config
const config = {
  assets: ["avatar_1.png", "avatar_2.png"],
  script: [...],
  audio: "audio.mp3"
}

// Generates video frame by frame
// FFmpeg encodes to MP4
```

### 3. Download

```
GET /public/video.mp4
→ Downloads video.mp4 to your computer
```

## API Endpoints

### Generate Assets
```
POST /api/generate
Body: {
  "script_path": "/app/backend/public/scripts/script.json",
  "audio_path": "/app/backend/public/audio/audio.mp3"
}
Response: { "status": "started" }
```

### Render Video
```
POST /api/render-video
Response: {
  "status": "success",
  "video_path": "/public/video.mp4",
  "file_size": 12345678
}
```

### Download Video
```
GET /public/video.mp4
Response: Video file (MP4)
```

### Get Status
```
GET /api/status
Response: {
  "status": "ready",
  "generated_assets": 5,
  "total_assets": 5
}
```

## Frontend UI

### Buttons

1. **Start Generation** (Blue)
   - Uploads files
   - Generates assets
   - Shows progress

2. **Render Video** (Purple)
   - Appears when assets ready
   - Starts video rendering
   - Streams logs in real-time

3. **Download Video** (Green)
   - Appears when video ready
   - Downloads MP4 file
   - Shows file size

4. **Retry** (Orange)
   - Appears on error
   - Resumes from where it failed

### Status Indicators

- **Idle** (Gray) - Ready for input
- **Processing** (Blue) - Generating assets
- **Rendering** (Purple) - Creating video
- **Ready** (Green) - Complete
- **Error** (Red) - Something failed

## Performance

### Asset Generation
- Image generation: 1-2 seconds
- Background removal: 5-30 seconds
- Total per asset: 6-32 seconds

### Video Rendering
- Frame rendering: 2-10 minutes
- FFmpeg encoding: 1-3 minutes
- Total: 3-13 minutes

### Example Timeline
```
Upload files: 1s
Generate 5 assets: 2-3 minutes
Render video: 5-10 minutes
Total: 7-13 minutes
```

## Troubleshooting

### "No assets generated yet"
- Click "Start Generation" first
- Wait for all assets to complete
- Check logs for errors

### "Render failed"
- Check assets were generated
- Verify script JSON is valid
- Check logs for specific error

### "Video not found"
- Render may still be in progress
- Check logs for "Video rendered successfully"
- Wait a few minutes and try again

### Rendering is slow
- Normal for free tier
- Remotion needs time to render frames
- FFmpeg needs time to encode
- First render is slower

### Space timeout
- Rendering takes time
- Space may timeout on very long videos
- Try shorter videos first
- Check Hugging Face status page

## Configuration

### Remotion Settings
File: `remotion/remotion.config.ts`

```typescript
export const Config = {
  concurrency: 4,        // Parallel frame rendering
  maxRetries: 3,         // Retry failed frames
  timeoutInMilliseconds: 30000,
};
```

### Video Output
- Resolution: 1920x1080
- Frame rate: 30fps
- Codec: H.264
- Format: MP4

## Customization

### Change Video Resolution
Edit `remotion/src/Video.tsx`:
```typescript
const width = 1920;  // Change this
const height = 1080; // Change this
```

### Add Motion Presets
Edit `remotion/src/config/MotionPresets.ts`:
```typescript
export const MOTION_PRESETS = {
  my_preset: {
    // Your animation config
  }
}
```

### Change Layouts
Edit `remotion/src/config/Layouts.ts`:
```typescript
export const LAYOUTS = {
  my_layout: {
    // Your layout config
  }
}
```

## Deployment Details

### Docker Build
```dockerfile
FROM node:18-bullseye

# Install Python, FFmpeg, build tools
RUN apt-get install -y python3 ffmpeg libcairo2-dev ...

# Install backend dependencies
RUN pip3 install -r backend/requirements.txt

# Build frontend
RUN npm run build

# Install Remotion
RUN npm install remotion
```

### Build Time
- First build: 10-15 minutes
- Subsequent builds: 5-10 minutes

### Storage
- Docker image: ~3-4GB
- Video output: ~50-200MB per video

## Security

✅ Secrets stored in Hugging Face (not in code)
✅ API tokens not in git history
✅ No hardcoded credentials
✅ CORS enabled for frontend
✅ File upload validation

## Monitoring

### Check Logs
1. Go to your Space
2. Click "Logs" tab
3. Watch real-time output

### Common Log Messages
```
[HH:MM:SS] Generating image for avatar_1...
[HH:MM:SS] Generated image URL: https://api.together.ai/shrt/...
[HH:MM:SS] Removing background for avatar_1...
[HH:MM:SS] ✓ Asset avatar_1 saved with transparent background
[HH:MM:SS] 🎬 Starting video rendering...
[HH:MM:SS] [Remotion] Rendering frame 1/900...
[HH:MM:SS] [Remotion] Rendering frame 100/900...
[HH:MM:SS] ✓ Video rendered successfully!
```

## Next Steps

1. ✅ Add secrets to Hugging Face
2. ✅ Restart Space
3. ✅ Upload audio + script
4. ✅ Click "Start Generation"
5. ✅ Click "Render Video"
6. ✅ Download your video!

## Support

- **Remotion Docs**: https://www.remotion.dev/docs
- **Hugging Face Docs**: https://huggingface.co/docs/hub
- **FFmpeg Docs**: https://ffmpeg.org/documentation.html

## FAQ

### Q: Can I use my own Remotion config?
A: Yes! Edit `remotion/src/Video.tsx` and rebuild.

### Q: How long does rendering take?
A: 3-13 minutes depending on video length and complexity.

### Q: Can I download the assets?
A: Yes! They're in `/public/assets/` folder.

### Q: Can I use different layouts?
A: Yes! Edit `remotion/src/config/Layouts.ts`.

### Q: Can I add custom motion presets?
A: Yes! Edit `remotion/src/config/MotionPresets.ts`.

### Q: What video formats are supported?
A: Currently MP4. Can add others by modifying Remotion config.

### Q: Can I render multiple videos?
A: Yes! Each render creates a new `video.mp4`.

### Q: Is there a video length limit?
A: No hard limit, but very long videos may timeout.

---

**Status**: ✅ Complete end-to-end pipeline
**Components**: Backend + Frontend + Remotion
**Deployment**: Hugging Face Spaces (Docker)
**Ready**: Yes!
