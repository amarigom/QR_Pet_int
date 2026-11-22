import {
  ClinicalStudy,
  ClinicalStudyWithAccess,
} from "../types/clinical-study";

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:8000";

const API_V1_URL = RAW_API_URL.endsWith("/api/v1")
  ? RAW_API_URL
  : `${RAW_API_URL}/api/v1`;

export async function fetchPetStudies(
  petId: string,
  token: string,
  categoria?: string
): Promise<ClinicalStudy[]> {
  const url = new URL(`${API_V1_URL}/clinical-studies/pet/${petId}`);
  if (categoria && categoria !== "ALL") {
    url.searchParams.set("categoria", categoria);
  }

  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "No se pudieron cargar los estudios clínicos.");
  }

  return res.json();
}

export async function uploadClinicalStudy(
  formData: FormData,
  token: string
): Promise<ClinicalStudy> {
  const res = await fetch(`${API_V1_URL}/clinical-studies/`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Error al subir el estudio clínico.");
  }

  return res.json();
}

export async function fetchStudyAccessUrl(
  studyId: string,
  token: string
): Promise<ClinicalStudyWithAccess> {
  const res = await fetch(`${API_V1_URL}/clinical-studies/${studyId}/access`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "No se pudo obtener el enlace del estudio.");
  }

  return res.json();
}