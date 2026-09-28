const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

/**
 * Upload a .all file and create a conversion job.
 */
export async function createJob(file) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Upload failed with status ${response.status}`
    );
  }

  return data;
}

/**
 * Get job status by jobId.
 */
export async function getJob(jobId) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Failed to get job status (${response.status})`
    );
  }

  return data;
}

/**
 * Get download URL for completed LAS file.
 */
export function getDownloadUrl(jobId) {
  return `${API_URL}/jobs/${jobId}/download`;
}