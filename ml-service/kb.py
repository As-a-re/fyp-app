"""
Lightweight knowledge-base retrieval engine for the Twi assistant's
knowledge-base path (see backend/src/services/ragService.js).

This intentionally avoids CustomGPT.ai (paid after a 7-day trial) and avoids
neural embedding models that need to download weights from HuggingFace at
startup (extra external dependency + slow cold start). Instead it uses
scikit-learn's TF-IDF vectorizer + cosine similarity - both already
dependencies of this service for the risk model, so this adds zero new
packages and works fully offline once installed.

TF-IDF is classic lexical (keyword-overlap) search, not semantic search: it
won't catch every paraphrase a neural embedding model would (e.g. "my legs
are puffy" vs. "swelling"), but for a curated, topic-focused knowledge base
like a maternal-health FAQ it's a solid, fast, fully free, and fully
inspectable baseline - and the English query it receives has already been
normalized by the Node backend (Twi/mixed input is translated to English
before it gets here), so vocabulary mismatch is less of a problem than it
would be matching raw multilingual text.

Persistence: the fitted vectorizer, the document-term matrix, and the raw
chunks are saved to disk with joblib/json (kb_vectorizer.joblib,
kb_matrix.joblib, kb_chunks.json), the same pattern already used for
model.joblib/scaler.joblib elsewhere in this service.
"""

import json
import logging
import os
from typing import Any, Dict, List, Optional

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

VECTORIZER_PATH = "kb_vectorizer.joblib"
MATRIX_PATH = "kb_matrix.joblib"
CHUNKS_PATH = "kb_chunks.json"

# Below this cosine-similarity score, we treat a query as "not covered by
# the knowledge base" rather than returning a weak/irrelevant match.
DEFAULT_MIN_SCORE = 0.08


class KnowledgeBase:
    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.matrix = None
        self.chunks: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        if os.path.exists(VECTORIZER_PATH) and os.path.exists(MATRIX_PATH) and os.path.exists(CHUNKS_PATH):
            try:
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                self.matrix = joblib.load(MATRIX_PATH)
                with open(CHUNKS_PATH, "r", encoding="utf-8") as f:
                    self.chunks = json.load(f)
                logger.info(f"Loaded knowledge base: {len(self.chunks)} chunk(s)")
            except Exception as e:
                logger.error(f"Failed to load knowledge base, starting empty: {e}")
                self.vectorizer, self.matrix, self.chunks = None, None, []
        else:
            logger.info("No knowledge base index found yet (empty until ingested)")

    def _save(self):
        joblib.dump(self.vectorizer, VECTORIZER_PATH)
        joblib.dump(self.matrix, MATRIX_PATH)
        with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
            json.dump(self.chunks, f, ensure_ascii=False, indent=2)

    def ingest(self, new_chunks: List[Dict[str, Any]], replace: bool = False) -> int:
        """
        Add (or replace) chunks and re-fit the TF-IDF index.
        Each chunk: {"id": str, "content": str, "metadata": {...}}
        Returns the total chunk count after ingestion.
        """
        if replace:
            self.chunks = []

        existing_ids = {c["id"] for c in self.chunks}
        for chunk in new_chunks:
            if not chunk.get("id") or not chunk.get("content", "").strip():
                continue
            if chunk["id"] in existing_ids:
                # Replace in place so re-running ingestion is idempotent.
                self.chunks = [chunk if c["id"] == chunk["id"] else c for c in self.chunks]
            else:
                self.chunks.append(chunk)
                existing_ids.add(chunk["id"])

        if not self.chunks:
            return 0

        texts = [c["content"] for c in self.chunks]
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            max_features=20000,
            min_df=1,
        )
        self.matrix = self.vectorizer.fit_transform(texts)
        self._save()

        logger.info(f"Knowledge base ingested: {len(self.chunks)} chunk(s) total")
        return len(self.chunks)

    def query(self, text: str, top_k: int = 4, min_score: float = DEFAULT_MIN_SCORE) -> List[Dict[str, Any]]:
        if not self.vectorizer or self.matrix is None or not self.chunks:
            return []

        query_vec = self.vectorizer.transform([text])
        scores = cosine_similarity(query_vec, self.matrix)[0]

        ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
        results = []
        for i in ranked[:top_k]:
            score = float(scores[i])
            if score < min_score:
                continue
            chunk = self.chunks[i]
            results.append({
                "id": chunk["id"],
                "content": chunk["content"],
                "metadata": chunk.get("metadata", {}),
                "score": score,
            })
        return results

    def status(self) -> Dict[str, Any]:
        return {
            "chunk_count": len(self.chunks),
            "vocabulary_size": len(self.vectorizer.vocabulary_) if self.vectorizer else 0,
            "indexed": self.matrix is not None,
        }


# Single process-wide instance, mirroring how model/scaler are module-level
# globals elsewhere in this service.
knowledge_base = KnowledgeBase()
