import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createMessage, getChildPath, isMessage, normalizePath, routeToString } from "./protocol.js";

/**
 * 포털의 BrowserRouter 안에서 현재 서비스 iframe과 함께 등록한다.
 * 예를 들어 basePath가 /sub-app1이면 부모 /sub-app1/board?tab=a#top과
 * iframe /board?tab=a#top을 서로 매핑한다.
 */
export function PortalHostSync({ iframeRef, serviceOrigin, basePath }) {
  const navigate = useNavigate();
  const fullPath = routeToString(useLocation());
  const router = useRef(null);
  const child = useRef(null);
  router.current = { navigate, fullPath };

  useLayoutEffect(() => {
    const onMessage = (event) => {
      // 형제 iframe의 ref가 layout effect보다 늦게 연결될 수 있어 메시지 수신 시점에 읽는다.
      const frame = iframeRef.current?.contentWindow;
      if (!frame || event.origin !== serviceOrigin || event.source !== frame) return;

      // 새 프레임은 초기 연결부터 시작한다. 경로 변경 메시지는 연결된 문서 ID만 허용한다.
      if (child.current?.frame !== frame) child.current = null;
      const ready = isMessage(event.data, "CHILD_READY");
      if (!ready && !isMessage(event.data, "CHILD_ROUTE_CHANGED")) return;
      const { documentId } = event.data;
      const path = normalizePath(event.data.path);
      const hostPath = getChildPath(router.current.fullPath, basePath);
      if (path === null || hostPath === null || (!ready && child.current?.documentId !== documentId)) return;

      if (ready) {
        // 첫 문서는 포털의 현재 URL을 복원한다. 같은 프레임의 이후 문서는
        // 일반 링크나 새로고침으로 실제 열린 URL을 포털에 반영한다.
        const target = child.current ? path : hostPath;
        child.current = { frame, documentId, path: target };
        frame.postMessage(createMessage("HOST_NAVIGATE", documentId, target), serviceOrigin);
        if (target !== path) return;
      } else {
        child.current.path = path;
      }

      if (path === hostPath) return;
      // 서비스 루트의 쿼리/해시 앞에 있는 슬래시는 제거한다. /?tab=a → /sub-app1?tab=a
      const suffix = path === "/" || path.startsWith("/?") || path.startsWith("/#") ? path.slice(1) : path;
      // 서비스에서 이미 처리한 이동을 포털 URL에 반영할 때 기록을 한 건 더 추가하지 않는다.
      router.current.navigate(basePath + suffix, { replace: true });
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      child.current = null;
    };
  }, [iframeRef, serviceOrigin, basePath]);

  useEffect(() => {
    // 포털 Link, navigate 또는 Back/Forward 등으로 현재 서비스의 URL이 바뀐 경우 전송한다.
    // iframe이 보고했거나 이미 전송한 경로는 생략하고 iframe src는 그대로 유지한다.
    const frame = iframeRef.current?.contentWindow;
    if (!frame || child.current?.frame !== frame) return;
    const path = getChildPath(fullPath, basePath);
    if (path === null || path === child.current.path) return;

    child.current.path = path;
    frame.postMessage(
      createMessage("HOST_NAVIGATE", child.current.documentId, path),
      serviceOrigin,
    );
  }, [fullPath, iframeRef, serviceOrigin, basePath]);

  return null;
}
