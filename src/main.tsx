import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthorizationPage } from "./pages/AuthorizationPage";
import "./styles/index.scss";
import { AuthorizedPage } from "./pages/AuthorizedPage";
import { ValidatePage } from "./pages/ValidatePage";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route path="/authorize" element={<AuthorizationPage />}></Route>
      <Route path="/validate" element={<ValidatePage />}></Route>
      <Route path="/authorized" element={<AuthorizedPage />}></Route>
    </Routes>
  </BrowserRouter>
);
