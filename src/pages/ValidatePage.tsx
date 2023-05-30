import { useEffect } from "react";
import "./../styles/authorizationPage.scss";
import { CredentialsManager } from "../helpers/CredentialsManager";

export function ValidatePage() {
  useEffect(() => {
    const urlSearchParameters = new URLSearchParams(window.location.search);
    const osuToken = urlSearchParameters.get("code");
    const credentials = new CredentialsManager();
    const key = credentials.getVerificationToken();

    if (osuToken)
      credentials.postVerification(key, osuToken).then(async (validation) => {
        if (validation.status == 200) {
          window.location.replace("/authorized");
        }
      });
  }, []);

  return (
    <div className="page_layout">
      <div className="loading_container">
        <div className="logo"></div>
        <p>{"Lütfen Bekleyiniz..."}</p>
      </div>
    </div>
  );
}
