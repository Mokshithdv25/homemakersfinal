import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildSignInRedirect, isHomeownerSignedIn } from "../lib/requireHomeownerAuth";

/**
 * Build / remodel wizards require sign-in so v0 and projects can persist.
 * The /build chooser stays public; this guard wraps /build/new-home and /build/remodel only.
 */
export default function HomeownerFlowGuard({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const signedIn = isHomeownerSignedIn();
  const returnPath = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!signedIn) {
      navigate(buildSignInRedirect(returnPath), { replace: true });
    }
  }, [signedIn, navigate, returnPath]);

  if (!signedIn) return null;
  return children;
}
