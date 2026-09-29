## 📦 Quick Start for Evaluators

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) must be installed and running.

1. Unzip the project and open a terminal in the root directory.
2. Run the following command to build the images and start the servers:
   ```bash
   docker compose up --build

   ### Conversion Pipeline
1. **Validation (`mbinfo -I input.all`):** Verifies the binary header is a valid Kongsberg format.
2. **Extraction (`mblist -I input.all -MA -OXYz`):** Reads the raw .all file directly.
   Lowercase `z` outputs elevation (positive-up) per MB-System convention. No manual
   sign inversion is applied. Invalid navigation points (0,0,0) are filtered.
3. **LAS Generation (`pdal pipeline`):** Converts the normalized XYZ to binary LAS
   with EPSG:4326 (WGS84) and scale factors of 0.0000001 for degree precision.

**Design decisions:**
- The `mbkongsbergpreprocess` step recommended in the brief was evaluated but
  could not be made to work reliably in a headless Docker container. The pipeline
  reads the raw `.all` file directly via `mblist`, which produces correct geometry.
- UTM projection (bonus/optional) was evaluated. The sample data coordinates fall
  outside UTM Zone 45N's valid range. Output remains in WGS84 (EPSG:4326) to
  preserve data integrity.



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