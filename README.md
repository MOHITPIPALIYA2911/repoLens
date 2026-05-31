# RepoLens

> See your GitHub through a recruiter's eyes.

RepoLens is an AI-powered GitHub intelligence platform that analyzes public GitHub repositories and profiles from a recruiter/interviewer perspective. It scores repositories, compares them, ranks them on a leaderboard, collects human feedback, and trains its own custom ML model to make future scoring more meaningful.

The main purpose of RepoLens is not to be just a GitHub API wrapper. The main feature is the **custom RepoLens AI/ML scoring model** that learns from repository features and user feedback.

## Live Demo

https://repo-lens-frontend.vercel.app/

---

## Important GitHub Token Notice

The GitHub Personal Access Token used for local development will expire on:

```text
28 August 2026
```

After this date, update the token in:

```text
backend/.env
```

```env
GITHUB_TOKEN=your_new_github_token_here
```

Never commit the actual GitHub token to GitHub.

---

# RepoLens Custom AI Model

## Why RepoLens Has Its Own AI Model

Most AI projects only send data to an external LLM and display the response. RepoLens is different.

RepoLens has its own ML-based scoring system that learns from GitHub repository data. The system extracts structured features from repositories, stores them as training data, trains a machine learning model, and uses that model to improve future repository scores.

The LLM/Gemini layer is optional. It is not responsible for the core scoring.

Core idea:

```text
GitHub repo
-> feature extraction
-> rule-based score
-> training data
-> custom ML model
-> hybrid RepoLens score
-> user feedback
-> model retraining
```

## What Our AI Model Predicts

The RepoLens model predicts repository quality scores such as:

- Overall RepoLens Score
- Recruiter Readiness Score
- Production Readiness Score
- Documentation Score
- Code Structure Score
- Activity Score
- Consistency Score

These scores help decide:

- Whether a repository looks strong or weak
- Whether it is recruiter-ready
- Whether it looks production-ready
- Whether it deserves to appear higher on the leaderboard
- What improvements the developer should make

## Model Type

RepoLens currently uses:

```text
RandomForestRegressor
```

from:

```text
scikit-learn
```

The model file is saved here:

```text
backend/storage/models/repolens_repo_model.joblib
```

Model metadata is saved here:

```text
backend/storage/models/repolens_repo_model_meta.json
```

Training data is saved here:

```text
backend/storage/training_data.json
```

Human feedback labels are saved here:

```text
backend/storage/feedback_labels.json
```

## Why RandomForestRegressor Is Used

Random Forest is used because:

- It works well with structured tabular features
- It handles mixed signals better than a simple linear model
- It is easy to train locally
- It works with small-to-medium datasets
- It can predict multiple score values
- It is simple enough for an MVP but strong enough for a real demo

RepoLens uses it to learn relationships between repository features and quality scores.

Example pattern it can learn:

```text
Repos with README + setup guide + tests + CI/CD usually score higher.
Repos without documentation, tests, and recent activity usually score lower.
```

---

# How RepoLens Learns

## Step 1: User Analyzes a Repository

The user enters a public GitHub repository URL:

```text
https://github.com/owner/repository
```

RepoLens fetches public repository data using GitHub API.

It collects:

- Repository metadata
- README text
- Languages
- File tree
- Stars
- Forks
- Open issues
- Last push date
- Topics
- Default branch

## Step 2: RepoLens Extracts Features

RepoLens converts repository data into ML-friendly features.

Example features:

```text
readme_length
readme_section_count
stars
forks
open_issues
file_count
folder_count
language_count
topic_count
days_since_push
repo_age_days
has_readme
has_project_description
has_screenshots
has_setup_guide
has_tech_stack
has_live_demo
has_api_docs
has_license
has_tests
has_dockerfile
has_ci_cd
has_env_example
has_package_file
is_archived
is_fork
```

The feature extraction logic is mainly inside:

```text
backend/app/services/feature_extractor.py
```

The feature vector conversion is inside:

```text
backend/app/ml/feature_vectorizer.py
```

## Step 3: Rule Engine Creates Initial Labels

At the start, there is not enough real feedback data. So RepoLens uses a rule-based scoring engine to create weak labels.

The rule-based scoring engine checks visible signals like:

- README exists
- README has setup guide
- README has screenshots
- README has tech stack
- Live demo exists
- Tests exist
- Dockerfile exists
- CI/CD workflow exists
- License exists
- Repository is recently active

This logic is inside:

