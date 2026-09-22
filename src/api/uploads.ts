/** Lab extract/confirm API client. Maps snake_case payloads to camelCase for the UI. */

import type { ExtractedMarker } from '../types';

export interface ExtractResult {
  extractToken: string;
  documentSha256: string;
  parserVersion: string;
  labName: string | null;
  collectedAt: string | null;
  chronologicalAge: number | null;
  markers: ExtractedMarker[];
}

export interface ConfirmResult {
  labResultId: string;
  documentSha256: string;
  parserVersion: string;
  confirmedAt: string;
  markerCount: number;
}

interface ExtractedMarkerPayload {
  raw_name: string;
  canonical_id: string | null;
  loinc_code: string | null;
  value: number;
  unit: string;
  confidence: number;
  mapping_status: 'mapped' | 'unmapped';
  within_range: boolean | null;
}

interface ExtractPayload {
  extract_token: string;
  document_sha256: string;
  parser_version: string;
  lab_name: string | null;
  collected_at: string | null;
  chronological_age: number | null;
  markers: ExtractedMarkerPayload[];
}

interface ConfirmPayload {
  lab_result_id: string;
  document_sha256: string;
  parser_version: string;
  confirmed_at: string;
  marker_count: number;
}

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}${path}`;
}

async function readError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
  } catch {
    // Fall through to status text.
  }
  return `Request failed (${response.status})`;
}

function mapMarker(payload: ExtractedMarkerPayload): ExtractedMarker {
  return {
    rawName: payload.raw_name,
    canonicalId: payload.canonical_id,
    loincCode: payload.loinc_code,
    value: payload.value,
    unit: payload.unit,
    confidence: payload.confidence,
    mappingStatus: payload.mapping_status,
    withinRange: payload.within_range,
  };
}

export async function extractLabFile(token: string, file: File): Promise<ExtractResult> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(apiUrl('/api/v1/uploads/extract'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const payload = (await response.json()) as ExtractPayload;
  return {
    extractToken: payload.extract_token,
    documentSha256: payload.document_sha256,
    parserVersion: payload.parser_version,
    labName: payload.lab_name,
    collectedAt: payload.collected_at,
    chronologicalAge: payload.chronological_age,
    markers: payload.markers.map(mapMarker),
  };
}

export async function confirmLabExtraction(
  token: string,
  input: {
    extractToken: string;
    labName: string | null;
    collectedAt: string | null;
    chronologicalAge: number | null;
    markers: { rawName: string; value: number; unit: string }[];
  }
): Promise<ConfirmResult> {
  const response = await fetch(apiUrl('/api/v1/uploads/confirm'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      extract_token: input.extractToken,
      lab_name: input.labName,
      collected_at: input.collectedAt,
      chronological_age: input.chronologicalAge,
      markers: input.markers.map((marker) => ({
        raw_name: marker.rawName,
        value: marker.value,
        unit: marker.unit,
      })),
    }),
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  const payload = (await response.json()) as ConfirmPayload;
  return {
    labResultId: payload.lab_result_id,
    documentSha256: payload.document_sha256,
    parserVersion: payload.parser_version,
    confirmedAt: payload.confirmed_at,
    markerCount: payload.marker_count,
  };
}
