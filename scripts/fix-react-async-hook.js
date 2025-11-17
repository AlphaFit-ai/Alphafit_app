const fs = require('fs');
const path = require('path');

// Path to the problematic package.json
const packagePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-country-picker-modal',
  'node_modules',
  'react-async-hook',
  'package.json'
);

// Check if the file exists
if (fs.existsSync(packagePath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Fix the module path
    if (packageJson.module === 'react-async-hook.esm.js') {
      packageJson.module = 'dist/react-async-hook.esm.js';
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✓ Fixed react-async-hook module path');
    } else {
      console.log('✓ react-async-hook already fixed');
    }
  } catch (error) {
    console.error('Error fixing react-async-hook:', error);
  }
} else {
  console.log('⚠ react-async-hook package not found, skipping fix');
}
