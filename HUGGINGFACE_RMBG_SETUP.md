# Hugging Face RMBG-1.4 Setup Guide

Complete guide to set up transparent background removal using Hugging Face's RMBG-1.4 model.

## What is RMBG-1.4?

**RMBG-1.4** (created by BRIA AI) is a state-of-the-art background removal model hosted on Hugging Face.

### Why Use It?

✅ **Free Tier Available** - No credit card required
✅ **High Quality** - Better than standard rembg
✅ **Transparent PNG** - Perfect for video overlays
✅ **Easy Integration** - Simple API
✅ **Hosted** - No local GPU needed

## Step 1: Get Hugging Face Access Token

### 1.1 Create Account

1. Go to https://huggingface.co
2. Click "Sign Up"
3. Complete registration (free)

### 1.2 Create Access Token

1. Go to https://huggingface.co/settings/tokens
2. Click "New token"
3. Configure:
   - **Name**: `ai-kinetic-video-agent`
   - **Type**: `Read`
   - **Expiration**: `Never` (or your preference)
4. Click "Create token"
5. **Copy the token** (format: `hf_xxxxxxxxxxxxx`)

### 1.3 Accept Model License

1. Go to https://huggingface.co/briaai/RMBG-1.4
2. Click "Agree and access repository"
3. Accept the license

## Step 2: Configure Environment

Create `.env` file in project root:

```env
TOGETHER_BEARER_TOKEN=tgp_v1_YOUR_TOKEN_HERE
HUGGINGFACE_TOKEN=hf_YOUR_TOKEN_HERE
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

**Replace** `hf_YOUR_TOKEN_HERE` with your actual token.

## Step 3: How It Works

### Image Processing Pipeline

```
1. Generate Image (Together.ai FLUX)
   ↓
2. Download Image
   ↓
3. Send to Hugging Face RMBG-1.4
   ↓
4. Receive Transparent PNG
   ↓
5. Save Locally
   ↓
6. Display in Frontend
```

### Retry Logic

If the model is "cold" (not running):
- API returns 503 status
- System waits for estimated time
- Automatically retries up to 5 times
- No manual intervention needed

## Step 4: Test Setup

### 4.1 Start Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

You should see:
```
[HH:MM:SS] Uvicorn running on http://0.0.0.0:8000
```

### 4.2 Start Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE v5.0.8 ready in 123 ms
```

### 4.3 Generate Assets

1. Open http://localhost:5173
2. Upload audio file (MP3/WAV)
3. Upload JSON script
4. Click "Generate"
5. Watch logs for background removal

### Expected Logs

```
[HH:MM:SS] Generating image for avatar_1...
[HH:MM:SS] Generated image URL: https://api.together.ai/shrt/...
[HH:MM:SS] Removing background for avatar_1...
[HH:MM:SS] Sending to Hugging Face RMBG-1.4 (Attempt 1/5)...
[HH:MM:SS] ⏳ Model loading... waiting 10s
[HH:MM:SS] Sending to Hugging Face RMBG-1.4 (Attempt 2/5)...
[HH:MM:SS] ✓ Asset avatar_1 saved with transparent background
```

## API Details

### Endpoint

```
POST https://api-inference.huggingface.co/models/briaai/RMBG-1.4
```

### Request

```
Headers:
  Authorization: Bearer hf_YOUR_TOKEN_HERE
  Content-Type: application/octet-stream

Body:
  Raw image bytes (PNG/JPG)
```

### Response

```
Status: 200
Body: PNG image bytes (with transparent background)
```

### Error Responses

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Use image |
| 503 | Model loading | Wait & retry |
| 401 | Invalid token | Check token |
| 400 | Bad request | Check image |
| 429 | Rate limited | Wait & retry |

## Troubleshooting

### "HUGGINGFACE_TOKEN not set"

**Problem**: Token not in `.env`

**Solution**:
1. Create `.env` file in project root
2. Add: `HUGGINGFACE_TOKEN=hf_YOUR_TOKEN_HERE`
3. Restart backend

### "API error: 401 Unauthorized"

**Problem**: Invalid or expired token

**Solution**:
1. Go to https://huggingface.co/settings/tokens
2. Verify token is correct
3. Create new token if needed
4. Update `.env`

### "⏳ Model loading... waiting Xs"

