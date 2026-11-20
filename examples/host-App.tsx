import { useRef } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { PortalHostSync } from "portal-route-sdk-demo";

const SERVICE_ORIGIN = "http://localhost:5174";

function ServiceA() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  return (
    <div>
      <h2>Portal / Service A</h2>
      <p>Address bar: /service-a, /service-a/board, /service-a/detail/123</p>
      <Link to="/">Portal home</Link>{" | "}
      <Link to="/service-a/board">Board (host link)</Link>
      <PortalHostSync iframeRef={iframeRef} serviceOrigin={SERVICE_ORIGIN} basePath="/service-a" />
      <iframe
        ref={iframeRef}
        title="Service A"
        src={SERVICE_ORIGIN + "/"}
        style={{ width: "100%", height: 440, border: "1px solid #aaa", marginTop: 16 }}
      />
    </div>
  );
}

function Home() {
  return <div><h1>Portal home</h1><Link to="/service-a">Open Service A</Link></div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/service-a/*" element={<ServiceA />} />
      </Routes>
    </BrowserRouter>
  );
}
