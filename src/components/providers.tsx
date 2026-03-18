"use client";

import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        refreshInterval: 0,
        fetcher: (resource, init) => {
          return fetch(resource).then((res) => res.json());
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
