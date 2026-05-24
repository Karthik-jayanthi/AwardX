import type { PublicPagePayload } from '../components/pages/PublicPageSections';
import { fetchBackendJson, type FetchBackendOptions } from './backendApi';

export type ProgramMediaAsset = {
  name: string;
  path: string;
  url: string | null;
  size?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export interface OverviewApiRequestTrace {
  path: string;
  url: string;
  method: 'GET';
  requireAuth: boolean;
  attempt: number;
  startedAt: string;
  finishedAt: string;
  status: number | null;
  ok: boolean;
  error: string | null;
}

type TraceCallback = (trace: OverviewApiRequestTrace) => void;

type OverviewApiResponse<T = unknown> = { data?: T };

async function fetchJson<T = unknown>(
  path: string,
  requireAuth = false,
  onTrace?: TraceCallback,
) {
  const options: FetchBackendOptions = { requireAuth, errorPrefix: 'Overview API' };
  const startedAt = new Date().toISOString();

  try {
    const data = await fetchBackendJson<OverviewApiResponse<T>>(path, options);
    onTrace?.({
      path,
      url: path,
      method: 'GET',
      requireAuth,
      attempt: 1,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: 200,
      ok: true,
      error: null,
    });
    return data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    onTrace?.({
      path,
      url: path,
      method: 'GET',
      requireAuth,
      attempt: 1,
      startedAt,
      finishedAt: new Date().toISOString(),
      status: null,
      ok: false,
      error: message,
    });
    throw error;
  }
}

export async function getPublicOverviewBySlug(slug: string): Promise<PublicPagePayload | null> {
  const response = await fetchJson<PublicPagePayload>(
    `/api/overview/public/by-slug/${encodeURIComponent(slug)}`,
  );
  return response?.data ?? null;
}

export async function getPublicOverviewByProgramId(programId: string): Promise<PublicPagePayload | null> {
  const response = await fetchJson<PublicPagePayload>(
    `/api/overview/public/${encodeURIComponent(programId)}`,
  );
  return response?.data ?? null;
}

export async function getProgramMediaAssets(
  programId: string,
  options?: { onTrace?: TraceCallback },
): Promise<ProgramMediaAsset[]> {
  const response = await fetchJson<ProgramMediaAsset[]>(
    `/api/overview/${encodeURIComponent(programId)}/media`,
    true,
    options?.onTrace,
  );
  return response?.data ?? [];
}

export async function invalidateOverviewCache(programId: string) {
  await fetchBackendJson(`/api/overview/${encodeURIComponent(programId)}/invalidate-cache`, {
    method: 'POST',
    requireAuth: true,
    errorPrefix: 'Overview cache API',
  });
}
