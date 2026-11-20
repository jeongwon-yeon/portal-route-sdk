# Portal Route SDK

React Router의 `BrowserRouter`에서 부모 포털과 서비스 iframe의 URL을 동기화하는 로컬 패키지입니다.

## 서비스 연동

서비스의 `package.json`에 `"portal-route-sdk-demo": "file:../portal-route-sdk"`를 추가하고 `npm install`을 실행합니다. React와 React Router는 앱의 설치본을 사용합니다.

```tsx
import { BrowserRouter } from "react-router-dom";
import { PortalRouteSync } from "portal-route-sdk-demo";

export default function App() {
  return (
    <BrowserRouter>
      <PortalRouteSync parentOrigin="http://localhost:5173" />
      <AppRoutes />
    </BrowserRouter>
  );
}
```

`AppRoutes`는 서비스의 기존 라우트입니다. `parentOrigin`에는 포털의 스킴, 호스트, 포트를 지정합니다. iframe 밖에서 서비스를 직접 열면 라우터가 독립적으로 동작합니다.

포털에서는 현재 서비스의 iframe과 함께 `PortalHostSync`를 배치하고 `iframeRef`, `serviceOrigin`, `basePath`를 전달합니다. 서비스가 교체되면 프레임과 동기화 컴포넌트를 함께 다시 마운트합니다. Vite에서 로컬 SDK를 심볼릭 링크로 참조하는 경우 React와 React Router를 `resolve.dedupe`에 지정하고 SDK 경로를 `server.fs.allow`에 추가합니다.

서비스 내부의 일반 링크 이동은 대상 문서에도 SDK가 로드될 때 동기화됩니다. 배포 서버는 서비스 내부 경로에 SPA 진입점을 반환해야 하며 SDK의 문서 식별에는 로컬호스트 또는 HTTPS가 필요합니다.

이동을 시작한 라우터는 기존 History 동작을 유지하고 반대쪽은 `replace: true`로 URL을 맞춥니다. 부모와 iframe의 탐색 기록은 브라우저에서 함께 관리되므로, 서비스 전환이나 전체 문서 이동이 섞인 Back/Forward 동작은 브라우저별로 확인해야 합니다.
