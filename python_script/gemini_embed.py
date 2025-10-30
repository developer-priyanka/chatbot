import json, time
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# Optional Gemini summarization (skip if no API key)
USE_GEMINI = False
GEMINI_API_KEY = "AIzaSyAFYNJM5ZMLUKfQoV-u53jINUbGT8g192E"

if USE_GEMINI:
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

# Load scraped data
with open("goh_content.json", "r", encoding="utf-8") as f:
    pages = json.load(f)

texts, urls = [], []

print("🔹 Processing Gift of Health pages...")
for p in tqdm(pages):
    content = p["content"]
    url = p["url"]

    if USE_GEMINI:
        try:
            prompt = f"Summarize this Gift of Health webpage in 100 words:\n\n{content[:4000]}"
            resp = model.generate_content(prompt)
            summary = resp.text.strip()
        except Exception as e:
            print(f"⚠️ Gemini summarization failed for {url}: {e}")
            summary = content[:800]
    else:
        summary = content[:800]  # truncate for performance

    texts.append(summary)
    urls.append(url)
    time.sleep(0.3)

print("🔹 Generating local embeddings (MiniLM)...")
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = [model.encode(t).tolist() for t in tqdm(texts)]

# Save embeddings + URLs
with open("goh_embeddings.json", "w", encoding="utf-8") as f:
    json.dump({"texts": texts, "urls": urls, "embeddings": embeddings}, f)

print(f"✅ Saved {len(texts)} embeddings → goh_embeddings.json")
