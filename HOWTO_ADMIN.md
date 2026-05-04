# Admin Guide: Course Management

The Admin Panel at `/app/admin/courses` is where approved course curators manage the academy course catalog.

## Access Control

Only users with `role = 'admin'` in the `users` table can access:
- `/app/admin/courses`
- `/app/admin/users`
- `/app/admin/payments`

## Course Quality Requirements

### Before Publishing

Every course must meet these standards:

1. **Video Source**: YouTube only
   - Embed-enabled videos
   - Not private or deleted
   - Responsive 16:9 iframe

2. **Quality Score** (0-100)
   - Official courses: 95-100
   - Curated quality: 80-94
   - Community content: 70-79
   - Under 70: Not approved

3. **Metadata**
   - Title (required)
   - Description (required)
   - Category (required)
   - Tags (recommended)
   - Thumbnail (auto from YouTube)

4. **Review Date**
   - All courses: `last_reviewed_at` must be set
   - Ads courses: review every 180 days

5. **Certification**
   - Official resources only (Google, Meta, HubSpot): "Certificate"
   - YouTube courses: "WatShop Completion Badge"
   - Never call YouTube content "Certificate"

## Adding Courses

### Option 1: Manual Entry

1. Click **Add Course** button
2. Enter details:
   - Title
   - Category
   - YouTube URL
   - Description
   - Quality score
   - Flags (recommended, official, certificate)

3. Click **Preview** to verify embed works
4. Click **Create Course**

### Option 2: YouTube URL Auto-Import

1. Paste YouTube URL:
   - `youtube.com/watch?v=VIDEO_ID`
   - `youtu.be/VIDEO_ID`
   - `youtube.com/playlist?list=PLAYLIST_ID`

2. Click **Preview** → auto-extracts:
   - Thumbnail
   - Title
   - Description
   - Video/playlist type

3. Review and publish

### Option 3: Bulk CSV Import

**CSV Format:**

```csv
title,description,category,youtube_url,quality_score,is_official,is_recommended
Google Ads Fundamentals,Complete Google Ads training,google-ads,https://youtu.be/VIDEO_ID,95,true,true
Meta Blueprint Course,Official Meta Ads course,meta-ads,https://youtube.com/watch?v=VIDEO_ID,90,true,true
```

**Steps:**

1. Click **Bulk Import**
2. Upload CSV file
3. Preview courses
4. Confirm import

**Valid Categories:**
- `digital-marketing-basics`
- `google-ads`
- `meta-ads`
- `seo`
- `social-media-marketing`
- `youtube-marketing`
- `video-editing`
- `design-canva`
- `ai-marketing`
- `whatsapp-marketing`
- `agency-sales`
- `analytics-reporting`
- `content-creation`
- `freelancing-client-hunting`

## Managing Courses

### Reorder Courses

Drag courses in the list to reorder. Saves automatically.

### Edit Metadata

Click course → **Edit**
- Change title, description, category
- Update quality score
- Adjust flags
- Change thumbnail

### Toggle Flags

**Recommended** - Featured on homepage and learning paths
**Official** - From official sources (Google, Meta, HubSpot, YouTube)
**Certificate** - Only for official sources
**Outdated** - Hidden from catalog but not deleted

### Health Check

Checks for broken embeds:

```bash
# Run manually
pnpm run healthcheck

# Or via admin panel
Click course → Health Check button
```

**Broken video warning signs:**
- `This video is unavailable`
- `This video is private`
- `No embed allowed`
- 404 on thumbnail

**Actions:**
1. Check if video still exists at original YouTube URL
2. If deleted: mark **Outdated**, don't delete
3. If embed disabled: Contact creator for permission or replace
4. If moved: Update YouTube URL and re-check

## Review Queue

Courses needing review appear in **Needs Review** list when:

1. **Age**: Older than 180 days (ads courses especially)
2. **Flagged**: Manually marked for review
3. **Broken**: Video embed failed health check

**Review Process:**

1. Click course in queue
2. Verify still relevant and working
3. Update metadata if changed
4. Check quality score accuracy
5. Set `last_reviewed_at = NOW()`
6. **Approve** or mark **Outdated**

## Official Course Seeds

The app pre-seeds these official courses:

### Google
- **Google Skillshop**
  - URL: youtube.com/playlist?list=PLvRfRvRoVNx...
  - Quality: 100
  - Certificate: Yes

- **Google Ads Skillshop**
  - URL: youtube.com/playlist?list=PLvRfRvRoVNx...
  - Quality: 100
  - Certificate: Yes

