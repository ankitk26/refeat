import { IconCircleFilled } from "@tabler/icons-react";
import { Doc } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Props = {
	logs: Doc<"trackerLogs">[];
};

export default function LogStatusByDay({ logs }: Props) {
	return logs.map((log) => (
		<IconCircleFilled
			key={log._id}
			className={cn(
				"size-2.5",
				log.isAccomplished ? "text-emerald-500" : "text-red-500"
			)}
		/>
	));
}
