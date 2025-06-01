const { execSync } = require('child_process');

// Increase Node.js memory limit
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

try {
  // Run Prisma generate
  console.log('Generating Prisma client...');
  execSync('prisma generate', { stdio: 'inherit' });

  // Run Prisma db push
  console.log('Pushing database schema...');
  execSync('prisma db push', { stdio: 'inherit' });

  // Run Next.js build with increased memory
  console.log('Building Next.js application...');
  execSync('next build', { stdio: 'inherit' });

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 