# ⚙️ Backend Service

Node.js + Express API that orchestrates the MB-System and PDAL conversion pipeline.

---

## Prerequisites
- Docker Desktop installed and running.

## 1. Build the Image
This compiles MB-System from source and installs PDAL.
*(Takes ~10-15 minutes on first run).*
```bash
docker build -t multibeam-backend .



---

### 📁 `frontend/README.md`

```markdown
# 🎨 Frontend Service

Next.js UI for drag-and-drop file upload, progress polling, and LAS download.

---

## Prerequisites
- Docker Desktop installed.
- Backend container running on port `4000`.

## 1. Build the Image
The API URL is baked into the bundle at build time.
```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1 -t multibeam-frontend .