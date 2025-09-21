const bcrypt = require('bcryptjs');

// Generate proper bcrypt hashes for passwords
async function generateHashes() {
  console.log('Generating bcrypt hashes...');
  
  const adminPassword = 'admin123';
  const workerPassword = 'worker123';
  
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const workerHash = await bcrypt.hash(workerPassword, 12);
  
  console.log('Admin password hash:', adminHash);
  console.log('Worker password hash:', workerHash);
  
  // Verify the hashes work
  const adminValid = await bcrypt.compare(adminPassword, adminHash);
  const workerValid = await bcrypt.compare(workerPassword, workerHash);
  
  console.log('Admin hash verification:', adminValid);
  console.log('Worker hash verification:', workerValid);
}

generateHashes().catch(console.error);
