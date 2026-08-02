import "server-only";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function getCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function hasSpotifyCredentials(): boolean {
  return Boolean(getCredentials());
}

async function fetchAccessToken(): Promise<string> {
  const creds = getCredentials();
  if (!creds) {
    throw new Error("SPOTIFY_CREDENTIALS_MISSING");
  }

  const basic = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`SPOTIFY_TOKEN_${res.status}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    return data.access_token;
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken(force = false): Promise<string> {
  if (
    !force &&
    tokenCache &&
    Date.now() < tokenCache.expiresAt - 60_000
  ) {
    return tokenCache.accessToken;
  }
  return fetchAccessToken();
}

export async function spotifyFetch<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const token = await getAccessToken(retried);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`https://api.spotify.com/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init?.headers || {}),
      },
      signal: controller.signal,
    });

    if (res.status === 401 && !retried) {
      tokenCache = null;
      return spotifyFetch<T>(path, init, true);
    }

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") || "2");
      const waitMs = Math.min(Math.max(retryAfter, 1), 8) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      if (!retried) return spotifyFetch<T>(path, init, true);
      throw new Error("SPOTIFY_RATE_LIMIT");
    }

    if (!res.ok) {
      throw new Error(`SPOTIFY_API_${res.status}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
