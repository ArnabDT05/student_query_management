/**
 * US5 - Query Categorization Service
 * Automatically classifies user queries based on keywords
 */

const KEYWORD_MAP = {
  // IT Support
  "it_support": [
    "login", "password", "canvas", "wifi", "internet", "software", "email", 
    "account", "computer", "portal", "system", "access"
  ],
  // Academic Affairs
  "academic_affairs": [
    "grade", "exam", "course", "registration", "transcript", "advisor", 
    "curriculum", "syllabus", "credit", "graduate", "major", "minor"
  ],
  // Financial Aid
  "financial_aid": [
    "scholarship", "tuition", "payment", "loan", "grant", "billing", 
    "financial", "fees", "refund", "bursar", "account balance"
  ],
  // Facilities
  "facilities": [
    "dorm", "cleaning", "maintenance", "repair", "lighting", "ac", 
    "room", "hostel", "water", "electricity", "parking", "furniture"
  ]
};

/**
 * Detects the most likely category based on a query subject and description.
 * Returns the category key or null if no strong match.
 */
export function detectCategory(subject, description) {
  const text = `${subject} ${description}`.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    let score = 0;
    keywords.forEach(keyword => {
      // Use regex for whole word match to avoid substrings triggering incorrectly
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      const count = (text.match(regex) || []).length;
      score += count;
    });

    if (score > maxScore) {
      maxScore = score;
      bestMatch = category;
    }
  }

  // Only return if we have a reasonable confidence (score > 1)
  return maxScore > 0 ? bestMatch : null;
}
