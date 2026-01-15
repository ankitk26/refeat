import { useConvexMutation } from "@convex-dev/react-query";
import { IconCalendar, IconLoader, IconTarget } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "convex/_generated/api";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export default function CreateTrackerButton() {
	const [trackerName, setTrackerName] = useState("");
	const [startDate, setStartDate] = useState<Date | undefined>(() => {
		// Default to today's date
		return new Date();
	});

	const currentYear = new Date().getFullYear();

	const createTrackerMutation = useMutation({
		mutationFn: useConvexMutation(api.trackers.create),
		onSuccess: () => {
			setTrackerName("");
			// Reset to today's date
			setStartDate(new Date());
		},
	});

	const createTrackerHandler = () => {
		if (!startDate) return;

		const currentTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		// Create a date at midnight in the user's local timezone
		const year = startDate.getFullYear();
		const month = startDate.getMonth();
		const day = startDate.getDate();
		const startDateLocal = new Date(year, month, day, 0, 0, 0, 0);

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
			<DialogTrigger
				render={
					<Button type="button">
						<IconTarget /> New goal
					</Button>
				}
			/>
			<DialogContent className="overflow-hidden">
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
						<div className="relative">
							<Popover>
								<PopoverTrigger
									render={
										<Button
											id="start-date"
											variant="outline"
											className="w-full justify-start text-left font-normal"
										>
											<IconCalendar className="mr-2 h-4 w-4" />
											{startDate ? (
												format(startDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
										</Button>
									}
								/>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={startDate}
										onSelect={setStartDate}
										captionLayout="dropdown"
										startMonth={new Date(currentYear - 1, 0)}
										endMonth={new Date(currentYear + 1, 0)}
										autoFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
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
						disabled={
							!trackerName.trim() ||
							!startDate ||
							createTrackerMutation.isPending
						}
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
