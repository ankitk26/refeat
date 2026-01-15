import { Doc } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Props = {
	logs: Doc<"trackerLogs">[];
};

export default function LogStatusByDay({ logs }: Props) {
	return logs.map((log) => (
		<svg
			key={log._id}
			width="12"
			height="12"
			viewBox="0 0 12 12"
			className="shrink-0"
			aria-label={
				log.isAccomplished
					? `Day ${log.userDay} - Accomplished`
					: `Day ${log.userDay} - Not accomplished`
			}
		>
			<circle
				cx="6"
				cy="6"
				r="5"
				className={cn(
					"transition-all duration-200",
					log.isAccomplished
						? "fill-primary stroke-primary/20 stroke-1"
						: "fill-muted-foreground/30 dark:fill-muted-foreground/20"
				)}
			/>
		</svg>
	));
}
