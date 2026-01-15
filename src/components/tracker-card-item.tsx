import { useConvexMutation } from "@convex-dev/react-query";
import { IconDots, IconEdit, IconLoader, IconTrash } from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { Doc } from "convex/_generated/dataModel";
import { useState } from "react";
import { epochToDate } from "@/lib/epoch-to-date";
import TrackerMonthStatus from "./tracker-month-status";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "./ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

type Props = {
	tracker: Doc<"trackers">;
};

export default function TrackerCardItem({ tracker }: Props) {
	const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [trackerName, setTrackerName] = useState(tracker.name);

	const deleteTrackerMutation = useMutation({
		mutationFn: useConvexMutation(api.trackers.deleteById),
	});
	const editTrackerMutation = useMutation({
		mutationFn: useConvexMutation(api.trackers.update),
		onSuccess: () => setIsEditDialogOpen(false),
	});
	const updateLogStatusMutation = useMutation({
		mutationFn: useConvexMutation(api.trackerLogs.updateStatus),
	});

	const updateLogStatus = (isAccomplished: boolean) => {
		updateLogStatusMutation.mutate({
			trackerId: tracker._id,
			isAccomplished: isAccomplished,
			userCurrentDate: {
				day: new Date().getDate(),
				month: new Date().getMonth() + 1,
				year: new Date().getFullYear(),
			},
		});
	};

	const deleteTracker = () => {
		deleteTrackerMutation.mutate({ trackerId: tracker._id });
	};

	const editTracker = () => {
		editTrackerMutation.mutate({
			trackerId: tracker._id,
			updatedName: trackerName,
		});
	};

	return (
		<>
			<Card key={tracker._id} className="col-span-1 w-full">
				<CardHeader>
					<Link to="/trackers/$trackerId" params={{ trackerId: tracker._id }}>
						<CardTitle>{tracker.name}</CardTitle>
					</Link>
					<CardDescription>
						Started on{" "}
						{epochToDate(tracker.startTime, tracker.clientSideTimezone)}
					</CardDescription>
					<CardAction>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button size="icon-xs" variant="ghost">
										<IconDots />
									</Button>
								}
							/>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
									<IconEdit />
									Edit
								</DropdownMenuItem>
								<DropdownMenuItem
									variant="destructive"
									onClick={() => setIsAlertDialogOpen(true)}
								>
									<IconTrash />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</CardAction>
				</CardHeader>
				<CardContent className="space-y-4">
					<TrackerMonthStatus trackerId={tracker._id} />
					<div className="flex gap-2 pt-4 border-t">
						<Button
							type="button"
							variant="default"
							size="sm"
							className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 hover:border-emerald-700"
							onClick={() => updateLogStatus(true)}
						>
							Completed
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => updateLogStatus(false)}
						>
							Didn't do it
						</Button>
					</div>
				</CardContent>
			</Card>
			<AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>Confirm action</AlertDialogHeader>
					<AlertDialogDescription>
						All your tracked logs will be deleted and cannot be recovered
					</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={deleteTracker}
							disabled={deleteTrackerMutation.isPending}
						>
							{deleteTrackerMutation.isPending ? (
								<IconLoader className="animate-spin" />
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent>
					<DialogHeader>Edit tracker</DialogHeader>
					<div>
						<Input
							placeholder="10k steps"
							value={trackerName}
							onChange={(e) => setTrackerName(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<DialogClose>Cancel</DialogClose>
						<Button type="button" onClick={editTracker}>
							Update
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
