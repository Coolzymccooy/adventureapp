import os
import base64
from pathlib import Path
from openai import OpenAI

# Uses OPENAI_API_KEY from your environment
client = OpenAI()

# Where to save all colouring PNGs
OUTPUT_DIR = Path("asset/paint")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Each id MUST match paint.js (PAINT_TEMPLATES)
TEMPLATES = [
    # Animals
    {
        "id": "cute-dinosaur",
        "prompt": "simple black line art colouring page of a cute cartoon dinosaur for kids, thick outlines, no shading, white background, no text"
    },
    {
        "id": "happy-elephant",
        "prompt": "simple black line art kids colouring page of a happy elephant spraying water, thick outlines, white background, no text"
    },
    {
        "id": "lion-king",
        "prompt": "simple kids colouring page of a smiling cartoon lion with a mane, black outlines, white background, no text"
    },
    {
        "id": "monkey-banana",
        "prompt": "simple black line art colouring page of a cheeky monkey holding a banana, thick outlines, white background, no text"
    },

    # Space
    {
        "id": "space-rocket",
        "prompt": "simple black line art colouring page of a cartoon rocket flying in space with stars and a moon, thick outlines, white background, no text"
    },
    {
        "id": "astronaut-boy",
        "prompt": "simple kids colouring page of a cartoon astronaut boy floating in space, black outline drawing, white background, no text"
    },
    {
        "id": "happy-alien",
        "prompt": "simple black line art colouring page of a cute friendly alien waving, white background, no text"
    },
    {
        "id": "planet-saturn",
        "prompt": "simple line art colouring page of planet Saturn with rings and stars, black outline, white background, no text"
    },

    # Bible stories
    {
        "id": "noahs-ark",
        "prompt": "simple kids colouring page of Noah's Ark with pairs of animals on the boat, black outline drawing, white background, no text"
    },
    {
        "id": "david-and-goliath",
        "prompt": "simple kids colouring page of young David facing Goliath, child-friendly, black outlines only, white background, no text"
    },
    {
        "id": "daniel-lions-den",
        "prompt": "simple black line art colouring page of Daniel in the lions' den, friendly looking lions, white background, no text"
    },
    {
        "id": "jesus-and-children",
        "prompt": "simple kids colouring page of Jesus with happy children around Him, black line art, white background, no text"
    },

    # Family / everyday life
    {
        "id": "family-home",
        "prompt": "simple line art colouring page of a cosy family house with trees and clouds, thick outlines, white background, no text"
    },
    {
        "id": "family-meal",
        "prompt": "simple black line art colouring page of a family eating together at a table, white background, no text"
    },
    {
        "id": "bedtime-story",
        "prompt": "simple kids colouring page of a parent reading a bedtime story to a child in bed, black outlines, white background, no text"
    },

    # Sports
    {
        "id": "soccer-game",
        "prompt": "simple kids colouring page of children playing football, one kicking a ball towards a goal, black outlines, white background, no text"
    },
    {
        "id": "basketball-shot",
        "prompt": "simple black line art colouring page of a child taking a basketball shot into a hoop, white background, no text"
    },

    # Seasons / celebrations
    {
        "id": "snowman",
        "prompt": "simple kids colouring page of a snowman with a scarf and hat, black outline drawing, white background, no text"
    },
    {
        "id": "spring-flowers",
        "prompt": "simple black line art colouring page of spring flowers in a field, thick outlines, white background, no text"
    },
    {
        "id": "birthday-cake",
        "prompt": "simple kids colouring page of a birthday cake with candles and confetti, black outlines, white background, no text"
    },
    {
        "id": "party-balloons",
        "prompt": "simple black line art kids colouring page of balloons and streamers, white background, no text"
    },
]


def generate_and_save(template: dict) -> None:
    """Call OpenAI Images API and save a PNG for a single template."""
    out_path = OUTPUT_DIR / f"{template['id']}.png"

    if out_path.exists():
        print(f"Skipping {template['id']} (already exists: {out_path})")
        return

    print(f"Generating {template['id']}...")

    response = client.images.generate(
        model="gpt-image-1",          # image model
        prompt=template["prompt"],
        size="1024x1024",             # square page, good for colouring
        n=1
    )

    image_b64 = response.data[0].b64_json
    image_bytes = base64.b64decode(image_b64)

    with open(out_path, "wb") as f:
        f.write(image_bytes)

    print(f"Saved {out_path}")


if __name__ == "__main__":
    for tpl in TEMPLATES:
        try:
            generate_and_save(tpl)
        except Exception as ex:
            print(f"Error generating {tpl['id']}: {ex}")
