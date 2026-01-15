import { Doc } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Props = {
	logs: Doc<"trackerLogs">[];
};

export default function LogStatusByDay({ logs }: Props) {
	return logs.map((log) => (
		<svg
			key={log._id}
			width="14"
			height="14"
			viewBox="0 0 14 14"
			className="shrink-0"
			aria-label={
				log.isAccomplished
					? `Day ${log.userDay} - Accomplished`
					: `Day ${log.userDay} - Not accomplished`
			}
		>
			<circle
				cx="7"
				cy="7"
				r="5"
				className={cn(
					"transition-all duration-200",
					log.isAccomplished
						? "fill-primary stroke-primary/20"
						: "fill-muted-foreground/30 dark:fill-muted-foreground/20 stroke-border/50"
				)}
				strokeWidth="2"
			/>
		</svg>
	));
}
