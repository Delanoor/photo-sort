"use client";
import { animated, useSpring } from "@react-spring/web";
import { useEffect, useState } from "react";

interface Card {
	id: number;
	content: React.ReactNode;
}

interface CardStackProps {
	cards: Card[];
	onSave?: (card: Card) => void;
	onDiscard?: (card: Card) => void;
}

const CardStack: React.FC<CardStackProps> = ({ cards, onSave, onDiscard }) => {
	const [currentIndex, setCurrentIndex] = useState(0);

	// Create spring animation for the top card
	const [{ x, rot, scale }, api] = useSpring(() => ({
		x: 0,
		rot: 0,
		scale: 1,
		// config: { friction: 50, tension: 200 },
		config: { friction: 50, tension: 200 },
	}));

	// Handle keyboard controls
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const currentCard = cards[currentIndex];
			if (!currentCard) return;

			// Check for right arrow or 'D' key (Save)
			if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
				if (currentIndex < cards.length - 1) {
					// Fly the card out to the right

					api.start({
						x: window.innerWidth,
						rot: 30,
						scale: 0.8,
						onStart: () => {
							setCurrentIndex((current) => current + 1);
						},
						onRest: () => {
							onSave?.(currentCard);
							api.start({
								x: 0,
								rot: 0,
								scale: 1,
								immediate: true,
							});
						},
					});
				}
			}
			// Check for left arrow or 'A' key (Discard)
			else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
				if (currentIndex > 0) {
					// Fly the card out to the left
					api.start({
						x: -window.innerWidth,
						rot: -30,
						scale: 0.8,
						onStart: () => {
							setCurrentIndex((current) => current - 1);
						},
						onRest: () => {
							onDiscard?.(currentCard);
							api.start({
								x: 0,
								rot: 0,
								scale: 1,
								immediate: true,
							});
						},
					});
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [api, currentIndex, cards, onSave, onDiscard]);

	return (
		<div className="relative flex justify-center items-center">
			{cards.map((card, index) => {
				// Only render cards from current index
				if (index < currentIndex) return null;

				// Calculate properties for stacked appearance
				const isTop = index === currentIndex;
				const stackOffset = (index - currentIndex) * 4;

				return (
					<animated.div
						key={card.id}
						style={{
							// Only apply animation to the top card
							...(isTop
								? {
										x,
										rotate: rot,
										scale,
									}
								: {
										// Static positioning for the rest of the stack
										transform: `translateY(${stackOffset}px) scale(${1 - (index - currentIndex) * 0.05})`,
									}),
							position: "absolute",
							transformOrigin: "center center",
							zIndex: cards.length - index,
							touchAction: "none",
							opacity: isTop ? 1 : 1 - (index - currentIndex) * 0.2,
						}}
						className="w-[300px] h-[400px] bg-white rounded-2xl shadow-xl will-change-transform"
					>
						<div className="w-full h-full flex items-center justify-center p-5">
							{card.content}
						</div>
					</animated.div>
				);
			})}

			{currentIndex >= cards.length && (
				<div className="text-center text-2xl text-gray-600">
					No more photos to sort!
				</div>
			)}
		</div>
	);
};

export default CardStack;
