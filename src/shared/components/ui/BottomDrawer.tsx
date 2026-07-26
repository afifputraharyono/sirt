import * as DialogPrimitive from "@radix-ui/react-dialog";

interface BottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function BottomDrawer({ open, onOpenChange, title, children }: BottomDrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="drawer-overlay-animate fixed inset-0 z-50 bg-foreground/20 backdrop-blur-xs" />
        <DialogPrimitive.Content className="drawer-content-animate fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-[20px] bg-card shadow-[0_-8px_30px_-8px_oklch(0.15_0.01_150/0.2)]">
          <div className="flex flex-col items-center px-4 pt-3 pb-1">
            <div className="mb-3 h-1 w-10 rounded-full bg-muted-foreground/25" />
            <DialogPrimitive.Title className="w-full text-[16px] font-extrabold tracking-[-0.3px]">
              {title}
            </DialogPrimitive.Title>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 safe-area-pb">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
