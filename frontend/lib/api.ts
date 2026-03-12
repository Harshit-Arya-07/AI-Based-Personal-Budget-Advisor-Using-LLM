import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${normalizedPath}`;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return await response.json();
  }

  const text = await response.text();
  return {
    error: text && text.trim().startsWith('<!DOCTYPE')
      ? 'Received HTML instead of JSON. Check backend server status.'
      : text || response.statusText || 'Request failed',
  };
}

function waitForAuthUser(timeoutMs = 5000): Promise<User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser || (await waitForAuthUser());
  if (!user) {
    throw new Error('You must be logged in');
  }

  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function authedPost(path: string, payload: unknown) {
  const headers = await authHeader();
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await parseResponse(response);
  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }

  return json;
}

export async function authedGet(path: string) {
  const headers = await authHeader();
  const response = await fetch(buildApiUrl(path), {
    method: 'GET',
    headers,
  });

  const json = await parseResponse(response);
  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }

  return json;
}

export async function authedPut(path: string, payload: unknown) {
  const headers = await authHeader();
  const response = await fetch(buildApiUrl(path), {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });

  const json = await parseResponse(response);
  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }

  return json;
}

export async function authedDelete(path: string, payload?: unknown) {
  const headers = await authHeader();
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const json = await parseResponse(response);
  if (!response.ok) {
    throw new Error(json.error || 'Request failed');
  }

  return json;
}
