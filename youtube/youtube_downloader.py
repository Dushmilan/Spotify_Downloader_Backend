#!/usr/bin/env python3
import os
import sys
import json
import shutil
import subprocess
import yt_dlp
import urllib.request

COOKIES_FILE = "./Cookies/music.youtube.com_cookies.txt"
SPONSORBLOCK_API = "https://sponsor.ajay.app/api/skipSegments?videoID={vid}"

def fetch_sponsor_segments(video_id, categories=None):
    url = SPONSORBLOCK_API.format(vid=video_id)
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            data = json.load(r)
        if categories:
            data = [seg for seg in data if seg.get("category") in categories or seg.get("segmentType") in categories]
        return data
    except Exception:
        return []

def ffmpeg_remove_segments_from_container(input_file, output_file, segments):
    # segments: list of [start, end] (floats)
    if not segments:
        return False, "no segments"
    # compute keep ranges (complement)
    segs = sorted([(float(s), float(e)) for s, e in segments])
    keep = []
    cur = 0.0
    for s, e in segs:
        if s > cur:
            keep.append((cur, s))
        cur = max(cur, e)
    # get duration
    try:
        p = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration",
                            "-of","default=noprint_wrappers=1:nokey=1", input_file],
                           capture_output=True, text=True, check=True)
        duration = float(p.stdout.strip())
    except Exception:
        duration = None
    if duration and cur < duration:
        keep.append((cur, duration))
    elif not duration:
        keep.append((cur, 9999999))
    # if nothing to keep (segment covers entire file) produce a short silent mp3 or fail
    if not keep:
        return False, "no audio left after removal"
    # build filter_complex
    parts = []
    for i, (s, e) in enumerate(keep):
        parts.append(f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS[a{i}]")
    concat_inputs = "".join(f"[a{i}]" for i in range(len(keep)))
    filter_complex = ";".join(parts) + ";" + concat_inputs + f"concat=n={len(keep)}:v=0:a=1[outa]"
    cmd = ["ffmpeg","-y","-hide_banner","-loglevel","info",
           "-i", input_file,
           "-filter_complex", filter_complex,
           "-map", "[outa]",
           "-c:a", "libmp3lame","-b:a","128k",
           output_file]
    try:
        subprocess.run(cmd, check=True)
        return True, output_file
    except subprocess.CalledProcessError as e:
        return False, str(e)

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

        if not shutil.which("ffmpeg"):
            return False, "ffmpeg not found on PATH"

        ydl_opts = {
            "format": "bestaudio[protocol!=m3u8_native][protocol!=m3u8][vcodec=none]/bestaudio/best",
            "merge_output_format": "m4a",
            "outtmpl": outtmpl,
            "cookiefile": COOKIES_FILE if os.path.exists(COOKIES_FILE) else None,
            "noplaylist": True,
            "quiet": False,
            "no_warnings": True,
            "keepvideo": True,
            # match installed SponsorBlockPP expectations
            "sponsorblock_categories": ["sponsor","intro","outro"],
            "postprocessors": [
                {"key": "SponsorBlock"},
                {"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": "128"}
            ],
            "postprocessor_args": ["-ar","44100"],
        }

        if ydl_opts.get("cookiefile") is None:
            ydl_opts.pop("cookiefile")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            video_id = info.get("id")

        container = None
        for ext in ("webm","m4a","mp4","mkv","mka"):
            p = os.path.join(output_dir, base_name + f".{ext}")
            if os.path.exists(p):
                container = p
                break

        mp3_path = os.path.join(output_dir, base_name + ".mp3")
        # If SponsorBlockPP didn't trim, segments will still be in the container/mp3.
        segments_data = fetch_sponsor_segments(video_id, categories=["sponsor","intro","outro"])
        if segments_data:
            # prepare list of [start,end]
            seg_times = []
            for s in segments_data:
                seg = s.get("segment") or s.get("segments") or s.get("segment_times") or s.get("segment_time")
                # API returns "segment":[start,end]
                if isinstance(seg, list) and len(seg) >= 2:
                    seg_times.append((seg[0], seg[1]))
                else:
                    # fallback: some entries use "segment" key differently
                    if "segment" in s and isinstance(s["segment"], list):
                        seg_times.append((s["segment"][0], s["segment"][1]))
            if not seg_times:
                # nothing parseable
                if os.path.exists(mp3_path):
                    return True, mp3_path
                return False, "Found SponsorBlock entries but could not parse segments"
            # If SponsorBlock postprocessor trimmed, check mp3 duration vs original to infer action
            # Otherwise perform manual trimming from container
            trimmed_mp3 = os.path.join(output_dir, base_name + "_trimmed.mp3")
            if container and os.path.exists(container):
                ok, info_or_err = ffmpeg_remove_segments_from_container(container, trimmed_mp3, seg_times)
                if ok:
                    # optionally cleanup originals
                    try:
                        if os.path.exists(mp3_path):
                            os.remove(mp3_path)
                        os.remove(container)
                    except Exception:
                        pass
                    return True, trimmed_mp3
                else:
                    return False, "Manual trimming failed: " + info_or_err
            else:
                return False, "Container not found for manual trimming"
        else:
            # no segments in SponsorBlock DB — return produced mp3
            if os.path.exists(mp3_path):
                # cleanup container if you want
                try:
                    if os.path.exists(container):
                        os.remove(container)
                except Exception:
                    pass
                return True, mp3_path
            # try to find any mp3
            for f in os.listdir(output_dir):
                if f.lower().endswith(".mp3"):
                    return True, os.path.join(output_dir, f)
            return False, "No output mp3 found and no SponsorBlock segments."

    except Exception as e:
        return False, str(e)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Usage: python youtube_downloader.py <youtube_url> <output_dir_or_basename>"}))
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
