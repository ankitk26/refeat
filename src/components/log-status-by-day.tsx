import { Doc } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Props = {
	logs: Doc<"trackerLogs">[];
};

export default function LogStatusByDay({ logs }: Props) {
	return logs.map((log) => (
		<div
			key={log._id}
			className={cn(
				"size-2.5 rounded-full transition-all duration-200",
				log.isAccomplished
					? "bg-primary ring-1 ring-primary/20"
					: "bg-muted-foreground/30 dark:bg-muted-foreground/20 ring-1 ring-border/50"
			)}
			title={
				log.isAccomplished
					? `Day ${log.userDay} - Accomplished`
					: `Day ${log.userDay} - Not accomplished`
			}
		/>
	));
}
