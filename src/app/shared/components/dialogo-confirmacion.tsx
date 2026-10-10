import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";

interface DialogoConfirmacionProps {
  abierto: boolean;
  titulo: string;
  descripcion: ReactNode;
  textoConfirmar: string;
  textoProcesando?: string;
  /** Acción destructiva (eliminar, desactivar): botón en rojo. */
  destructivo?: boolean;
  /** Mientras la petición está en curso el diálogo no se puede cerrar. */
  procesando?: boolean;
  alConfirmar: () => void;
  alCancelar: () => void;
}

/**
 * Confirmación para acciones irreversibles o destructivas, sobre el
 * AlertDialog de shadcn (foco atrapado, Escape, foco de vuelta al disparador).
 * El botón de confirmar no cierra el diálogo por sí solo: quien lo usa lo
 * cierra cuando la petición termina, para poder mostrar el estado "procesando".
 */
export function DialogoConfirmacion({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  textoProcesando = "Procesando...",
  destructivo = false,
  procesando = false,
  alConfirmar,
  alCancelar,
}: DialogoConfirmacionProps) {
  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(abiertoAhora) => {
        if (!abiertoAhora && !procesando) alCancelar();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            variant={destructivo ? "destructive" : "default"}
            onClick={alConfirmar}
            disabled={procesando}
          >
            {procesando ? textoProcesando : textoConfirmar}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
