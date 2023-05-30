import { useEffect, useState } from "react";
import "./../styles/authorizationPage.scss";
import { CredentialsManager } from "../helpers/CredentialsManager";
import { ApiResponse } from "../../server/types/generics";

export function AuthorizationPage() {
  const [hasValidKey, setHasValidKey] = useState<boolean | null>(null);

  useEffect(() => {
    const urlSearchParameters = new URLSearchParams(window.location.search);
    const verificationKey = urlSearchParameters.get("key");
    const credentials = new CredentialsManager();

    if (verificationKey) {
      setHasValidKey(true);
      credentials.storeVerificationKey(verificationKey);
      credentials.fetchOsuOauthURL().then((url: ApiResponse<string>) => {
        window.location.href = url.data;
      });
    } else {
      setHasValidKey(false);
    }
  }, []);

  const getStatusText = () => {
    if (hasValidKey === null) return "Lütfen Bekleyiniz...";
    if (hasValidKey === false) return "Yanlış Doğrulama Anahtarı";

    return "Lütfen Bekleyiniz...";
  };

  return (
    <div className="page_layout">
      <div className="loading_container">
        <div className="logo"></div>
        <p>{getStatusText()}</p>
      </div>
    </div>
  );
}
