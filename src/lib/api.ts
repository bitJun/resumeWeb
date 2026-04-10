import {
  CandidateListResponse,
  CandidateRecord,
  CandidateStatus,
  JobDescriptionRecord,
  MatchRecord,
  ResumeExtraction
} from "@/types/api";

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }

  // In production, never silently fallback to localhost.
  // Empty string means same-origin requests like /api/jobs.
  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);
  const hasJsonBody = init?.body !== undefined && !(init.body instanceof FormData);

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function uploadCandidates(files: File[], onProgress?: (progress: number) => void) {
  return new Promise<{ items: CandidateRecord[] }>((resolve, reject) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/candidates/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onerror = () => reject(new Error("上传失败，请检查后端服务是否可用。"));
    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText) as { items: CandidateRecord[]; message?: string };
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ items: parsed.items });
        } else {
          reject(new Error(parsed.message ?? "上传失败。"));
        }
      } catch {
        reject(new Error("上传响应解析失败。"));
      }
    };

    xhr.send(formData);
  });
}

export function extractCandidate(candidateId: string) {
  return apiFetch<{ candidate: CandidateRecord }>(`/api/candidates/${candidateId}/extract`, {
    method: "POST"
  });
}

export function streamCandidateExtraction(
  candidateId: string,
  handlers: {
    onStatus?: (data: unknown) => void;
    onSection?: (data: unknown) => void;
    onDone?: (data: { candidate: CandidateRecord }) => void;
    onError?: (message: string) => void;
  }
) {
  const shouldPreferFallback = API_BASE_URL.includes(".netlify.app");

  if (shouldPreferFallback) {
    void extractCandidate(candidateId)
      .then((payload) => {
        handlers.onStatus?.({ progress: 100, label: "提取完成" });
        handlers.onDone?.(payload);
      })
      .catch((error) => {
        handlers.onError?.(error instanceof Error ? error.message : "提取失败");
      });

    return {
      close() {
        return undefined;
      }
    };
  }

  const eventSource = new EventSource(`${API_BASE_URL}/api/candidates/${candidateId}/extraction-stream`);

  eventSource.addEventListener("status", (event) => {
    handlers.onStatus?.(JSON.parse(event.data));
  });
  eventSource.addEventListener("progress", (event) => {
    handlers.onStatus?.(JSON.parse(event.data));
  });
  eventSource.addEventListener("section", (event) => {
    handlers.onSection?.(JSON.parse(event.data));
  });
  eventSource.addEventListener("done", (event) => {
    handlers.onDone?.(JSON.parse(event.data));
    eventSource.close();
  });
  eventSource.addEventListener("error", (event) => {
    const message =
      event instanceof MessageEvent ? JSON.parse(event.data ?? "{}").message ?? "流式提取失败。" : "流式连接断开。";
    handlers.onError?.(message);
    eventSource.close();
  });

  return eventSource;
}

export function listCandidates(params?: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  return apiFetch<CandidateListResponse>(`/api/candidates?${search.toString()}`);
}

export function getCandidate(candidateId: string) {
  return apiFetch<CandidateRecord>(`/api/candidates/${candidateId}`);
}

export function updateCandidateStatus(candidateId: string, status: CandidateStatus) {
  return apiFetch<CandidateRecord>(`/api/candidates/${candidateId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export function updateCandidateExtraction(candidateId: string, extraction: Partial<ResumeExtraction>) {
  return apiFetch<CandidateRecord>(`/api/candidates/${candidateId}/extraction`, {
    method: "PATCH",
    body: JSON.stringify(extraction)
  });
}

export function scoreCandidate(candidateId: string, jobId: string) {
  return apiFetch<MatchRecord>(`/api/candidates/${candidateId}/match`, {
    method: "POST",
    body: JSON.stringify({ jobId })
  });
}

export function listJobs() {
  return apiFetch<{ items: JobDescriptionRecord[] }>("/api/jobs");
}

export function getJob(jobId: string) {
  return apiFetch<JobDescriptionRecord>(`/api/jobs/${jobId}`);
}

export function createJob(payload: Pick<JobDescriptionRecord, "title" | "description" | "mustSkills" | "bonusSkills">) {
  return apiFetch<JobDescriptionRecord>("/api/jobs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateJob(
  jobId: string,
  payload: Partial<Pick<JobDescriptionRecord, "title" | "description" | "mustSkills" | "bonusSkills">>
) {
  return apiFetch<JobDescriptionRecord>(`/api/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function scoreJobCandidates(jobId: string, candidateIds?: string[]) {
  return apiFetch<{ items: MatchRecord[] }>(`/api/jobs/${jobId}/score-candidates`, {
    method: "POST",
    body: JSON.stringify({ candidateIds })
  });
}

export function compareCandidates(candidateIds: string[], jobId?: string) {
  const search = new URLSearchParams({ ids: candidateIds.join(",") });
  if (jobId) {
    search.set("jobId", jobId);
  }
  return apiFetch<{ candidates: CandidateRecord[]; matches: MatchRecord[] }>(
    `/api/candidates/compare?${search.toString()}`
  );
}
