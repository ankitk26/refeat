import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@refeat/ui/lib/utils";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-backdrop"
			className={cn(
				"fixed inset-0 z-50 bg-pine/50 backdrop-blur-[2px]",
				className,
			)}
			{...props}
		/>
	);
}

/**
 * Bottom sheet on mobile, centered modal on desktop.
 * Portal renders into document.body, so fixed positioning is always
 * viewport-relative even inside transformed ancestors (e.g. .reveal).
 */
function DialogContent({
	className,
	children,
	...props
}: DialogPrimitive.Popup.Props) {
	return (
		<DialogPrimitive.Portal data-slot="dialog-portal">
			<DialogBackdrop />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				className={cn(
					"fixed inset-x-0 bottom-0 z-50 flex w-full flex-col rounded-t-lg border-2 border-b-0 border-pine bg-card p-5",
					"md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border-b-2 md:shadow-[4px_4px_0_0_var(--pine)]",
					className,
				)}
				{...props}
			>
				{children}
			</DialogPrimitive.Popup>
		</DialogPrimitive.Portal>
	);
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn(
				"font-display text-3xl leading-none text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn(
				"font-pixel text-[10px] leading-relaxed text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

/** Pixel-styled ✕ close button for DialogContent headers. */
function DialogXButton({ className, ...props }: DialogPrimitive.Close.Props) {
	return (
		<DialogPrimitive.Close
			data-slot="dialog-x"
			className={cn(
				"grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border-2 border-pine bg-card font-pixel text-[10px] text-muted-foreground shadow-[2px_2px_0_0_var(--pine)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-border dark:bg-input/30 dark:shadow-[2px_2px_0_0_rgba(0,0,0,0.55)]",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogTrigger,
	DialogClose,
	DialogBackdrop,
	DialogContent,
	DialogTitle,
	DialogDescription,
	DialogXButton,
};
