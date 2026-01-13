import { useConvexMutation } from "@convex-dev/react-query";
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
} from "./ui/dialog";
import { Input } from "./ui/input";

export default function CreateTrackerButton() {
	const [trackerName, setTrackerName] = useState("");

	const createTrackerMutation = useMutation({
		mutationFn: useConvexMutation(api.trackers.create),
	});

	const createTrackerHandler = () => {
		// This represents where the user is RIGHT NOW, allowing them to create logs from anywhere
		const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		createTrackerMutation.mutate({
			name: trackerName,
			startTime: new Date().getTime(), // Store exact epoch time (no timezone conversion)
			clientSideTimezone: currentTimezone, // Use current location's timezone for date calculations
		});
	};

	return (
		<Dialog>
			<DialogTrigger render={<Button type="button">New goal</Button>} />
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new tracker</DialogTitle>
				</DialogHeader>
				<Input
					placeholder="hit 10k steps"
					value={trackerName}
					onChange={(e) => setTrackerName(e.target.value)}
				/>
				<DialogFooter>
					<Button type="reset" variant="outline">
						Cancel
					</Button>
					<Button type="submit" onClick={createTrackerHandler}>
						Add
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
