export async function probeHttp(url, timeoutMs = 2500) {
  const started = new Date().toISOString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
    const body = await response.text();
    return {
      url,
      started,
      ok: response.ok,
      status: response.status,
      error: null,
      bodySnippet: body.slice(0, 500),
      contentType: response.headers.get("content-type"),
    };
  } catch (error) {
    const code = error?.cause?.code || error?.code || null;
    const aborted = error?.name === "AbortError";
    return {
      url,
      started,
      ok: false,
      status: 0,
      error: aborted ? "timeout" : code || error?.message || String(error),
      bodySnippet: "",
      contentType: null,
    };
  } finally {
    clearTimeout(timer);
  }
}
