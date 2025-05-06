const fs = require('fs');
const https = require('https');

// Configuration
const REPO_OWNER = 'atlasgrowth23';
const REPO_NAME = 'atlaswebsites';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('GitHub token not found in environment variables');
  process.exit(1);
}

// Critical files that contain our fixes
const CRITICAL_FILES = [
  'components/templates/TemplateHVAC1/Header.tsx',
  'components/templates/TemplateHVAC1/Hero.tsx',
  'components/templates/TemplateHVAC1/ReviewsSection.tsx',
  'pages/[slug].tsx',
  'pages/_app.tsx',
  'pages/index.tsx',
  'postcss.config.js',
  'tailwind.config.js',
  'package.json',
  'lib/palettes.ts'
];

// Function to create a GitHub API request
function githubRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method: method,
      headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonResponse = responseData ? JSON.parse(responseData) : {};
            resolve(jsonResponse);
          } catch (e) {
            resolve(responseData);
          }
        } else {
          console.error(`Status: ${res.statusCode}`);
          console.error(`Response: ${responseData}`);
          reject(new Error(`Request failed with status: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Function to create or update a file on GitHub
async function createOrUpdateFile(filePath) {
  try {
    console.log(`Uploading: ${filePath}`);

    // Check if file exists
    let sha = null;
    try {
      const fileData = await githubRequest(
        'GET',
        `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`
      );
      sha = fileData.sha;
    } catch (error) {
      // File doesn't exist, that's fine
    }

    // Create or update file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = {
      message: `Fix ${filePath}`,
      content: Buffer.from(fileContent).toString('base64'),
    };

    if (sha) {
      data.sha = sha;
    }

    await githubRequest(
      'PUT',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
      data
    );

    console.log(`Successfully uploaded: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    return false;
  }
}

// Main function to upload files
async function uploadCriticalFiles() {
  console.log('Starting critical file upload to GitHub...');
  
  try {
    console.log(`Found ${CRITICAL_FILES.length} critical files to upload.`);

    let successCount = 0;
    for (const file of CRITICAL_FILES) {
      if (fs.existsSync(file)) {
        const success = await createOrUpdateFile(file);
        if (success) successCount++;
      } else {
        console.error(`File not found: ${file}`);
      }
    }

    console.log(`Upload complete. Successfully uploaded ${successCount}/${CRITICAL_FILES.length} files.`);
  } catch (error) {
    console.error('Error uploading files:', error);
  }
}

// Start the upload
uploadCriticalFiles();