```text
backend/app/services/scoring_service.py
```

These rule-based scores are used as initial training labels.

This is called weak supervision:

```text
Rule-based score -> weak training label -> ML model learns from it
```

## Step 4: Training Data Is Stored

Every successful repository analysis stores a training example in:

```text
backend/storage/training_data.json
```

Example training record:

```json
{
  "repo_url": "https://github.com/owner/repo",
  "full_name": "owner/repo",
  "features": {
    "has_readme": true,
    "has_tests": false,
    "has_dockerfile": true,
    "readme_length": 2400
  },
  "labels": {
    "overall": 74,
    "recruiter_readiness": 78,
    "production_readiness": 60,
    "documentation": 82,
    "code_structure": 70,
    "activity": 65,
    "consistency": 75
  },
  "label_source": "weak_rule_score_v1"
}
```

## Step 5: Model Training Starts Automatically

RepoLens starts training after minimum training data is available.

Current threshold:

```text
Minimum training rows: 5
```

After 5 repository analyses, the model trains automatically.

Model status can be checked at:

```http
GET /api/ml/status
```

Manual training endpoint:

```http
POST /api/ml/train
```

## Step 6: ML Model Predicts Scores

After the model is trained, RepoLens uses it for future analysis.

The ML model predicts:

```text
overall
recruiter_readiness
production_readiness
documentation
code_structure
activity
consistency
```

Then RepoLens blends rule score and ML score.

Current hybrid scoring:

```text
Final Score = Rule Score + ML Prediction
```

More exactly, the blend is controlled by ML weight.

## Step 7: Dynamic ML Weight

RepoLens does not immediately trust ML 100%. It increases ML importance as more human feedback is collected.

Current dynamic ML weight logic:

```text
0-19 feedbacks   -> 35% ML, 65% rules
20-49 feedbacks  -> 45% ML, 55% rules
50-99 feedbacks  -> 55% ML, 45% rules
100+ feedbacks   -> 70% ML, 30% rules
```

This is safer than using only ML from day one.

Why rules are still useful:

- They verify factual signals
- They make scores explainable
- They work when the model has little data
- They act as a safety backup

## Step 8: User Feedback Makes Learning Meaningful

RepoLens includes a feedback system.

After a repository is analyzed, the user can label the result:

Repository quality:

```text
Strong Repo
Average Repo
Weak Repo
```

Score feedback:

```text
Accurate
Score Too High
Score Too Low
```

This feedback is saved in:

```text
backend/storage/feedback_labels.json
```

It is also converted into stronger training labels and added to:

```text
backend/storage/training_data.json
```

Human feedback is repeated with higher weight during training so the model learns more from real feedback than from weak rule labels.

Current feedback repeat value:

```text
FEEDBACK_REPEAT = 4
```

Meaning one human feedback label has more training influence than one rule-generated label.

## Step 9: Model Retrains After Feedback

When feedback is submitted:

```text
feedback saved
-> training data updated
-> model retrained
-> future predictions improve
```

So RepoLens becomes more meaningful as more people use it and label results.

---

# AI Responsibility Split

RepoLens separates scoring, learning, and explanation.

## Custom RepoLens ML Model

Used for:

- Core scoring
- Repo quality prediction
- Recruiter-readiness prediction
- Production-readiness prediction
- Leaderboard ranking support
- Learning from user feedback

## Rule Engine

Used for:

- Feature-based fallback scoring
- Factual checks
- Initial weak labels
- Explainability
- Safety backup

## Gemini / External LLM

Currently Gemini is not required for the core product.

Gemini can be added later only for:

- Better natural-language explanations
- Better README suggestions
- Roast mode
- More personalized improvement plans
- Better interview talking points
- Scorecard summaries

Important:

```text
Gemini should not decide the score.
RepoLens' own ML model decides the core score.
```

---

# Current Model Status Example

Example response from:

```http
GET /api/ml/status
```

```json
{
  "model_exists": true,
  "model_version": "repolens-random-forest-v1",
  "training_rows": 6,
  "feedback_rows": 1,
  "minimum_training_rows": 5,
  "is_trained": true,
  "meta": {
    "model_version": "repolens-random-forest-v1",
    "training_rows": 6,
    "feature_count": 26,
    "score_keys": [
      "overall",
      "recruiter_readiness",
      "production_readiness",
      "documentation",
      "code_structure",
      "activity",
      "consistency"
    ],
    "model_type": "RandomForestRegressor",
    "label_source": "weak_rule_score_v1"
  }
}
```

