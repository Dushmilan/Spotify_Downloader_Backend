#!/usr/bin/env python3
import os
import sys
import json
import yt_dlp

# Path to cookies file (change if needed)
COOKIES_FILE = "./Cookies/music.youtube.com_cookies.txt"

def download_youtube_audio(youtube_url, output_path):
    """
    Downloads a YouTube URL as an MP3.
    Args:
      youtube_url (str): YouTube video URL
      output_path (str): Directory or full file path (without extension) to save MP3
    Returns:
      (bool, str): success, error_message
    """
    try:
        # Determine output directory and base filename
        if os.path.isdir(output_path):
            output_dir = output_path
            base_name = "output_audio"
        else:
            output_dir = os.path.dirname(output_path) or "."
            base_name = os.path.basename(output_path) or "output_audio"

        os.makedirs(output_dir, exist_ok=True)

        outtmpl = os.path.join(output_dir, base_name + ".%(ext)s")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": outtmpl,
            "cookiefile": COOKIES_FILE if os.path.exists(COOKIES_FILE) else None,
            "noplaylist": True,
            "quiet": False,
            "no_warnings": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
            # Ensure ffmpeg is used for conversion
            "postprocessor_args": ["-ar", "44100"],
        }

        # Remove cookiefile key if None to avoid yt-dlp complaining
        if ydl_opts["cookiefile"] is None:
            del ydl_opts["cookiefile"]

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_url])

        final_path = os.path.join(output_dir, base_name + ".mp3")
        if not os.path.exists(final_path):
            return False, "Conversion to MP3 failed or output file missing."

        return True, final_path

    except Exception as e:
        return False, str(e)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python youtube_to_mp3.py <youtube_url> <output_dir_or_basename>"
        }))
        sys.exit(1)

    youtube_url = sys.argv[1]
    output_path = sys.argv[2]

    success, info = download_youtube_audio(youtube_url, output_path)

    result = {"success": success}
    if success:
        result["output_file"] = info
    else:
        result["error"] = info

    print(json.dumps(result))
