const fs = require('fs');
const path = require('path');

// Test script to verify microservices setup without Docker
console.log('Testing Microservices Architecture Setup (Without Docker)...\n');

const services = [
    { name: 'api-gateway', type: 'node', files: ['package.json', 'server.js'] },
    { name: 'metadata-service', type: 'python', files: ['requirements.txt', 'app.py'] },
    { name: 'search-service', type: 'python', files: ['requirements.txt', 'app.py'] },
    { name: 'download-service', type: 'python', files: ['requirements.txt', 'app.py'] }
];
let allChecksPassed = true;

// Check if all service directories exist
for (const service of services) {
    const servicePath = path.join(__dirname, service.name);
    if (fs.existsSync(servicePath)) {
        console.log(`✓ ${service.name} directory exists`);
        
        // Check for required files in each service
        for (const file of service.files) {
            const filePath = path.join(servicePath, file);
            if (fs.existsSync(filePath)) {
                console.log(`  ✓ ${file} exists`);
            } else {
                console.log(`  ✗ ${file} missing`);
                allChecksPassed = false;
            }
        }
        
        // Check for src directory
        const srcPath = path.join(servicePath, 'src');
        if (fs.existsSync(srcPath)) {
            console.log(`  ✓ src directory exists`);
        } else {
            // This is okay - not all services need src directory
            console.log(`  ~ src directory not present (optional)`);
        }
    } else {
        console.log(`✗ ${service.name} directory missing`);
        allChecksPassed = false;
    }
    console.log('');
}

// Check that docker-compose.yml no longer exists (or if it still exists, warn about it)
const composePath = path.join(__dirname, 'docker-compose.yml');
if (fs.existsSync(composePath)) {
    console.log('⚠ docker-compose.yml still exists (this may be intentional for reference)');
} else {
    console.log('✓ docker-compose.yml removed as expected');
}

// Check if all Python scripts are accessible from the expected location
const pythonScripts = [
    '../spotify/spotify_metadata.py',
    '../spotify/fetch_youtube_url.py', 
    '../spotify/spotify_playlist.py',
    '../youtube/youtube_downloader.py'
];

console.log('Checking Python script accessibility...');
for (const script of pythonScripts) {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
        console.log(`✓ ${script} exists`);
    } else {
        console.log(`✗ ${script} missing`);
        allChecksPassed = false;
    }
}

console.log('\n' + '='.repeat(70));
if (allChecksPassed) {
    console.log('✓ All checks passed! Microservices architecture (without Docker) is properly set up.');
    console.log('\nTo run the microservices:');
    console.log('1. Make sure you have Python and Node.js installed on your system');
    console.log('2. Install dependencies for each service:');
    console.log('   - For API Gateway: cd microservices/api-gateway && npm install');
    console.log('   - For Metadata Service: cd microservices/metadata-service && pip install -r requirements.txt');
    console.log('   - For Search Service: cd microservices/search-service && pip install -r requirements.txt');
    console.log('   - For Download Service: cd microservices/download-service && pip install -r requirements.txt');
    console.log('');
    console.log('3. Run each service in separate terminals:');
    console.log('   - API Gateway (port 3000): cd microservices/api-gateway && npm start');
    console.log('   - Metadata Service (port 3001): cd microservices/metadata-service && python app.py');
    console.log('   - Search Service (port 3002): cd microservices/search-service && python app.py');
    console.log('   - Download Service (port 3003): cd microservices/download-service && python app.py');
    console.log('');
    console.log('4. The API Gateway will be available at http://localhost:3000');
    console.log('');
    console.log('Note: All services must be running for the full functionality to work.');
} else {
    console.log('✗ Some checks failed. Please verify the setup.');
}
console.log('='.repeat(70));