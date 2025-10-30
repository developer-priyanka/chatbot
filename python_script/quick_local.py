import faiss, numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.read_index("goh.index")
meta = np.load("goh_meta.npy", allow_pickle=True)
docs = np.load("goh_docs.npy", allow_pickle=True)

query = "What is the Gift of Health?"
q_emb = model.encode([query])
D, I = index.search(q_emb, 3)
for i, idx in enumerate(I[0]):
    print(f"\nResult {i+1} ({meta[idx]}):\n{docs[idx][:400]}…")