This proves that RepoLens has:

- A trained local ML model
- Stored training data
- Model metadata
- Custom feature vectorization
- Hybrid scoring
- Feedback-based learning

---

# Main Features

## Repository Analyzer

Route:

```text
/analyze/repo
```

The user enters a public GitHub repository URL.

RepoLens returns:

- Overall RepoLens Score
- Recruiter Readiness Score
- Production Readiness Score
- Documentation Score
- Code Structure Score
- Activity Score
- Consistency Score
- Score source
- ML model usage status
- Strengths
- Weaknesses
- Recruiter red flags
- Improvement plan
- Interview talking points
- Feedback card for model learning

## Profile Analyzer

Route:

```text
/analyze/profile
```

The user enters a GitHub username or profile URL.

RepoLens analyzes multiple public repositories and returns:

- Overall Profile Score
- Average Repository Score
- Best Repository Score
- Developer type
- Strongest skills
- Missing skills
- Best repository
- Weakest repository
- Profile review
- 7-day improvement plan
- List of analyzed repositories
- Review This Repo button

## Repository Comparison

Route:

```text
/compare/repo
```

The user enters two repository URLs.

RepoLens compares:

- Overall score
- Recruiter readiness
- Production readiness
- Documentation
- Code structure
- Activity
- Consistency
- Missing features
- Category-wise winner
- Overall winner
- Improvement plan for both repos

Important note shown in the UI:

```text
Comparison scores and suggestions are based only on these two repositories.
```

## Leaderboard

Route:

```text
/leaderboard
```

Leaderboard shows top repositories based on average score.

Average score uses:

- Recruiter Readiness
- Production Readiness
- Documentation
- Code Structure
- Activity
- Consistency

Rules:

- Same GitHub account can have multiple repos on the leaderboard
- Same repository is unique
- If the same repo is analyzed again, the entry is updated
- Top 10 repositories are shown

## Leaderboard Admin Mode

A small low-visibility lock icon is available on the leaderboard.

Admin flow:

```text
Click lock icon
-> password popup opens
-> correct password unlocks admin mode
-> lock becomes open-lock
-> delete buttons appear
-> admin can delete any repo
-> click open-lock again
-> delete buttons hide
```

Admin password is stored in env variables.

Backend:

```text
backend/.env
```

Frontend:

```text
frontend/.env.local
```

Note:

```text
NEXT_PUBLIC variables are visible in the browser.
For production, admin actions should be protected only on backend.
```

## Repository Analysis Counter

Homepage shows how many repository analyses RepoLens has processed.

Counter logic:

```text
Single repo analysis = +1
Same account, different repo = +1
Same repo analyzed again = +1
Profile analysis with 5 repos = +5
Repo comparison with 2 repos = +2
```

Stats are stored in:

```text
backend/storage/stats.json
```

---

# Tech Stack

