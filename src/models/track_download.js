const {exec} = require('child_process');
const path = require('path');
const config = require('../utils/config');
class trackDownload {
    static downloadTrack(youtubeUrl, outputPath) {
        return new Promise((resolve, reject) => {
            const pythonScript = path.join(__dirname, '..', '..', 'youtube', 'youtube_downloader.py');
            const command = `${config.pythonPath} "${pythonScript}" "${youtubeUrl}" "${outputPath}"`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing Python script: ${error.message}`);
                    reject(new Error('Failed to download track'));
                    return;
                }
                if (stderr) {
                    console.error(`Python script stderr: ${stderr}`);
                    reject(new Error('Error occurred during track download'));
                    return;
                }
                console.log(`Python script output: ${stdout}`);
                resolve(stdout.trim());
            }
            );
        });
    }
}

module.exports = trackDownload;