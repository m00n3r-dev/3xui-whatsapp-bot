import { CookieJar } from "tough-cookie";
import { fetch } from "undici";

const jar = new CookieJar();

export async function fetchWithCookies(url: string, options: any = {}) {
  const cookie = await jar.getCookieString(url);
  options.headers = {
    ...options.headers,
    Cookie: cookie,
  };

  const response = await fetch(url, options);

  // Store new cookies from response
  const setCookie = response.headers.getSetCookie?.() || response.headers.get("set-cookie");
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const c of cookies) {
      await jar.setCookie(c, url);
    }
  }

  return response;
}

export async function doLogin() {
  const loginRes = await fetchWithCookies(`https://${Bun.env.HOST}:${Bun.env.PORT}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: Bun.env.PANEL_USERNAME,
      password: Bun.env.PANEL_PASSWORD,
    }),
  });

  const loginJson = await loginRes.json();

  if (loginJson.success) {
    console.log("✅ 3xUI login successful");
    return true;
  } else {
    console.error("❌ Login failed:", loginJson.message);
    return false;
  }
}

/**
 * Fetch with auto-login retry on redirect/login-required
 */
export async function fetchWithAutoLogin(url: string, options: any = {}, triedLogin = false) {
  const response = await fetchWithCookies(url, options);

  // Example detection:
  // - Check if response status is 302 redirect to login page
  // - Or response JSON indicates unauthorized
  if (
    (response.status === 302 || response.status === 401 || response.status === 403) &&
    !triedLogin
  ) {
    console.warn("Session expired or unauthorized, retrying login...");

    const loggedIn = await doLogin();
    if (loggedIn) {
      // Retry original request once after successful login
      return fetchWithAutoLogin(url, options, true);
    } else {
      throw new Error("Login failed, cannot retry request");
    }
  }

  return response;
}


// Usage example:
(async () => {
  const loggedIn = await doLogin();
})();
