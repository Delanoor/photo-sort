import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

interface PhotoInfo {
	name: string;
	path: string;
	size: number;
}

interface PhotoDisplayProps {
	sourceDirectory: string;
	onPhotoSelect?: (photo: PhotoInfo) => void;
}

export default function PhotoDisplay({
	sourceDirectory,
	onPhotoSelect,
}: PhotoDisplayProps) {
	const [photos, setPhotos] = useState<PhotoInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [selectedPhoto, setSelectedPhoto] = useState<PhotoInfo | null>(null);

	useEffect(() => {
		if (sourceDirectory) {
			loadPhotos();
		}
	}, [sourceDirectory]);

	const loadPhotos = async () => {
		setLoading(true);
		setError("");
		try {
			const photoList = await invoke<PhotoInfo[]>(
				"load_photos_from_directory",
				{
					directoryPath: sourceDirectory,
				},
			);
			setPhotos(photoList);
		} catch (err) {
			setError(`Failed to load photos: ${err}`);
		} finally {
			setLoading(false);
		}
	};

	const handlePhotoClick = (photo: PhotoInfo) => {
		setSelectedPhoto(photo);
		onPhotoSelect?.(photo);
	};

	const formatFileSize = (bytes: number) => {
		const units = ["B", "KB", "MB", "GB"];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(1)} ${units[unitIndex]}`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
					<p className="text-gray-600">Loading photos...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 bg-red-50 border border-red-200 rounded-md">
				<p className="text-red-700">{error}</p>
				<button
					type="button"
					onClick={loadPhotos}
					className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
				>
					Retry
				</button>
			</div>
		);
	}

	if (photos.length === 0) {
		return (
			<div className="text-center p-8 bg-gray-50 rounded-lg">
				<p className="text-gray-600">
					No photos found in the selected directory.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-800">
					Photos Found: {photos.length}
				</h3>
				<button
					type="button"
					onClick={loadPhotos}
					className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
				>
					Refresh
				</button>
			</div>

			{/* Photo Grid */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
				{photos.map((photo) => (
					<button
						key={photo.path}
						type="button"
						className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
							selectedPhoto?.path === photo.path
								? "border-blue-500 ring-2 ring-blue-200"
								: "border-gray-200 hover:border-gray-300"
						}`}
						onClick={() => handlePhotoClick(photo)}
						aria-label={`Select photo ${photo.name}`}
					>
						<div className="aspect-square bg-gray-100 flex items-center justify-center">
							<img
								src={convertFileSrc(photo.path)}
								// src={photo.path}
								alt={photo.name}
								className="w-full h-full object-cover"
								loading="lazy"
							/>
						</div>

						{/* Overlay with photo info */}
						<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform">
							<p className="text-xs truncate" title={photo.name}>
								{photo.name}
							</p>
							<p className="text-xs text-gray-300">
								{formatFileSize(photo.size)}
							</p>
						</div>

						{/* Selection indicator */}
						{selectedPhoto?.path === photo.path && (
							<div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
								✓
							</div>
						)}
					</button>
				))}
			</div>

			{/* Selected Photo Details */}
			{selectedPhoto && (
				<div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
					<h4 className="font-medium text-blue-800 mb-2">Selected Photo:</h4>
					<p className="text-sm text-blue-700">
						<strong>Name:</strong> {selectedPhoto.name}
					</p>
					<p className="text-sm text-blue-700">
						<strong>Size:</strong> {formatFileSize(selectedPhoto.size)}
					</p>
					<p className="text-sm text-blue-700 break-all">
						<strong>Path:</strong> {selectedPhoto.path}
					</p>
				</div>
			)}
		</div>
	);
}
