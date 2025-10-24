import sys
print("Python executable:", sys.executable)
print("Python version:", sys.version)

try:
    from spotifyscraper import SpotifyClient
    print("spotifyscraper imported successfully!")
    print("SpotifyClient class:", SpotifyClient)
except ImportError as e:
    print("Import error:", e)
    print("Available modules containing 'spotify':")
    import pkgutil
    for importer, modname, ispkg in pkgutil.iter_modules():
        if 'spotify' in modname.lower():
            print(f"  {modname}")