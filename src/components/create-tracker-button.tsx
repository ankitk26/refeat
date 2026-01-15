import { useConvexMutation } from "@convex-dev/react-query";
import { IconLoader } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { useState } from "react";
import { Button } from "./ui/button";
import {
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	Dialog,
	DialogTrigger,
	DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function CreateTrackerButton() {
	const [trackerName, setTrackerName] = useState("");
	const [startDate, setStartDate] = useState(() => {
		// Default to today's date in YYYY-MM-DD format
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, "0");
		const day = String(today.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	});

	const createTrackerMutation = useMutation({
		mutationFn: useConvexMutation(api.trackers.create),
		onSuccess: () => {
			setTrackerName("");
			// Reset to today's date
			const today = new Date();
			const year = today.getFullYear();
			const month = String(today.getMonth() + 1).padStart(2, "0");
			const day = String(today.getDate()).padStart(2, "0");
			setStartDate(`${year}-${month}-${day}`);
		},
	});

	const createTrackerHandler = () => {
		const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		// Parse the selected date string (YYYY-MM-DD format)
		// Date input gives us a string that represents a date in local timezone
		const [year, month, day] = startDate.split("-").map(Number);

		// Create a date at midnight in the user's local timezone
		// Note: month is 0-indexed in JavaScript Date constructor
		const startDateLocal = new Date(year, month - 1, day, 0, 0, 0, 0);

		// Convert to epoch time (this represents local midnight)
		const startTimeEpoch = startDateLocal.getTime();

		createTrackerMutation.mutate({
			name: trackerName,
			startTime: startTimeEpoch,
			clientSideTimezone: currentTimezone,
		});
	};

	return (
		<Dialog>
			<DialogTrigger render={<Button type="button">New goal</Button>} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new tracker</DialogTitle>
				</DialogHeader>
				<div className="space-y-6 py-2">
					<div className="space-y-2">
						<Label htmlFor="tracker-name">Goal name</Label>
						<Input
							id="tracker-name"
							placeholder="hit 10k steps"
							value={trackerName}
							onChange={(e) => setTrackerName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="start-date">
							When do you want to start tracking?
						</Label>
						<Input
							id="start-date"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<DialogClose
						render={
							<Button type="reset" variant="outline">
								Cancel
							</Button>
						}
					></DialogClose>
					<Button
						type="submit"
						onClick={createTrackerHandler}
						disabled={!trackerName.trim() || createTrackerMutation.isPending}
					>
						{createTrackerMutation.isPending ? (
							<IconLoader className="animate-spin" />
						) : (
							"Add"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
