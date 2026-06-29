import contractsDeckJson from "@/data/flashcards/contracts.json";
import corporationsDeckJson from "@/data/flashcards/corporations.json";
import partnershipsDeckJson from "@/data/flashcards/partnerships.json";
import realPropertyDeckJson from "@/data/flashcards/real-property.json";
import tortsDeckJson from "@/data/flashcards/torts.json";
import type { FlashcardDeck } from "@/lib/types";

const contractsDeck = contractsDeckJson as FlashcardDeck;
const corporationsDeck = corporationsDeckJson as FlashcardDeck;
const partnershipsDeck = partnershipsDeckJson as FlashcardDeck;
const realPropertyDeck = realPropertyDeckJson as FlashcardDeck;
const tortsDeck = tortsDeckJson as FlashcardDeck;

export const flashcardDecks: FlashcardDeck[] = [
  contractsDeck,
  corporationsDeck,
  partnershipsDeck,
  realPropertyDeck,
  tortsDeck,
];

export function getFlashcardDecks() {
  return flashcardDecks;
}