## Frontend

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
lucide-react
next/font
React Hooks
```

Used for:

- Landing page
- Repository analyzer
- Profile analyzer
- Repository comparison
- Leaderboard
- Admin unlock UI
- Feedback card
- Glassmorphism design
- Reusable comparison component

## Backend

```text
Python
FastAPI
Pydantic
httpx
pydantic-settings
python-dotenv
```

Used for:

- API routes
- GitHub API integration
- Repository analysis
- Profile analysis
- Comparison logic
- Leaderboard logic
- Stats tracking
- Feedback collection

## Machine Learning

```text
scikit-learn
RandomForestRegressor
joblib
NumPy style feature vectors
JSON training storage
```

Used for:

- Custom RepoLens AI model
- Training from repository features
- Predicting scores
- Saving model files
- Loading model for future predictions
- Feedback-based retraining

## Icons

```text
lucide-react
```

Icons used include:

- GitBranch
- UserRound
- Search
- ArrowRight
- Trophy
- Scale
- Lock
- LockOpen
- Trash2
- ExternalLink
- Star
- GitFork
- CheckCircle2
- XCircle
- Info
- Brain

## UI Components

```text
shadcn/ui
```

Components used:

- Button
- Card
- Input
- Badge
- Progress
- Alert
- Dialog
- Separator
- Tooltip
- Dropdown Menu
- Skeleton
- Textarea
- Tabs

## Styling

```text
Tailwind CSS
```

Design style:

- Light glassmorphism
- Cyan and emerald primary colors
- Soft gradient background
- Blurred background circles
- Rounded cards
- Gradient score highlights
- Responsive layout

---

# Backend API Endpoints

## Health Check

```http
GET /health
```

## Analyze Repository

```http
POST /api/repo/analyze
```

Request:

```json
{
  "repo_url": "https://github.com/vercel/next.js"
}
```

## Analyze Profile

```http
POST /api/profile/analyze
```

Request:

```json
{
  "username": "vercel",
  "max_repos": 5
}
```

## Compare Repositories

```http
POST /api/repo/compare
```

Request:

```json
{
  "repo_a_url": "https://github.com/vercel/next.js",
  "repo_b_url": "https://github.com/facebook/react"
}
```

## Get Leaderboard

```http
GET /api/leaderboard?limit=10
```

## Delete Leaderboard Entry

```http
DELETE /api/leaderboard?repo_url=https://github.com/owner/repo
```

Header:

```http
X-Admin-Password: your_admin_password
```

## Get Public Stats

```http
GET /api/stats
```

## ML Model Status

```http
GET /api/ml/status
```

## Train ML Model Manually

```http
POST /api/ml/train
```

## Submit Repository Feedback

```http
POST /api/feedback/repo
```

Request:

```json
{
  "repository": {},
  "features": {},
  "scores": {},
  "quality_label": "strong",
  "score_feedback": "accurate",
  "comment": "optional comment"
}
```

---

# Folder Structure

```text
repolens/
|
|-- frontend/
|   |-- public/
|   |   |-- brand/
|   |       |-- repolens-logo.png
|   |
|   |-- src/
|   |   |-- app/
|   |   |   |-- page.tsx
|   |   |   |-- layout.tsx
|   |   |   |-- analyze/
|   |   |   |   |-- repo/page.tsx
|   |   |   |   |-- profile/page.tsx
|   |   |   |-- compare/
|   |   |   |   |-- repo/page.tsx
|   |   |   |-- leaderboard/page.tsx
|   |   |
|   |   |-- components/
|   |   |   |-- site-header.tsx
|   |   |   |-- site-footer.tsx
|   |   |   |-- repo-comparison-result.tsx
|   |   |   |-- repo-feedback-card.tsx
|   |   |   |-- ui/
|   |   |
|   |   |-- lib/
|   |       |-- api.ts
|   |
|   |-- .env.local
|   |-- package.json
|
|-- backend/
|   |-- app/
|   |   |-- main.py
|   |   |
|   |   |-- api/routes/
|   |   |   |-- repo_routes.py
|   |   |   |-- profile_routes.py
|   |   |   |-- comparison_routes.py
|   |   |   |-- leaderboard_routes.py
|   |   |   |-- stats_routes.py
|   |   |   |-- ml_routes.py
|   |   |   |-- feedback_routes.py
|   |   |
|   |   |-- core/
|   |   |   |-- config.py
|   |   |
|   |   |-- ml/
|   |   |   |-- feature_vectorizer.py
|   |   |
|   |   |-- schemas/
|   |   |   |-- repo_schema.py
|   |   |   |-- profile_schema.py
|   |   |   |-- comparison_schema.py
|   |   |   |-- feedback_schema.py
|   |   |
|   |   |-- services/
|   |   |   |-- github_service.py
|   |   |   |-- feature_extractor.py
|   |   |   |-- scoring_service.py
|   |   |   |-- ml_scoring_service.py
|   |   |   |-- review_service.py
|   |   |   |-- repo_analysis_service.py
|   |   |   |-- profile_service.py
|   |   |   |-- comparison_service.py
|   |   |   |-- leaderboard_service.py
|   |   |   |-- stats_service.py
|   |   |
|   |   |-- utils/
|   |       |-- repo_parser.py
|   |       |-- user_parser.py
|   |
|   |-- storage/
|   |   |-- training_data.json
|   |   |-- feedback_labels.json
|   |   |-- leaderboard.json
|   |   |-- stats.json
|   |   |-- models/
|   |       |-- repolens_repo_model.joblib
|   |       |-- repolens_repo_model_meta.json
|   |
|   |-- .env
|   |-- requirements.txt
|
|-- docker-compose.yml
|-- README.md
|-- .gitignore
```

---

# Environment Variables

## Backend

File:

```text
backend/.env
```

Example:

```env
APP_NAME=RepoLens
APP_ENV=development

DATABASE_URL=postgresql+psycopg://repolens:repolens@localhost:5432/repolens_db
REDIS_URL=redis://localhost:6379/0

