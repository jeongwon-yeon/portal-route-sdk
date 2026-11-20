# 서비스 앱 예제

기존 React + TypeScript 앱의 App.tsx에 복사해서 사용합니다.

```tsx
import { BrowserRouter, Link, Route, Routes, useNavigate } from "react-router-dom";
import { PortalRouteSync } from "portal-route-sdk-demo";

function Navigation() {
  const navigate = useNavigate();
  return (
    <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
      <Link to="/">Home (Link)</Link>
      <Link to="/board">Board (Link)</Link>
      <button onClick={() => navigate("/detail/123")}>Detail (navigate)</button>
      <button onClick={() => navigate(-1)}>Back (navigate -1)</button>
      <button onClick={() => window.location.reload()}>Reload iframe</button>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PortalRouteSync parentOrigin="http://localhost:5173" />
      <h1>Service A (iframe)</h1>
      <Navigation />
      <Routes>
        <Route path="/" element={<p>Service home</p>} />
        <Route path="/board" element={<p>Board page</p>} />
        <Route path="/detail/:id" element={<p>Detail 123</p>} />
      </Routes>
    </BrowserRouter>
  );
}
```
