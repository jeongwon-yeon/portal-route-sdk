import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createMessage, isMessage, normalizePath, routeToString } from "./protocol.js";

/**
 * 서비스의 BrowserRouter 안에 한 번 등록한다. SDK는 navigate 호출을 가로채지 않고
 * React Router의 useLocation()에서 관측한 pathname + search + hash 변화를 전달한다.
 *
 * - navigate("/board"), navigate("../board"), navigate({ pathname, search, hash })처럼
 *   라우터가 해석한 결과 URL이 바뀌는 이동과 <Link to="/board">를 감지한다.
 * - navigate("/board", { replace: true })도 감지한다. push/replace 옵션 자체는 전달하지 않는다.
 * - navigate(-1), navigate(1), 브라우저 Back/Forward로 iframe의 라우터 URL이 바뀌면
 *   이동 결과를 감지한다. 숫자 이동은 브라우저의 부모·iframe 공동 기록을 따르며,
 *   포털에는 -1이나 1을 보내서 동일한 이동을 다시 실행하지 않는다.
 * - URL이 그대로인 state 전용 변경이나 같은 URL 재이동은 전달하지 않는다.
 *   Router 밖의 직접 history.pushState()/replaceState() 호출도 별도로 감시하지 않는다.
 * - 일반 <a href>, location.href, 새로고침은 문서 이동이다. 대상 문서에 SDK가
 *   다시 로드되면 CHILD_READY를 통해 새 문서의 URL을 처리한다.
 */
export function PortalRouteSync({ parentOrigin }) {
  const navigate = useNavigate();
  const path = routeToString(useLocation());
  const router = useRef(null);
  const documentId = useRef(null);
  const reportedPath = useRef(null);
  const announcedOrigin = useRef(null);
  // 메시지 리스너를 다시 등록하지 않아도 현재 라우터 상태를 읽을 수 있게 한다.
  router.current = { navigate, path };

  useEffect(() => {
    if (window.parent === window) return;
    documentId.current ??= window.crypto.randomUUID();

    const onMessage = (event) => {
      if (event.source !== window.parent || event.origin !== parentOrigin) return;
      if (!isMessage(event.data, "HOST_NAVIGATE") || event.data.documentId !== documentId.current) return;
      const next = normalizePath(event.data.path);
      if (next === null) return;

      // 포털이 지정한 URL을 먼저 기록하면 변경 후 effect가 같은 URL을 되돌려 보내지 않는다.
      // 반영에는 replace를 사용해 동기화로 인한 iframe 기록 추가를 막는다.
      reportedPath.current = next;
      if (router.current.path !== next) router.current.navigate(next, { replace: true });
    };

    const announce = () => {
      // 초기 응답을 기다리는 동안 iframe의 시작 URL이 포털의 딥 링크를 덮지 않게 한다.
      reportedPath.current = null;
      window.parent.postMessage(createMessage("CHILD_READY", documentId.current, router.current.path), parentOrigin);
    };
    const onPageShow = (event) => {
      // Back/Forward 캐시에서 복원되면 컴포넌트가 다시 마운트되지 않아 별도로 알린다.
      if (event.persisted) announce();
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("pageshow", onPageShow);
    // StrictMode가 effect를 다시 설정해도 같은 origin에는 READY를 중복 전송하지 않는다.
    if (announcedOrigin.current !== parentOrigin) {
      announcedOrigin.current = parentOrigin;
      announce();
    }

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [parentOrigin]);

  useEffect(() => {
    if (reportedPath.current === null || path === reportedPath.current) return;
    reportedPath.current = path;
    window.parent.postMessage(createMessage("CHILD_ROUTE_CHANGED", documentId.current, path), parentOrigin);
  }, [path, parentOrigin]);

  return null;
}
