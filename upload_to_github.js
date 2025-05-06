const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const REPO_OWNER = 'atlasgrowth23';
const REPO_NAME = 'atlaswebsites';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('GitHub token not found in environment variables');
  process.exit(1);
}

// Files and directories to exclude
const EXCLUDE = [
  'node_modules',
  '.next',
  '.env.local',
  '.git',
  '.cache',
  '.local',
  '.upm',
  'upload_to_github.js'
];

// Function to check if path should be excluded
function shouldExclude(filePath) {
  return EXCLUDE.some(excludePath => filePath.includes(excludePath));
}

// Function to recursively get all files in directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (shouldExclude(path.join(dirPath, file))) {
      return;
    }

    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

// Function to get relative path from project root
function getRelativePath(absolutePath) {
  return absolutePath.replace(process.cwd() + '/', '');
}

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
async function createOrUpdateFile(filePath, content) {
  try {
    const relativePath = getRelativePath(filePath);
    console.log(`Uploading: ${relativePath}`);

    // Check if file exists
    let sha = null;
    try {
      const fileData = await githubRequest(
        'GET',
        `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativePath}`
      );
      sha = fileData.sha;
    } catch (error) {
      // File doesn't exist, that's fine
    }

    // Create or update file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = {
      message: `Add ${relativePath}`,
      content: Buffer.from(fileContent).toString('base64'),
    };

    if (sha) {
      data.sha = sha;
    }

    await githubRequest(
      'PUT',
      `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${relativePath}`,
      data
    );

    console.log(`Successfully uploaded: ${relativePath}`);
    return true;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error.message);
    return false;
  }
}

// Main function to upload files
async function uploadFiles() {
  console.log('Starting file upload to GitHub...');
  
  try {
    const files = getAllFiles('.');
    console.log(`Found ${files.length} files to upload.`);

    let successCount = 0;
    for (const file of files) {
      const success = await createOrUpdateFile(file);
      if (success) successCount++;
    }

    console.log(`Upload complete. Successfully uploaded ${successCount}/${files.length} files.`);
  } catch (error) {
    console.error('Error uploading files:', error);
  }
}

// Start the upload
uploadFiles();