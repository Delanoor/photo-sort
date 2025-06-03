"use client";
import { animated, useSpring } from "@react-spring/web";
import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { cn } from "../lib/utils";

interface PhotoInfo {
	name: string;
	path: string;
	size: number;
}

interface Card {
	id: number;
	content: React.ReactNode;
	photo?: PhotoInfo;
}

interface CardStackProps {
	sourceDirectory?: string;
	targetDirectory?: string;
	cards?: Card[];
	onSave?: (card: Card) => void;
	onDiscard?: (card: Card) => void;
}

const CardStack: React.FC<CardStackProps> = ({
	sourceDirectory,
	targetDirectory,
	cards: externalCards,
	onSave,
	onDiscard,
}) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [photos, setPhotos] = useState<PhotoInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [cards, setCards] = useState<Card[]>(externalCards || []);
	const [copying, setCopying] = useState(false);
	const [isSelected, setIsSelected] = useState<number | null>(null);

	// Create spring animation for the top card
	const [{ x, rot, scale }, api] = useSpring(() => ({
		x: 0,
		rot: 0,
		scale: 1,
		config: { friction: 50, tension: 200 },
	}));

	// Load photos when sourceDirectory changes
	useEffect(() => {
		if (sourceDirectory) {
			loadPhotos();
		}
	}, [sourceDirectory]);

	// Update cards when external cards change
	useEffect(() => {
		if (externalCards) {
			setCards(externalCards);
		}
	}, [externalCards]);

	// Convert photos to cards when photos change
	useEffect(() => {
		if (photos.length > 0 && !externalCards) {
			const photoCards = photos.map((photo, index) => ({
				id: index,
				photo,
				content: <PhotoCard photo={photo} />,
			}));
			setCards(photoCards);
			setCurrentIndex(0);
		}
	}, [photos, externalCards]);

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

	const copyPhotoToTarget = useCallback(
		async (photo: PhotoInfo) => {
			if (!targetDirectory) {
				console.warn("No target directory specified");
				return false;
			}

			setCopying(true);
			try {
				await invoke("copy_file", {
					sourcePath: photo.path,
					targetDir: targetDirectory,
				});
				return true;
			} catch (err) {
				console.error("Failed to copy photo:", err);
				setError(`Failed to copy photo: ${err}`);
				return false;
			} finally {
				setCopying(false);
			}
		},
		[targetDirectory],
	);

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

	const handleSave = useCallback(
		async (card: Card) => {
			if (card.photo && targetDirectory) {
				const success = await copyPhotoToTarget(card.photo);
				if (success) {
					onSave?.(card);
				}
			} else {
				onSave?.(card);
			}
		},
		[targetDirectory, onSave, copyPhotoToTarget],
	);

	const handleDiscard = useCallback(
		(card: Card) => {
			onDiscard?.(card);
		},
		[onDiscard],
	);

	// Handle keyboard controls
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (copying || currentIndex >= cards.length) return;

			const currentCard = cards[currentIndex];
			if (!currentCard) return;

			// Check for right arrow or 'D' key (Save)
			if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
				event.preventDefault();
				// Fly the card out to the right
				api.start({
					x: window.innerWidth / 2,
					rot: 50,
					scale: 0.8,
					onChange: () => {
						setCurrentIndex((current) => current + 1);
					},
					onRest: async () => {
						await handleSave(currentCard);
						api.start({
							x: 0,
							rot: 0,
							scale: 1,
							immediate: true,
						});
					},
				});
			}
			// Check for left arrow or 'A' key (Discard)
			else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
				event.preventDefault();
				// Fly the card out to the left
				api.start({
					x: -window.innerWidth / 2 + 100,
					rot: -50,
					scale: 0.8,
					onChange: () => {
						setCurrentIndex((current) => current + 1);
					},
					onRest: () => {
						handleDiscard(currentCard);
						api.start({
							x: 0,
							rot: 0,
							scale: 1,
							immediate: true,
						});
					},
				});
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [api, currentIndex, cards, copying, handleSave, handleDiscard]);

	// Photo Card Component
	const PhotoCard: React.FC<{ photo: PhotoInfo }> = ({ photo }) => (
		<div className="w-full h-full flex flex-col">
			<div className="flex-1 bg-gray-100 rounded-lg overflow-hidden mb-3">
				<img
					src={convertFileSrc(photo.path)}
					alt={photo.name}
					className="w-full h-full object-cover"
					loading="lazy"
				/>
			</div>
			<div className="space-y-1 text-center">
				<p
					className="text-sm font-medium text-gray-800 truncate"
					title={photo.name}
				>
					{photo.name}
				</p>
				<p className="text-xs text-gray-600">{formatFileSize(photo.size)}</p>
			</div>
		</div>
	);

	const toggleSelected = (id: number) => {
		setIsSelected((prev) => (prev === id ? null : id));
	};

	// Loading state
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

	// Error state
	if (error) {
		return (
			<div className="p-4 bg-red-50 border border-red-200 rounded-md">
				<p className="text-red-700">{error}</p>
				<button
					type="button"
					onClick={() => {
						setError("");
						if (sourceDirectory) loadPhotos();
					}}
					className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
				>
					Retry
				</button>
			</div>
		);
	}

	// No photos found
	if (sourceDirectory && photos.length === 0 && !loading) {
		return (
			<div className="text-center p-8 bg-gray-50 rounded-lg">
				<p className="text-gray-600">
					No photos found in the selected directory.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 py-4 h-screen flex flex-col">
			{/* Controls info */}
			<div className="text-center text-sm text-gray-600 mb-4">
				<p>
					Use <kbd className="px-1 py-0.5 bg-gray-200 rounded">←</kbd> or{" "}
					<kbd className="px-1 py-0.5 bg-gray-200 rounded">A</kbd> to discard,{" "}
					<kbd className="px-1 py-0.5 bg-gray-200 rounded">→</kbd> or{" "}
					<kbd className="px-1 py-0.5 bg-gray-200 rounded">D</kbd> to save
					{targetDirectory && " & copy"}
				</p>
				<p className="mt-1">
					Photo {currentIndex + 1} of {cards.length}
				</p>
				{copying && <p className="mt-1 text-blue-600">Copying photo...</p>}
			</div>

			{/* Card Stack */}
			<div className="relative flex justify-center items-start w-full h-full">
				{cards.map((card, index) => {
					// Only render cards from current index and a few ahead
					if (index < currentIndex || index > currentIndex + 3) return null;

					// Calculate properties for stacked appearance
					const isTop = index === currentIndex;
					const stackLevel = index - currentIndex;
					const stackOffset = stackLevel * 8; // Increased offset for better visibility
					const scaleReduction = stackLevel * 0.03; // More visible scale reduction

					return (
						<animated.div
							key={card.id}
							style={{
								width: isSelected === card.id && isTop ? "90dvw" : "320px",
								height: isSelected === card.id && isTop ? "100%" : "420px",
								transition: "width 0.3s ease-in-out, height 0.3s ease-in-out",
								// Only apply animation to the top card
								...(isTop
									? {
											x,
											rotate: rot,
											scale,
										}
									: {
											// Static positioning for the rest of the stack
											transform: `translateY(${stackOffset}px) translateX(${stackLevel * 2}px) scale(${1 - scaleReduction})`,
										}),
								position: "absolute",
								transformOrigin: "center center",
								zIndex: cards.length - index,
								touchAction: "none",
								opacity: isTop ? 1 : Math.max(0.4, 1 - stackLevel * 0.25),
							}}
							onClick={() => toggleSelected(card.id)}
							className={cn(
								"w-[320px] max-w-screen-md h-[420px] bg-white rounded-2xl shadow-xl will-change-transform border-2 border-gray-100",
								{
									"border-blue-500": isSelected === card.id && isTop,
								},
							)}
						>
							<div
								className={cn(
									"w-full h-full flex items-center justify-center p-5",
									{ "h-full": isTop && isSelected === card.id },
								)}
							>
								{card.content}
							</div>
						</animated.div>
					);
				})}

				{currentIndex >= cards.length && (
					<div className="text-center">
						<div className="text-2xl text-gray-600 mb-4">
							🎉 All photos sorted!
						</div>
						<p className="text-gray-500">
							You've gone through all {cards.length} photos.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default CardStack;
