import { createBrowserClient } from "@supabase/ssr";

interface CookieOptions {
  maxAge?: number;
  expires?: Date | string | number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
}

interface CookieToSet {
  name: string;
  value: string;
  options: Partial<CookieOptions>;
}

function parseCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined") {
    return [];
  }
  return document.cookie.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

function setCookie(name: string, value: string, options: CookieOptions) {
  if (typeof document === "undefined") {
    return;
  }
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  const isDeletion = value === "" || options.maxAge === 0;
  let cookie = `${name}=${value}`;

  if (isDeletion) {
    cookie += "; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } else {
    if (options.maxAge !== undefined) {
      cookie += `; Max-Age=${options.maxAge}`;
    }
    if (options.expires !== undefined) {
      const expires =
        options.expires instanceof Date
          ? options.expires.toUTCString()
          : new Date(options.expires).toUTCString();
      cookie += `; Expires=${expires}`;
    }
  }

  cookie += `; Path=${options.path || "/"}`;

  if (cookieDomain) {
    cookie += `; Domain=${cookieDomain}`;
  }

  if (options.secure || process.env.NODE_ENV === "production") {
    cookie += "; Secure";
  }

  cookie += `; SameSite=${options.sameSite || "Lax"}`;

  document.cookie = cookie;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookies();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options);
          });
        },
      },
    }
  );
}
