import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.models.complaint import Complaint
from app.models.campus import Room, Floor, Building

class DuplicateDetector:
    """
    Hybrid Duplicate Complaint Detection Engine according to PRD Module 3:
    Stage 1: Location filtering (Building, Floor, Room)
    Stage 2: Category comparison
    Stage 3: Description similarity (TF-IDF Vectorizer + Cosine Similarity)
    Stage 4: Weighted scoring:
      similarity_score = location_score * 0.40 + category_score * 0.20 + text_score * 0.40
    """

    LOCATION_WEIGHT = 0.40
    CATEGORY_WEIGHT = 0.20
    TEXT_WEIGHT = 0.40

    STRONG_THRESHOLD = 85.0
    POTENTIAL_THRESHOLD = 65.0

    @staticmethod
    def _clean_text(text: str) -> str:
        if not text:
            return ""
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        return ' '.join(text.split())

    @classmethod
    def calculate_location_score(cls, target_room_id: str, candidate_room: Room) -> float:
        if not candidate_room or not target_room_id:
            return 0.0

        if str(candidate_room.id) == str(target_room_id):
            return 1.0  # Exact same room

        # Look up target room to compare floor and building
        target_room = Room.query.get(target_room_id)
        if not target_room:
            return 0.0

        # Same floor in same building
        if target_room.floor_id == candidate_room.floor_id:
            return 0.7

        # Same building
        if target_room.floor and candidate_room.floor and target_room.floor.building_id == candidate_room.floor.building_id:
            return 0.3

        return 0.0

    @classmethod
    def find_duplicates(
        cls,
        title: str,
        description: str,
        category_id: str,
        room_id: str,
        exclude_complaint_id: str = None,
        min_threshold: float = 65.0
    ) -> List[Dict[str, Any]]:
        """
        Finds existing open or active complaints that are potential duplicates of the given complaint.
        Does NOT block submission; provides structured suggestions.
        """
        # Exclude fully resolved complaints older than 30 days if desired, but check active/open complaints
        query = Complaint.query.filter(Complaint.status != 'resolved')
        if exclude_complaint_id:
            query = query.filter(Complaint.id != exclude_complaint_id)

        candidate_complaints = query.all()
        if not candidate_complaints:
            return []

        # Prepare text corpus
        new_text = cls._clean_text(f"{title} {description}")
        corpus = [new_text]
        for c in candidate_complaints:
            candidate_text = cls._clean_text(f"{c.title} {c.description}")
            corpus.append(candidate_text)

        # Scikit-learn TF-IDF
        try:
            vectorizer = TfidfVectorizer(stop_words='english', min_df=1, ngram_range=(1, 2))
            tfidf_matrix = vectorizer.fit_transform(corpus)
            # cosine similarity between new_text (index 0) and candidates (index 1 to N)
            text_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        except Exception:
            # Fallback if text is empty or single char
            text_similarities = [0.0] * len(candidate_complaints)

        results = []

        for idx, complaint in enumerate(candidate_complaints):
            # Stage 1: Location score
            location_score = cls.calculate_location_score(room_id, complaint.room)

            # Stage 2: Category score
            category_score = 1.0 if str(complaint.category_id) == str(category_id) else 0.0

            # Stage 3: Text score
            text_score = float(text_similarities[idx]) if idx < len(text_similarities) else 0.0

            # Stage 4: Weighted formula
            combined_score = (
                (location_score * cls.LOCATION_WEIGHT) +
                (category_score * cls.CATEGORY_WEIGHT) +
                (text_score * cls.TEXT_WEIGHT)
            ) * 100.0

            combined_score = round(combined_score, 1)

            if combined_score >= min_threshold:
                interpretation = (
                    "Strong possible duplicate" if combined_score >= cls.STRONG_THRESHOLD
                    else "Potentially related"
                )

                reasons = []
                if location_score == 1.0:
                    reasons.append("Exact same room and location")
                elif location_score >= 0.7:
                    reasons.append("Same building floor")
                elif location_score >= 0.3:
                    reasons.append("Same campus building")

                if category_score == 1.0:
                    reasons.append(f"Matching category ({complaint.category.name if complaint.category else 'Same'})")

                if text_score > 0.4:
                    reasons.append(f"High description similarity ({int(text_score * 100)}%)")
                elif text_score > 0.2:
                    reasons.append(f"Moderate description overlap ({int(text_score * 100)}%)")

                results.append({
                    'complaint_id': complaint.id,
                    'complaint_number': complaint.complaint_number,
                    'title': complaint.title,
                    'description': complaint.description,
                    'category_name': complaint.category.name if complaint.category else '',
                    'location_display': complaint.room.to_dict()['location_display'] if complaint.room else '',
                    'status': complaint.status,
                    'supporters_count': complaint.supports.count(),
                    'affected_users_count': complaint.affected_users_count,
                    'priority_level': complaint.priority_level or 'medium',
                    'similarity_score': combined_score,
                    'interpretation': interpretation,
                    'breakdown': {
                        'location_score': round(location_score * 100, 1),
                        'category_score': round(category_score * 100, 1),
                        'text_score': round(text_score * 100, 1)
                    },
                    'reasons': reasons
                })

        # Sort highest similarity first
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        return results
