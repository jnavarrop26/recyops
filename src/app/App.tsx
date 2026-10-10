import { useEffect } from "react";
import { RouterProvider } from "react-router";
import faviconHref from "@/app/public/icons/favicon-recyops.svg";
import { router } from "@/app/routes";
import { Toaster } from "@/app/components/ui/sonner";

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

  // La app no tiene modo oscuro (no hay ThemeProvider de next-themes): el
  // wrapper de sonner cae al contexto por defecto, así que se fija "light".
  return (
    <>
      <RouterProvider router={router} />
      <Toaster theme="light" position="top-right" richColors closeButton />
    </>
  );
}
