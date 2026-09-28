# 🎨 Frontend Architecture & Engineering Documentation

## 1. Executive Summary
The frontend is a modern, responsive Single Page Application (SPA) built with **Next.js** and **Tailwind CSS**. Its primary goal is to abstract the complexity of the backend's Linux-based conversion pipeline into a simple, accessible, and responsive drag-and-drop interface. 

It is designed specifically for non-technical hydrographic surveyors and GIS engineers who need to convert proprietary `.all` sonar files into `.las` point clouds without touching a command line.

---

## 2. Tech Stack & Installations

| Technology | Why it was installed / chosen |
| :--- | :--- |
| **Next.js (App Router)** | Provides a modern React framework with efficient bundling, simple routing, and excellent developer experience. |
| **Tailwind CSS** | Chosen for utility-first styling. It allows for rapid UI development, responsive design, and clean code without managing separate, bloated CSS files. |
| **Fetch API** | Native browser API used for making asynchronous HTTP requests to the backend without requiring heavy third-party libraries like Axios. |

---

## 3. Frontend Backbone & Core Components

The frontend is built on a strict separation of concerns, divided into three main pillars:

### 1. The State Machine (`page.js`)
The main page acts as a finite state machine. It manages the entire lifecycle of the user's file through distinct phases:
`idle` ➡️ `uploading` ➡️ `polling` ➡️ `completed` / `error`
This ensures the UI is always predictable and prevents users from triggering multiple uploads simultaneously.

### 2. The API Abstraction Layer (`lib/api.js`)
All backend communication is isolated in a dedicated helper file. This keeps the React components clean and focused purely on UI rendering. It exposes three simple functions:
*   `createJob(file)`: Handles `multipart/form-data` construction and POST requests.
*   `getJob(jobId)`: Handles polling GET requests.
*   `getDownloadUrl(jobId)`: Generates the secure download link.

### 3. The UI Layer (Tailwind CSS)
The interface uses a card-based, centered layout with clear visual feedback. It utilizes Tailwind's utility classes to provide hover states, disabled states for buttons during processing, and color-coded alerts for success/error states.

---

## 4. The User Journey (Frontend Pipeline)

When a user interacts with the application, the frontend executes the following pipeline:

1. **Ingestion:** The user drops a file onto the dropzone or uses the native file picker.
2. **Client-Side Validation:** Before sending any data over the network, the frontend checks the file extension. If it is not `.all`, it immediately throws a UI error, saving server resources.
3. **Upload & Handoff:** The file is wrapped in a `FormData` object and sent to `POST /api/v1/jobs`. The UI enters the `uploading` state.
4. **Asynchronous Polling:** Upon receiving a `jobId`, the frontend starts a `setInterval` loop, pinging `GET /api/v1/jobs/:id` every 2 seconds. The UI updates dynamically as the backend moves through stages (`validating` ➡️ `extracting` ➡️ `converting`).
5. **Completion & Profiling:** Once the backend returns `status: "completed"`, the polling stops. The frontend displays the bonus telemetry data (Point Count and Depth Range).
6. **Dynamic Download:** The user clicks the download button. The frontend uses the HTML5 `download` attribute combined with the original filename (e.g., `qwen.all` ➡️ `qwen.las`) to ensure the file saves with a meaningful name.

---

## 5. Key Features & Design Decisions

### 🔄 Asynchronous Job Polling
*   **Decision:** Instead of keeping the HTTP connection open while the file converts, the frontend polls for status.
*   **Why:** Sonar files can be 50MB+ and take minutes to process. A synchronous request would trigger browser timeouts and CORS errors. Polling guarantees a resilient UX even on slow connections.

### 🛑 Client-Side Guardrails
*   **Decision:** Validate the `.all` extension in the browser before uploading.
*   **Why:** Prevents unnecessary network traffic and server load. Provides instant feedback to the user if they accidentally select a `.txt` or `.csv` file.

### 🏷️ Dynamic Filename Preservation
*   **Decision:** Pass the original filename to the download link using the `download="qwen.las"` attribute.
*   **Why:** If a surveyor converts 10 different files, they need them saved as `survey_area_1.las`, `survey_area_2.las`, etc., rather than 10 files all named `converted.las`.

### 🧹 Memory Management (Cleanup)
*   **Decision:** Clear the polling interval (`clearInterval`) immediately when the component unmounts or when a terminal state (`completed`/`failed`) is reached.
*   **Why:** Prevents memory leaks and stops the browser from endlessly pinging a dead or finished job.

---

## 6. Challenges Overcome

### 1. Next.js Hydration Mismatches
*   **The Issue:** Next.js threw hydration warnings when rendering dynamic SVG elements or math-based coordinates on the server vs. the client.
*   **The Solution:** Isolated dynamic, client-only visual elements and applied `suppressHydrationWarning={true}` to decorative containers, ensuring React's strict rendering rules were satisfied without breaking the UI.

### 2. Cross-Origin Resource Sharing (CORS)
*   **The Issue:** The frontend runs on `localhost:3000` and the backend on `localhost:4000`. Browsers block cross-origin requests by default.
*   **The Solution:** Configured the Express backend to explicitly whitelist the frontend origin, and utilized Next.js environment variables (`NEXT_PUBLIC_API_URL`) to dynamically route API requests based on the environment.

### 3. Handling Large File UI Blocking
*   **The Issue:** Uploading a 50MB file can freeze the browser UI thread if not handled correctly.
*   **The Solution:** Utilized the native `FormData` API and asynchronous `fetch`, which streams the file in the background, keeping the React UI fully responsive and allowing the user to see the "Uploading..." state smoothly.

---

## 7. Project Structure

```text
frontend/
├── app/
│   ├── globals.css         # Tailwind CSS entry point
│   ├── layout.js           # Root HTML layout and metadata
│   └── page.js             # Main UI State Machine & Dropzone
├── lib/
│   └── api.js              # Backend communication abstraction
├── public/                 # Static assets
├── .env.local              # Environment variables (API URLs)
├── next.config.mjs         # Next.js configuration
└── package.json