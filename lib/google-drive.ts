import { createSign } from "crypto";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";

type UploadResult = {
  secure_url: string;
  original_filename: string;
  public_id: string;
  resource_type: "drive";
  format: string;
};

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

function getDriveConfig() {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || "";
  const privateKey = (process.env.GOOGLE_DRIVE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

  if (!clientEmail || !privateKey || !rootFolderId) {
    throw new Error("Google Drive environment variables are not configured.");
  }

  return { clientEmail, privateKey, rootFolderId };
}

function toBase64Url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const { clientEmail, privateKey } = getDriveConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: DRIVE_SCOPE,
      aud: TOKEN_URL,
      exp: now + 3600,
      iat: now
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${header}.${payload}.${toBase64Url(signature)}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with Google Drive.");
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000
  };

  return data.access_token;
}

function buildUrl(base: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(base);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function driveFetch(
  path: string,
  init?: RequestInit,
  query?: Record<string, string | number | boolean | undefined>,
  options?: { upload?: boolean }
) {
  const accessToken = await getAccessToken();
  const base = options?.upload ? DRIVE_UPLOAD_BASE : DRIVE_API_BASE;
  const response = await fetch(buildUrl(`${base}${path}`, query), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers || {})
    }
  });

  return response;
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function findFolder(parentId: string, name: string) {
  const response = await driveFetch(
    "/files",
    undefined,
    {
      q: `'${escapeDriveQuery(parentId)}' in parents and mimeType='${FOLDER_MIME_TYPE}' and trashed=false and name='${escapeDriveQuery(name)}'`,
      fields: "files(id,name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    }
  );

  if (!response.ok) {
    throw new Error("Failed to read Google Drive folders.");
  }

  const data = (await response.json()) as { files?: Array<{ id: string; name: string }> };
  return data.files?.[0]?.id || "";
}

async function createFolder(parentId: string, name: string) {
  const response = await driveFetch(
    "/files",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME_TYPE,
        parents: [parentId]
      })
    },
    {
      supportsAllDrives: true,
      fields: "id"
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create a Google Drive folder.");
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

async function ensureFolderPath(folderPath: string) {
  const { rootFolderId } = getDriveConfig();
  const segments = folderPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  let currentParent = rootFolderId;
  for (const segment of segments) {
    const existing = await findFolder(currentParent, segment);
    currentParent = existing || (await createFolder(currentParent, segment));
  }

  return currentParent;
}

export async function uploadToGoogleDrive(file: File, folderPath: string): Promise<UploadResult> {
  const parentId = await ensureFolderPath(folderPath);
  const mimeType = file.type || "application/octet-stream";
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() || "" : "";
  const boundary = `acadex-${Date.now().toString(36)}`;
  const metadata = {
    name: file.name,
    parents: [parentId]
  };
  const metadataPart = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
  );
  const fileHeader = Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
  const fileBytes = Buffer.from(await file.arrayBuffer());
  const closing = Buffer.from(`\r\n--${boundary}--`);
  const body = Buffer.concat([metadataPart, fileHeader, fileBytes, closing]);

  const response = await driveFetch(
    "/files",
    {
      method: "POST",
      headers: {
        "Content-Type": `multipart/related; boundary=${boundary}`
      },
      body
    },
    {
      uploadType: "multipart",
      supportsAllDrives: true,
      fields: "id,name,mimeType,webViewLink,webContentLink"
    },
    { upload: true }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.log("GOOGLE DRIVE REAL ERROR:", errText);
    throw new Error(errText);
  }

  const data = (await response.json()) as {
    id: string;
    name: string;
    mimeType?: string;
    webViewLink?: string;
    webContentLink?: string;
  };

  await driveFetch(
    `/files/${data.id}/permissions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "reader", type: "anyone" })
    },
    { supportsAllDrives: true }
  ).catch(() => null);

  return {
    secure_url: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    original_filename: data.name || file.name,
    public_id: data.id,
    resource_type: "drive",
    format: extension
  };
}

export async function downloadFromGoogleDrive(fileId: string) {
  return driveFetch(`/files/${fileId}`, undefined, {
    alt: "media",
    supportsAllDrives: true
  });
}

export async function deleteFromGoogleDrive(fileId: string) {
  const response = await driveFetch(`/files/${fileId}`, { method: "DELETE" }, { supportsAllDrives: true });
  if (!response.ok && response.status !== 404) {
    throw new Error("Failed to delete Google Drive file.");
  }
}
