import { useEffect } from "react";
import { RouterProvider } from "react-router";
import faviconHref from "@/app/public/icons/favicon-recyops.svg";
import { router } from "@/app/routes";

export default function App() {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = faviconHref;
    document.title = "RecyOPS";
  }, []);

  return <RouterProvider router={router} />;
}
