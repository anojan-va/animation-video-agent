# Together.ai FLUX Integration

This document describes the Together.ai FLUX.1-schnell image generation integration.

## Overview

The system now uses **Together.ai's FLUX.1-schnell** model for AI image generation instead of Fal.ai.

### Why Together.ai?

- ✅ Fast generation (4 steps)
- ✅ High quality output (1024x768)
- ✅ Free tier available
- ✅ Simple API
- ✅ No background removal needed (FLUX handles transparency)

## Setup

### 1. Get Bearer Token

1. Go to https://together.ai
2. Sign up for a free account
3. Navigate to API Keys section
4. Copy your bearer token (format: `tgp_v1_...`)

### 2. Configure Environment

Create `.env` file in project root:

```env
TOGETHER_BEARER_TOKEN=tgp_v1_YOUR_TOKEN_HERE
RMBG_API_KEY=your_remove_bg_api_key_here
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
```

## API Details

### Endpoint

```
POST https://api.together.xyz/v1/images/generations
```

### Request Format

```json
{
  "model": "black-forest-labs/FLUX.1-schnell-Free",
  "prompt": "Your image description here",
  "width": 1024,
  "height": 768,
  "steps": 4,
  "n": 1,
  "response_format": "url"
}
```

### Response Format

```json
{
  "id": "oN9FZUv-2kFHot-9a9cfc755df0b2f7-PDX",
  "model": "black-forest-labs/FLUX.1-schnell-Free",
  "object": "list",
  "data": [
    {
      "index": 0,
      "url": "https://api.together.ai/shrt/jfS1HMmumnnmPemB",
      "timings": {
        "inference": 0.9888201747089624
      }
    }
  ]
}
```

## Implementation

### Code Location

File: `backend/builder.py`
Method: `_generate_image()`

### How It Works

1. **Check Idempotency**: Skip if asset already exists
2. **Call Together.ai API**: POST request with prompt
3. **Extract URL**: Get image URL from response
4. **Download Image**: Fetch the generated image
5. **Save Locally**: Store in `/public/assets/`

### Error Handling

- Missing API key: Falls back to placeholder image
- API errors: Logs error and returns None
- Network errors: Retried with exponential backoff
- Download failures: Logs and skips asset

## Configuration

### Image Size

Current: **1024x768** (landscape)

To change, edit `backend/builder.py`:

```python
"width": 1024,    # Change here
"height": 768,    # Change here
```

### Generation Steps

Current: **4 steps** (fast)

Options:
- 1-2 steps: Ultra-fast, lower quality
- 4 steps: Balanced (current)
- 8+ steps: Higher quality, slower

To change:

```python
"steps": 4,  # Change here
```

### Model

Current: **black-forest-labs/FLUX.1-schnell-Free**

Other available models:
- `black-forest-labs/FLUX.1-pro` (higher quality, paid)
- `black-forest-labs/FLUX.1-dev` (development)

## Pricing

### Free Tier

- Limited requests per day
- Suitable for testing
- No credit card required

### Paid Tier

- Pay per image generated
- Typically $0.01-0.05 per image
- Unlimited requests

Check https://together.ai/pricing for current rates.

## Testing

### Test with cURL

```bash
curl --location 'https://api.together.xyz/v1/images/generations' \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "black-forest-labs/FLUX.1-schnell-Free",
    "prompt": "A beautiful sunset over mountains",
    "width": 1024,
    "height": 768,
    "steps": 4,
    "n": 1,
    "response_format": "url"
  }'
```

### Test in Backend

1. Set `TOGETHER_BEARER_TOKEN` in `.env`
2. Start backend: `python backend/main.py`
3. Upload files and generate assets
4. Check logs for image generation status

## Troubleshooting

### "TOGETHER_BEARER_TOKEN not set"

**Problem**: Bearer token not configured

**Solution**:
1. Create `.env` file
2. Add `TOGETHER_BEARER_TOKEN=tgp_v1_YOUR_TOKEN_HERE`
3. Restart backend

### "API error: 401 Unauthorized"

**Problem**: Invalid or expired API key

**Solution**:
1. Check API key at https://together.ai
2. Verify key is copied correctly
3. Regenerate key if needed

### "API error: 429 Too Many Requests"

**Problem**: Rate limit exceeded

**Solution**:
1. Wait a few minutes
2. Upgrade to paid tier
3. Reduce concurrent requests

### "Failed to download image"

**Problem**: Image URL is invalid or expired

**Solution**:
1. Check network connection
2. Verify API response is valid
3. Check Together.ai status page

### "No image data in response"

**Problem**: API returned empty data

**Solution**:
1. Verify prompt is valid
2. Check API key permissions
3. Try simpler prompt

## Performance

### Generation Time

- **Per image**: ~1-2 seconds
- **For 5 assets**: ~10-15 seconds
- **For 10 assets**: ~20-30 seconds

### Optimization Tips

1. **Batch requests**: Generate multiple assets in parallel
2. **Cache results**: Idempotency prevents re-generation
3. **Optimize prompts**: Shorter prompts = faster generation
4. **Use steps=4**: Fast enough for most use cases

## Advanced Usage

### Custom Prompts

Prompts are generated from the script JSON:

```json
{
  "visual_track": [
    {
      "assets": {
        "avatar": "A professional businessman in a suit",
        "prop": "A laptop showing code"
      }
    }
  ]
}
```

### Image Variations

To generate multiple variations:

1. Modify prompt slightly
2. Use different asset IDs
3. System will generate new images

### Prompt Engineering

Good prompts:
- "A professional woman in business attire, high quality, detailed"
- "A modern office desk with laptop and coffee"
- "Anime style character, bright colors, detailed"

Bad prompts:
- "image"
- "thing"
- "stuff"

## Migration from Fal.ai

If you were using Fal.ai before:

1. **Update .env**:
   ```diff
   - FAL_API_KEY=...
   + TOGETHER_API_KEY=...
   ```

2. **No code changes needed**: Already implemented in `builder.py`

3. **Test**: Upload files and verify generation works

## API Documentation

- **Together.ai Docs**: https://docs.together.ai/reference/images-create
- **FLUX Model**: https://huggingface.co/black-forest-labs/FLUX.1-schnell
- **Pricing**: https://together.ai/pricing

## Support

For issues:
1. Check Together.ai status page
2. Review API documentation
3. Check backend logs
4. Try with a simple test prompt

## Future Improvements

- [ ] Support for other FLUX models (pro, dev)
- [ ] Prompt optimization/enhancement
- [ ] Batch API requests
- [ ] Image caching with CDN
- [ ] A/B testing different prompts
- [ ] Cost tracking and optimization

---

**Last Updated**: December 6, 2025
**Status**: ✅ Active
**Model**: FLUX.1-schnell-Free
**Provider**: Together.ai
