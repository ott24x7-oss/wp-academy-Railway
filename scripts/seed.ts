/**
 * Database seed script
 * Populates the database with initial course and learning path data
 *
 * Run with: pnpm run seed
 */

async function main() {
  console.log('🌱 Starting database seed...')

  // TODO: Implement database seeding
  // 1. Seed official courses from Google, Meta, HubSpot, YouTube
  // 2. Seed Hindi and English YouTube courses
  // 3. Seed learning paths
  // 4. Set health_status = unknown for all courses
  // 5. Set last_reviewed_at = NOW() for all courses

  console.log('✅ Seed completed successfully')
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
