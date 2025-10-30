import json
import os
import time

from openai import OpenAI
from tqdm import tqdm

# ✅ Try loading local model if OpenAI fails
USE_OPENAI = False

# Load scraped Gift of Health content
with open("goh_content.json", "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [page["content"] for page in data if page.get("content")]

# Save output embeddings
output_file = "goh_embeddings.json"

# --- Try using OpenAI first ---
try:
    client = OpenAI(api_key="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")

    embeddings = []
    print("🔹 Using OpenAI embeddings...")
    for text in tqdm(texts):
        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text
            )
            emb = response.data[0].embedding
            embeddings.append(emb)
            time.sleep(0.2)
        except Exception as e:
            print(f"⚠️ Skipping text due to error: {e}")
            embeddings.append([])

    print("✅ Successfully generated embeddings with OpenAI.")

except Exception as e:
    print("⚠️ OpenAI embedding failed:", e)
    print("🔄 Falling back to local embeddings...")

    USE_OPENAI = False

# --- Fallback: Local SentenceTransformer embeddings ---
if not USE_OPENAI:
    try:
        from sentence_transformers import SentenceTransformer
        print("🔹 Loading local model...")
        model = SentenceTransformer("all-MiniLM-L6-v2")

        embeddings = []
        for text in tqdm(texts):
            emb = model.encode(text)
            embeddings.append(emb.tolist())

        print("✅ Successfully generated embeddings locally.")
    except Exception as err:
        print("❌ Local embedding failed:", err)
        exit(1)

# --- Save embeddings ---
with open(output_file, "w", encoding="utf-8") as f:
    json.dump({
        "texts": texts,
        "embeddings": embeddings
    }, f)

print(f"🎯 All embeddings saved to {output_file}")
