import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { PortalDataProvider } from "./data/PortalData";
import { I18nProvider } from "./i18n";
import { CheckoutPage } from "./pages/CheckoutPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PayPage } from "./pages/PayPage";
import { VoucherPage } from "./pages/VoucherPage";

export default function App() {
  return (
    <I18nProvider>
      <PortalDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<HomePage />} />
              <Route path="voucher" element={<VoucherPage />} />
              <Route path="buy/:packageId" element={<CheckoutPage />} />
              <Route path="pay/:reference" element={<PayPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PortalDataProvider>
    </I18nProvider>
  );
}
