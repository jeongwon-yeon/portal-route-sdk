export const MESSAGE_SOURCE = "portal-route-sdk-demo";
export const MESSAGE_VERSION = 2;

// CHILD_READY와 CHILD_ROUTE_CHANGED는 서비스에서 포털로, HOST_NAVIGATE는 반대로 간다.
// documentId는 같은 iframe 안에서 문서가 다시 로드될 때 이전 문서의 메시지를 구별한다.
export function createMessage(type, documentId, path) {
  return { source: MESSAGE_SOURCE, version: MESSAGE_VERSION, type, documentId, path };
}

export function isMessage(data, type) {
  return Boolean(
    data && typeof data === "object" &&
    data.source === MESSAGE_SOURCE &&
    data.version === MESSAGE_VERSION &&
    data.type === type &&
    typeof data.documentId === "string" &&
    data.documentId.length > 0
  );
}

// 메시지에는 /board?tab=a#top처럼 앱 루트 기준 경로만 허용한다.
// 정규화 결과가 //로 시작하면 navigate에 넘겼을 때 호스트 주소로 해석될 수 있어 거부한다.
export function normalizePath(input) {
  if (typeof input !== "string" || !input.startsWith("/") || input.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(input)) {
    return null;
  }
  try {
    const url = new URL(input, "https://path-check.invalid");
    if (url.origin !== "https://path-check.invalid" || url.pathname.startsWith("//")) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function routeToString(location) {
  return location.pathname + location.search + location.hash;
}

export function getChildPath(fullPath, basePath) {
  // 경로 세그먼트 경계에서만 접두사를 제거한다. /sub-app10은 /sub-app1의 경로가 아니다.
  if (fullPath === basePath) return "/";
  if (fullPath.startsWith(`${basePath}?`) || fullPath.startsWith(`${basePath}#`)) {
    return normalizePath(`/${fullPath.slice(basePath.length)}`);
  }
  if (!fullPath.startsWith(`${basePath}/`)) return null;
  return normalizePath(fullPath.slice(basePath.length));
}