### Meta
- **Meta Blueprint**
  - URL: youtube.com/playlist?list=PLvRfRvRoVNx...
  - Quality: 98
  - Certificate: Yes

- **Meta Ads Manager Learning**
  - URL: youtube.com/playlist?list=PLvRfRvRoVNx...
  - Quality: 95
  - Certificate: Yes

### HubSpot
- **Digital Marketing Certification**
  - Quality: 95
  - Certificate: Yes

- **Social Media Marketing**
  - Quality: 90
  - Certificate: Yes

### YouTube
- **YouTube Creator Academy**
  - Quality: 90
  - Badge: Yes (not certificate)

- **YouTube Creators Official**
  - Quality: 88
  - Badge: Yes

## Learning Paths

Pre-built structured learning:

1. **Beginner to Agency Owner**
   - Digital Marketing Basics
   - Google Ads Fundamentals
   - Social Media Marketing
   - Content Creation

2. **Ads Specialist**
   - Google Ads Advanced
   - Meta Ads Advanced
   - Analytics & Reporting
   - Campaign Management

3. **Social Media Manager**
   - Social Media Fundamentals
   - Content Creation
   - Video Editing
   - Community Management

**To add courses to paths:**
1. Course detail page
2. Click **Add to Path**
3. Select path and order

## Video Embedding

### Supported Formats

✅ Working:
- `youtube.com/watch?v=VIDEO_ID`
- `youtu.be/VIDEO_ID`
- `youtube.com/playlist?list=PLAYLIST_ID`
- `youtube.com/embed/VIDEO_ID`

❌ Not supported:
- Private/unlisted videos
- Videos with embed disabled
- Downloaded/rehosted videos
- Non-YouTube content

### Embedding Code

Automatic iframe generation:

```html
<!-- Single video -->
<iframe
  width="100%"
  height="100%"
  src="https://www.youtube.com/embed/VIDEO_ID?rel=0&modestbranding=1"
  frameborder="0"
  allowFullScreen
></iframe>

<!-- Playlist -->
<iframe
  width="100%"
  height="100%"
  src="https://www.youtube.com/embed/videoseries?list=PLAYLIST_ID&rel=0&modestbranding=1"
  frameborder="0"
  allowFullScreen
></iframe>
```

Parameters:
- `rel=0` - Hide related videos
- `modestbranding=1` - Hide YouTube logo

## Database Queries

### Check Course Status

```sql
SELECT 
  id, title, youtube_url, quality_score, 
  health_status, last_reviewed_at
FROM courses
WHERE active = true
ORDER BY created_at DESC;
```

### Find Broken Videos

```sql
SELECT id, title, youtube_url
FROM courses
WHERE health_status = 'broken'
  OR health_status = 'unknown';
```

### Courses Needing Review

```sql
SELECT 
  id, title, category,
  EXTRACT(DAY FROM NOW() - last_reviewed_at) as days_since_review
FROM courses
WHERE category LIKE '%ads%'
  AND last_reviewed_at < NOW() - INTERVAL '180 days';
```

## Troubleshooting

### Video Won't Embed

1. Test URL directly: `youtube.com/watch?v=VIDEO_ID`
2. If video doesn't exist: Remove course
3. If embed disabled: Contact creator
4. Try different video format

### Import Fails

1. Check CSV format matches template
2. Verify YouTube URLs are valid
3. Check for duplicate titles
4. Try uploading smaller batches

### Course Not Showing Up

1. Check `active = true`
2. Verify quality_score > 70
3. Check category is valid
4. Ensure `last_reviewed_at` is set

### Health Check Error

```bash
# Check logs
pnpm run healthcheck 2>&1 | tail -50

# Test single video
curl -I "https://youtube.com/watch?v=VIDEO_ID"
```

## Best Practices

1. **Always preview before publishing** - Click "Preview" button
2. **Set quality scores honestly** - Don't inflate scores
3. **Review ads courses quarterly** - Set calendar reminder
4. **Replace broken content** - Don't leave broken embeds
5. **Use consistent categories** - Choose from approved list
6. **Write detailed descriptions** - Helps with SEO
7. **Tag courses accurately** - Users search by tags
8. **Mark outdated promptly** - Remove from discovery
9. **Screenshot important videos** - In case creator deletes
10. **Keep learning paths updated** - Remove old, add new

## Support

For issues with the admin panel:
1. Check browser console (F12 → Console tab)
2. Report bugs with screenshot to admin-support
3. Contact platform team for database issues
