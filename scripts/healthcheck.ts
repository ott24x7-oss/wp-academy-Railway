/**
 * Health check script
 * Verifies all courses can be embedded and checks for broken videos
 *
 * Run with: pnpm run healthcheck
 */

async function main() {
  console.log('🏥 Starting health check...')

  // TODO: Implement health check
  // 1. Query all active courses
  // 2. For each course, verify YouTube embed works
  // 3. Check for:
  //    - Private videos
  //    - Deleted videos
  //    - Embed disabled
  //    - Bad thumbnails
  // 4. Update health_status for each course
  // 5. Log results

  console.log('✅ Health check completed')
}

main().catch((err) => {
  console.error('❌ Health check failed:', err)
  process.exit(1)
})
