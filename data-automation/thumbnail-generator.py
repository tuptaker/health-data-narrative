import os
from PIL import Image, ImageDraw, ImageFont

MAPS_DIR = "../maps"
THUMBS_DIR = os.path.join(MAPS_DIR, "map-thumbnails")
INDEX_FILE = "index_with_map_thumbnails.html"

os.makedirs(THUMBS_DIR, exist_ok=True)

# Set up a basic font
try:
    font = ImageFont.truetype("arial.ttf", 16)
except IOError:
    font = ImageFont.load_default()

def generate_dummy_thumbnail(name, out_path):
    img = Image.new("RGB", (240, 160), color="#477740")
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, 0), (239, 159)], outline="black")

    text = "\n".join(name.split("_")[1:]).replace(".html", "")
    draw.multiline_text((10, 50), text, fill="white", font=font, spacing=4)

    img.save(out_path)

# Collect HTML map files
html_files = [f for f in os.listdir(MAPS_DIR) if f.endswith(".html")]
html_files.sort()

# Generate thumbnails if needed
for html_file in html_files:
    base = os.path.splitext(html_file)[0]
    thumb_path = os.path.join(THUMBS_DIR, base + ".png")
    if not os.path.exists(thumb_path):
        generate_dummy_thumbnail(html_file, thumb_path)

# Write the index HTML
with open(INDEX_FILE, "w") as out:
    out.write("""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Running Route Map Gallery</title>
    <style>
        body {
            background: #f4f4f4;
            font-family: sans-serif;
            padding: 20px;
        }
        h1 {
            text-align: center;
        }
        .grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 0 8px rgba(0,0,0,0.1);
            width: 240px;
            text-align: center;
            text-decoration: none;
            color: black;
        }
        .card img {
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            width: 240px;
            height: 160px;
            object-fit: cover;
        }
        .card p {
            margin: 0;
            padding: 10px;
            font-size: 14px;
            background: #f0f0f0;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }
    </style>
</head>
<body>
<h1>Route Maps</h1>
<div class="grid">
""")
    for html_file in html_files:
        name = os.path.splitext(html_file)[0]
        label = name.replace("route_", "").replace("_", " ")
        thumb_rel = f"{MAPS_DIR}/thumbnails/{name}.png"
        map_rel = f"{MAPS_DIR}/{html_file}"

        out.write(f"""
    <a class="card" href="{map_rel}">
        <img src="{thumb_rel}" alt="{label} thumbnail"/>
        <p>{label}</p>
    </a>
""")

    out.write("""
</div>
</body>
</html>""")