GITHUB_TOKEN=your_github_token_here
GEMINI_API_KEY=optional_gemini_key_here

LEADERBOARD_ADMIN_PASSWORD=your_admin_password_here

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

## Frontend

File:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=RepoLens
NEXT_PUBLIC_LEADERBOARD_ADMIN_PASSWORD=your_admin_password_here
```

Important:

```text
NEXT_PUBLIC environment variables are visible in browser.
Do not store production secrets in frontend env variables.
```

---

# Installation

## 1. Go to project root

```powershell
cd C:\Users\admin\OneDrive\Desktop\RepoLens\repolens
```

## 2. Install frontend dependencies

```powershell
cd frontend
npm install
```

If dependency conflict appears:

```powershell
npm install --legacy-peer-deps
```

## 3. Create backend virtual environment

```powershell
cd ..\backend
python -m venv .venv
.venv\Scripts\activate
```

## 4. Install backend dependencies

```powershell
pip install -r requirements.txt
```

If needed:

```powershell
pip install "fastapi[standard]" python-dotenv pydantic-settings httpx sqlalchemy psycopg[binary] alembic redis pandas numpy scikit-learn sentence-transformers chromadb google-genai python-multipart pillow reportlab joblib
```

## 5. Start Docker services

From project root:

```powershell
cd C:\Users\admin\OneDrive\Desktop\RepoLens\repolens
docker compose up -d
```

Expected containers:

```text
repolens_postgres
repolens_redis
```

Note: Current MVP stores ML/leaderboard data in JSON files, but Docker services are kept for future PostgreSQL/Redis upgrade.

---

# Running the Project

## Start Backend

```powershell
cd C:\Users\admin\OneDrive\Desktop\RepoLens\repolens\backend
.venv\Scripts\activate
fastapi dev app\main.py
```

Backend:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

## Start Frontend

Open a new terminal:

```powershell
cd C:\Users\admin\OneDrive\Desktop\RepoLens\repolens\frontend
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# GitHub API Rate Limit

RepoLens uses GitHub REST API.

Profile analysis can make multiple requests:

```text
1 user request
1 repo list request
README request for each repo
languages request for each repo
file tree request for each repo
```

Without a GitHub token, rate limit can be reached quickly.

Add token in:

```text
backend/.env
```

```env
GITHUB_TOKEN=your_github_token_here
```

For local testing, use fewer repos:

```text
maxRepos = 5
```

---

# Branding

Logo:

```text
frontend/public/brand/repolens-logo.png
```

Favicon files:

```text
frontend/src/app/favicon.ico
frontend/src/app/icon.png
frontend/src/app/apple-icon.png
```

---

# Current Limitations

Current MVP limitations:

- Public GitHub repositories only
- JSON storage instead of PostgreSQL
- No login system
- No private repo access
- No production-level admin authentication
- No advanced ML evaluation dashboard
- No cloud model registry

JSON storage is okay for:

```text
local demo
college/interview demo
small testing
```

Move to PostgreSQL when:

```text
multiple users use it live
10,000+ repo records exist
you deploy on serverless/temporary file storage
```

---

# Future Improvements

Planned improvements:

- PostgreSQL feature store
- Redis cache for GitHub API responses
- Saved score history
- User login
- Public scorecard links
- PDF/image scorecard export
- Profile comparison
- Model evaluation dashboard
- Admin dashboard for manual labels
- Better feedback weighting
- Gemini-powered explanation layer
- AI-generated README suggestions
- AI-generated architecture diagram
- Public RepoLens badge for GitHub README

Example badge:

```text
RepoLens Score: 84/100
Recruiter Ready
```

---

# Security Notes

Do not commit:

```text
backend/.env
frontend/.env.local
GitHub tokens
Admin passwords
API keys
```

Recommended `.gitignore` entries:

```gitignore
.env
.env.local
.venv/
node_modules/
.next/
__pycache__/
backend/storage/*.json
backend/storage/models/*.joblib
```

---

# Author

Built by:

```text
Mohit Pipaliya
```

Portfolio:

```text
https://mohitpipaliya.me
```

---

# Project Summary

RepoLens is a GitHub intelligence platform built around a custom learning model.

It does not only check repositories with fixed rules. It extracts repository features, stores training examples, trains a custom ML model, blends ML predictions with rule-based safety checks, and improves through user feedback.

Simple summary:

```text
RepoLens analyzes GitHub repos like a recruiter,
learns from repo data and user feedback,
and improves its own scoring model over time.
```
