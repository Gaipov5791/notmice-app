/** Public dataset client. Reads are anonymous; the server omits opt-out profiles. */

export interface PublicBiomarkerRow {
  publicId: string;
  collectedAt: string | null;
  chronologicalAge: number | null;
  loincCode: string | null;
  canonicalName: string | null;
  rawName: string;
  value: number;
  unit: string;
  mappingStatus: string;
}

export interface PublicDatasetPage {
  rows: PublicBiomarkerRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface TimeseriesMarker {
  loincCode: string | null;
  canonicalName: string | null;
  rawName: string;
  value: number;
  unit: string;
  mappingStatus: string;
}

export interface TimeseriesPoint {
  collectedAt: string | null;
  chronologicalAge: number | null;
  markers: TimeseriesMarker[];
}

export interface PublicTimeseries {
  publicId: string;
  points: TimeseriesPoint[];
}

export class DatasetRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Dataset request failed (${status})`);
    this.name = 'DatasetRequestError';
    this.status = status;
  }
}

interface DatasetPayload {
  rows: RowPayload[];
  total: number;
  limit: number;
  offset: number;
}

interface RowPayload {
  public_id: string;
  collected_at: string | null;
  chronological_age: number | null;
  loinc_code: string | null;
  canonical_name: string | null;
  raw_name: string;
  value: number;
  unit: string;
  mapping_status: string;
}

interface TimeseriesPayload {
  public_id: string;
  points: Array<{
    collected_at: string | null;
    chronological_age: number | null;
    markers: Array<{
      loinc_code: string | null;
      canonical_name: string | null;
      raw_name: string;
      value: number;
      unit: string;
      mapping_status: string;
    }>;
  }>;
}

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}${path}`;
}

function mapRow(row: RowPayload): PublicBiomarkerRow {
  return {
    publicId: row.public_id,
    collectedAt: row.collected_at,
    chronologicalAge: row.chronological_age,
    loincCode: row.loinc_code,
    canonicalName: row.canonical_name,
    rawName: row.raw_name,
    value: row.value,
    unit: row.unit,
    mappingStatus: row.mapping_status,
  };
}

export async function fetchPublicDataset(
  options?: { limit?: number; offset?: number; signal?: AbortSignal },
): Promise<PublicDatasetPage> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const response = await fetch(apiUrl(`/api/v1/dataset?limit=${limit}&offset=${offset}`), {
    signal: options?.signal,
  });
  if (!response.ok) {
    throw new DatasetRequestError(response.status);
  }
  const payload = (await response.json()) as DatasetPayload;
  return {
    rows: payload.rows.map(mapRow),
    total: payload.total,
    limit: payload.limit,
    offset: payload.offset,
  };
}

export type PublicExportKind = 'csv' | 'parquet' | 'datasheet';

const PUBLIC_EXPORTS: Record<PublicExportKind, { path: string; filename: string }> = {
  csv: { path: '/api/v1/dataset.csv', filename: 'notmice-public-biomarkers.csv' },
  parquet: { path: '/api/v1/dataset.parquet', filename: 'notmice-public-biomarkers.parquet' },
  datasheet: { path: '/api/v1/dataset/datasheet', filename: 'notmice-dataset-datasheet.md' },
};

export async function downloadPublicDatasetExport(kind: PublicExportKind): Promise<void> {
  const spec = PUBLIC_EXPORTS[kind];
  const response = await fetch(apiUrl(spec.path));
  if (!response.ok) {
    throw new DatasetRequestError(response.status);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = spec.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function fetchPublicTimeseries(
  publicId: string,
  signal?: AbortSignal,
): Promise<PublicTimeseries> {
  const response = await fetch(apiUrl(`/api/v1/profiles/${encodeURIComponent(publicId)}/timeseries`), {
    signal,
  });
  if (!response.ok) {
    throw new DatasetRequestError(response.status);
  }
  const payload = (await response.json()) as TimeseriesPayload;
  return {
    publicId: payload.public_id,
    points: payload.points.map((point) => ({
      collectedAt: point.collected_at,
      chronologicalAge: point.chronological_age,
      markers: point.markers.map((marker) => ({
        loincCode: marker.loinc_code,
        canonicalName: marker.canonical_name,
        rawName: marker.raw_name,
        value: marker.value,
        unit: marker.unit,
        mappingStatus: marker.mapping_status,
      })),
    })),
  };
}
