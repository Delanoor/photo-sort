import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";

interface DirectorySelectorProps {
	onSourceDirectorySelected: (path: string) => void;
	onDestinationDirectorySelected: (path: string) => void;
	sourceDirectory?: string;
	destinationDirectory?: string;
}

export default function DirectorySelector({
	onSourceDirectorySelected,
	onDestinationDirectorySelected,
	sourceDirectory,
	destinationDirectory,
}: DirectorySelectorProps) {
	const [isSelectingSource, setIsSelectingSource] = useState(false);
	const [isSelectingDestination, setIsSelectingDestination] = useState(false);

	const selectSourceDirectory = async () => {
		setIsSelectingSource(true);
		try {
			const result = await open({
				directory: true,
				multiple: false,
			});
			if (result) {
				onSourceDirectorySelected(result as string);
			}
		} catch (error) {
			console.error("Failed to select source directory:", error);
		} finally {
			setIsSelectingSource(false);
		}
	};

	const selectDestinationDirectory = async () => {
		setIsSelectingDestination(true);
		try {
			const result = await open({
				directory: true,
				multiple: false,
			});
			if (result) {
				onDestinationDirectorySelected(result as string);
			}
		} catch (error) {
			console.error("Failed to select destination directory:", error);
		} finally {
			setIsSelectingDestination(false);
		}
	};

	return (
		<div className="space-y-6 p-6 bg-white rounded-lg shadow-lg">
			<h2 className="text-2xl font-bold text-gray-800 mb-4">
				Directory Selection
			</h2>

			{/* Source Directory Selection */}
			<div className="space-y-2">
				<div className="block text-sm font-medium text-gray-700">
					Source Directory (Photos to sort)
				</div>
				<div className="flex items-center space-x-3">
					<button
						type="button"
						onClick={selectSourceDirectory}
						disabled={isSelectingSource}
						className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						aria-label="Select source directory for photos to sort"
					>
						{isSelectingSource ? "Selecting..." : "Select Source Folder"}
					</button>
					{sourceDirectory && (
						<span className="text-sm text-gray-600 truncate max-w-md">
							📁 {sourceDirectory}
						</span>
					)}
				</div>
			</div>

			{/* Destination Directory Selection */}
			<div className="space-y-2">
				<div className="block text-sm font-medium text-gray-700">
					Destination Directory (Where to save sorted photos)
				</div>
				<div className="flex items-center space-x-3">
					<button
						type="button"
						onClick={selectDestinationDirectory}
						disabled={isSelectingDestination}
						className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						aria-label="Select destination directory where sorted photos will be saved"
					>
						{isSelectingDestination
							? "Selecting..."
							: "Select Destination Folder"}
					</button>
					{destinationDirectory && (
						<span className="text-sm text-gray-600 truncate max-w-md">
							📁 {destinationDirectory}
						</span>
					)}
				</div>
			</div>

			{/* Status */}
			{sourceDirectory && destinationDirectory && (
				<div className="p-3 bg-green-50 border border-green-200 rounded-md">
					<p className="text-green-700 text-sm">
						✅ Both directories selected! Ready to load photos.
					</p>
				</div>
			)}
		</div>
	);
}
