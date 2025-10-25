const { spawn } = require('child_process');
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

/**
 * Executes a Python script with given arguments
 * @param {string} scriptPath - Path to the Python script
 * @param {Array} args - Arguments to pass to the Python script
 * @param {Object} options - Additional options for execution
 * @returns {Promise} - Resolves with the script output or rejects with error
 */
const executePythonScript = (scriptPath, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    // Set default timeout from config if not provided
    const timeout = options.timeout || config.timeout.pythonScript;
    
    // Validate script path
    if (!scriptPath) {
      return reject(new Error('Python script path is required'));
    }
    
    // Resolve the full path to the Python script
    const fullScriptPath = path.resolve(scriptPath);
    
    // Prepare arguments, ensuring the script path is the first argument
    const pythonArgs = [fullScriptPath, ...args];
    
    // Spawn the Python process
    const pythonProcess = spawn('python', pythonArgs);
    
    let stdout = '';
    let stderr = '';
    
    // Collect stdout
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Collect stderr
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Attempt to parse JSON output if possible
          const trimmedOutput = stdout.trim();
          let result;
          
          try {
            result = JSON.parse(trimmedOutput);
          } catch (e) {
            // If not JSON, return the raw output
            result = trimmedOutput;
          }
          
          resolve(result);
        } catch (parseError) {
          logger.error(`Error parsing Python script output: ${parseError.message}`);
          resolve(stdout.trim());
        }
      } else {
        const error = new Error(`Python script exited with code ${code}: ${stderr}`);
        error.stderr = stderr;
        error.stdout = stdout;
        error.code = code;
        reject(error);
      }
    });
    
    // Handle errors in spawning the process
    pythonProcess.on('error', (error) => {
      logger.error(`Failed to start Python process: ${error.message}`);
      reject(error);
    });
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      pythonProcess.kill(); // Kill the Python process if timeout is reached
      const timeoutError = new Error(`Python script execution timed out after ${timeout}ms`);
      timeoutError.code = 'TIMEOUT';
      reject(timeoutError);
    }, timeout);
    
    // Clear timeout when process completes
    pythonProcess.on('close', () => {
      clearTimeout(timeoutId);
    });
  });
};

module.exports = {
  executePythonScript
};