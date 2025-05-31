import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import DirectorySelector from "./_components/directory-selector";
import PhotoDisplay from "./_components/photo-display";

interface PhotoInfo {
	name: string;
	path: string;
	size: number;
}

function App() {
	const [sourceDirectory, setSourceDirectory] = useState<string>("");
	const [destinationDirectory, setDestinationDirectory] = useState<string>("");
	const [selectedPhoto, setSelectedPhoto] = useState<PhotoInfo | null>(null);

	const handleSourceDirectorySelected = (path: string) => {
		setSourceDirectory(path);
	};

	const handleDestinationDirectorySelected = (path: string) => {
		setDestinationDirectory(path);
	};

	const handlePhotoSelect = (photo: PhotoInfo) => {
		setSelectedPhoto(photo);
	};

	return (
		<main className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-6xl mx-auto space-y-6">
				<header className="text-center">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">
						Photo Sorter
					</h1>
					<p className="text-gray-600">
						Select directories and organize your photos
					</p>
				</header>

				{/* Directory Selection */}
				<DirectorySelector
					onSourceDirectorySelected={handleSourceDirectorySelected}
					onDestinationDirectorySelected={handleDestinationDirectorySelected}
					sourceDirectory={sourceDirectory}
					destinationDirectory={destinationDirectory}
				/>

				{/* Photo Display */}
				{sourceDirectory && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<PhotoDisplay
							sourceDirectory={sourceDirectory}
							onPhotoSelect={handlePhotoSelect}
						/>
					</div>
				)}

				{/* Photo Sorting Actions - Coming Soon */}
				{selectedPhoto && destinationDirectory && (
					<div className="bg-white rounded-lg shadow-lg p-6">
						<h3 className="text-lg font-semibold text-gray-800 mb-4">
							Photo Actions
						</h3>
						<div className="flex space-x-4">
							<button
								type="button"
								className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
							>
								Keep (Sort to Destination)
							</button>
							<button
								type="button"
								className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
							>
								Delete
							</button>
							<button
								type="button"
								className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
							>
								Skip
							</button>
						</div>
						<p className="text-sm text-gray-600 mt-2">
							Actions for: {selectedPhoto.name}
						</p>
					</div>
				)}
			</div>
		</main>
	);
}

export default App;
