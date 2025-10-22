const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const config = require('../config');

class PythonService {
  /**
   * Execute a Python script and return the result
   * @param {string} scriptPath - Path to the Python script
   * @param {Array} args - Arguments to pass to the script
   * @returns {Promise<any>} - Promise that resolves with the script output
   */
  static async executeScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      logger.info(`Executing Python script: ${scriptPath} with args: ${args.join(' ')}`);
      
      const pythonProcess = spawn(config.pythonPath, [
        path.join(__dirname, '../../', scriptPath),
        ...args
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Try to parse JSON output, otherwise return raw output
            let result;
            try {
              result = JSON.parse(stdout.trim());
            } catch (e) {
              // If not JSON, return the raw output
              result = stdout.trim();
            }
            logger.info(`Python script executed successfully`);
            resolve(result);
          } catch (parseError) {
            logger.error(`Error parsing Python script output: ${parseError.message}`);
            reject(new Error(`Failed to parse Python script output: ${parseError.message}`));
          }
        } else {
          logger.error(`Python script failed with code ${code}: ${stderr}`);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        logger.error(`Error spawning Python process: ${error.message}`);
        reject(error);
      });
    });
  }

  /**
   * Find Python executable in common locations
   * @returns {string} Path to Python executable
   */
  static findPython() {
    // This is a simplified version - in a real implementation, you might want to 
    // search for Python in multiple locations
    return config.pythonPath;
  }
}

module.exports = PythonService;