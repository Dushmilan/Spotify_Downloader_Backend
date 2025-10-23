#!/usr/bin/env python3
import os
import sys
import json
import yt_dlp

COOKIES_FILE = "./Cookies/music.youtube.com_cookies.txt"

def download_youtube_audio(youtube_url, output_path):
    try:
        if os.path.isdir(output_path):
            output_dir = output_path
            base_name = "output_audio"
        else:
            output_dir = os.path.dirname(output_path) or "."
            base_name = os.path.splitext(os.path.basename(output_path))[0] or "output_audio"

        os.makedirs(output_dir, exist_ok=True)
        outtmpl = os.path.join(output_dir, base_name + ".%(ext)s")

        ydl_opts = {
    "format": "bestaudio[protocol!=m3u8_native][protocol!=m3u8][vcodec=none]/bestaudio/best",
    "merge_output_format": "m4a",
    "outtmpl": outtmpl,
    "cookiefile": COOKIES_FILE if os.path.exists(COOKIES_FILE) else None,
    "noplaylist": True,
    "quiet": False,
    "no_warnings": True,
    "postprocessors": [
        {
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "128",
        }
    ],
    "postprocessor_args": ["-ar", "44100"],
}


        if ydl_opts.get("cookiefile") is None:
            ydl_opts.pop("cookiefile")

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
