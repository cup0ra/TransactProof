"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClient } from "../lib/api-client";

export interface PdfBranding {
  companyName: string;
  website: string;
  logoDataUrl?: string; // base64 image string
  showErc20Transfers?: boolean; // preference for showing ERC20 transfer logs
}

// Local storage persistence removed per request; rely only on server + in-memory state

export function usePdfBranding() {
  const [branding, setBranding] = useState<PdfBranding>({ companyName: "", website: "", showErc20Transfers: false });
  const [loaded, setLoaded] = useState(false); // true after initial server fetch attempt completes
  const [savedSnapshot, setSavedSnapshot] = useState<PdfBranding | null>(null);

  // Initial server fetch only (no localStorage, no auto-sync)
  useEffect(() => {
    (async () => {
      try {
        const res = await ApiClient.get('/api/receipts/my/branding');
        const json = await res.json();
        if (json?.branding) {
          const srv = json.branding as Partial<PdfBranding>;
          if (srv.companyName || srv.website || srv.logoDataUrl) {
            setBranding({
              companyName: srv.companyName || "",
              website: srv.website || "",
              logoDataUrl: srv.logoDataUrl || '',
              showErc20Transfers: (srv as any).showErc20Transfers === true,
            });
          }
            setSavedSnapshot({
              companyName: srv.companyName || "",
              website: srv.website || "",
              logoDataUrl: srv.logoDataUrl || '',
              showErc20Transfers: (srv as any).showErc20Transfers === true,
            });
        }
      } catch {/* ignore unauthenticated or network errors */}
      finally { setLoaded(true); }
    })();
  }, []);

  const update = useCallback((partial: Partial<PdfBranding>) => {
    setBranding(prev => {
      const merged = { ...prev, ...partial };
      return merged;
    });
  }, []);

  const reset = useCallback(() => {
    (async () => {
      if (savedSnapshot?.companyName || savedSnapshot?.website || savedSnapshot?.logoDataUrl) {
        setBranding(savedSnapshot);
        return;
      }
      try {
        const res = await fetch('/logo1.png');
        if (res.ok) {
          const blob = await res.blob();
          const dataUrl: string = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error || new Error('FileReader error'));
            reader.readAsDataURL(blob);
          });
          setBranding({ companyName: 'TRANSACTPROOF', website: '', logoDataUrl: dataUrl });
          return;
        }
      } catch {/* ignore */}
      setBranding({ companyName: 'TRANSACTPROOF', website: '', logoDataUrl: '', showErc20Transfers: false });
    })();
  }, [savedSnapshot]);

  // Determine dirty state by comparing to saved snapshot (or non-empty form if no snapshot yet)
  const dirty = useMemo(() => {
    if (!savedSnapshot) {
      return !!(branding.companyName || branding.website || branding.logoDataUrl);
    }
    return JSON.stringify(branding) !== JSON.stringify(savedSnapshot);
  }, [branding, savedSnapshot]);

  // Mark current branding as saved (caller should invoke after successful manual save POST)
  const markSaved = useCallback(() => {
    setSavedSnapshot(branding);
  }, [branding]);

  return { branding, loaded, update, reset, dirty, markSaved };
}
