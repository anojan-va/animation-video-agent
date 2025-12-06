# Hugging Face Secrets Setup

Your Space is now deployed! Now you need to add your API tokens as Hugging Face Secrets.

## Why Secrets?

Secrets are environment variables that:
- ✅ Are not visible in the code
- ✅ Are not stored in git
- ✅ Are encrypted on Hugging Face
- ✅ Are automatically loaded by the app

## Step 1: Go to Your Space Settings

1. Visit your Space: https://huggingface.co/spaces/anojan1991/ai-kinetic-video-agent
2. Click the **Settings** button (gear icon)
3. Scroll down to **"Repository secrets"**

## Step 2: Add Together.ai Token

1. Click **"Add a secret"**
2. Fill in:
   - **Name**: `TOGETHER_BEARER_TOKEN`
   - **Value**: Your Together.ai bearer token (format: `tgp_v1_...`)
3. Click **"Add secret"**

## Step 3: Add Hugging Face Token

1. Click **"Add a secret"** again
2. Fill in:
   - **Name**: `HUGGINGFACE_TOKEN`
   - **Value**: Your Hugging Face access token (format: `hf_...`)
3. Click **"Add secret"**

## Step 4: Restart the Space

1. Go back to your Space
2. Click the **"Restart"** button (or wait for auto-restart)
3. The app will restart with your secrets loaded

## Step 5: Test

1. Wait for "Running" status
2. Upload audio + JSON script
3. Click "Generate" to create assets
4. Click "Render Video" to generate video
5. Download your video!

## Workflow

```
Upload Files
    ↓
Generate Assets (FLUX + RMBG-1.4)
    ↓
Render Video (Remotion)
    ↓
Download MP4
```

## If It's Not Working

### Check Secrets Are Set

1. Go to Space Settings
2. Verify both secrets are listed:
   - `TOGETHER_BEARER_TOKEN`
   - `HUGGINGFACE_TOKEN`

### Check Logs

1. Click "Logs" in your Space
2. Look for error messages
3. Common issues:
   - "TOGETHER_BEARER_TOKEN not set" → Add secret
   - "HUGGINGFACE_TOKEN not set" → Add secret
   - "API error: 401" → Check token is correct

### Restart Space

1. Click "Restart" button
2. Wait for "Running" status
3. Try again

## Security Notes

✅ Secrets are encrypted
✅ Secrets are not visible in code
✅ Secrets are not in git history
✅ Only you can see them in settings

⚠️ Never commit `.env` files with real tokens
⚠️ Never share your tokens
⚠️ Regenerate tokens if compromised

## Next Steps

1. ✅ Add TOGETHER_BEARER_TOKEN secret
2. ✅ Add HUGGINGFACE_TOKEN secret
3. ✅ Restart Space
4. ✅ Test with file upload
5. ✅ Share your Space URL

Your app is now live and secure! 🎉

---

**Space URL**: https://huggingface.co/spaces/anojan1991/ai-kinetic-video-agent
**Status**: Deployed (waiting for secrets)
