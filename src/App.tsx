import { useState } from "react";
import "./App.css";
import DirectorySelector from "./_components/directory-selector";
import CardStack from "./_components/card-stack";

function App() {
	const [sourceDirectory, setSourceDirectory] = useState<string>("");
	const [destinationDirectory, setDestinationDirectory] = useState<string>("");

	const handleSourceDirectorySelected = (path: string) => {
		setSourceDirectory(path);
	};

	const handleDestinationDirectorySelected = (path: string) => {
		setDestinationDirectory(path);
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

				{/* Card Stack */}
				{sourceDirectory && destinationDirectory && (
					<div className="bg-white rounded-lg shadow-lg p-6 h-full">
						<CardStack
							sourceDirectory={sourceDirectory}
							targetDirectory={destinationDirectory}
						/>
					</div>
				)}
			</div>
		</main>
	);
}

export default App;