**Problem**: Model is cold (normal on free tier)

**Solution**:
- Wait for model to load
- System automatically retries
- First request takes 10-30 seconds
- Subsequent requests are faster

### "Failed to remove background after 5 attempts"

**Problem**: API consistently failing

**Solution**:
1. Check Hugging Face status: https://status.huggingface.co
2. Verify token has read access
3. Accept model license: https://huggingface.co/briaai/RMBG-1.4
4. Try with simpler image
5. Check internet connection

### Image Not Transparent

**Problem**: Background still visible

**Solution**:
1. Check logs for errors
2. Verify HUGGINGFACE_TOKEN is set
3. Try uploading different image
4. Check image format (PNG/JPG)

## Performance

### Generation Time

| Step | Time |
|------|------|
| Image generation | 1-2s |
| Background removal | 5-30s* |
| **Total per asset** | **6-32s** |

*First request slower due to cold start

### Optimization Tips

1. **Batch requests**: Generate multiple assets in parallel
2. **Cache results**: Idempotency prevents re-processing
3. **Warm up model**: First request triggers loading
4. **Use PNG input**: Slightly faster than JPG

## Pricing

### Free Tier

- ✅ Unlimited requests
- ✅ No credit card required
- ⚠️ Model may sleep (cold start)
- ⚠️ Rate limits apply

### Pro Tier

- Faster inference
- Priority queue
- No cold starts
- Check https://huggingface.co/pricing

## File Structure

```
ai-kinetic-video-agent/
├── .env                    ← Add HUGGINGFACE_TOKEN here
├── backend/
│   ├── main.py
│   ├── builder.py         ← Uses HUGGINGFACE_TOKEN
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
└── README.md
```

## Integration Details

### Code Location

File: `backend/builder.py`
Method: `_remove_background()`

### How It Works

1. **Check token**: Read `HUGGINGFACE_TOKEN` from `.env`
2. **Prepare image**: Use image bytes from FLUX generation
3. **Call API**: POST to Hugging Face with image
4. **Handle cold start**: Retry if model loading (503)
5. **Save result**: Write transparent PNG to disk
6. **Log progress**: Real-time updates to frontend

### Retry Logic

```python
max_retries = 5
for attempt in range(max_retries):
    # Try API call
    if status == 503:  # Model loading
        wait_time = response.estimated_time
        sleep(wait_time)
        continue  # Retry
    elif status == 200:  # Success
        return image
    else:  # Other error
        sleep(2)
        continue  # Retry
```

## Advanced Usage

### Custom Image Size

RMBG-1.4 accepts any image size. Current pipeline:
- Input: 1024x768 (from FLUX)
- Output: Same size with transparent background

### Batch Processing

To process multiple images:
1. Generate all images first
2. Remove backgrounds in parallel
3. System handles retries automatically

### Error Recovery

If background removal fails:
1. Already-generated images are saved
2. Click "Retry" to resume
3. Only failed assets are reprocessed

## Next Steps

1. ✅ Create Hugging Face account
2. ✅ Get access token
3. ✅ Accept RMBG-1.4 license
4. ✅ Add token to `.env`
5. ✅ Start backend and frontend
6. ✅ Upload files and generate

## Support

- **Hugging Face Docs**: https://huggingface.co/briaai/RMBG-1.4
- **Model Card**: https://huggingface.co/briaai/RMBG-1.4
- **Status Page**: https://status.huggingface.co
- **Backend Logs**: Check console output for errors

## FAQ

### Q: Is RMBG-1.4 better than remove.bg?

A: Yes, RMBG-1.4 is generally superior and free on Hugging Face.

### Q: Can I use it without Hugging Face account?

A: No, you need a free account and access token.

### Q: How long does background removal take?

A: 5-30 seconds depending on model state (cold start vs warm).

### Q: Can I process images in parallel?

A: Yes, the system handles concurrent requests with retry logic.

### Q: What image formats are supported?

A: PNG, JPG, WebP, and other common formats.

### Q: Is there a file size limit?

A: Hugging Face has limits (~10MB), but generated images are smaller.

---

**Status**: ✅ Ready to use
**Model**: RMBG-1.4 (BRIA AI)
**Provider**: Hugging Face
**Output**: Transparent PNG
