import contractsDeckJson from "@/data/flashcards/contracts.json";
import partnershipsDeckJson from "@/data/flashcards/partnerships.json";
import realPropertyDeckJson from "@/data/flashcards/real-property.json";
import tortsDeckJson from "@/data/flashcards/torts.json";
import type { FlashcardDeck } from "@/lib/types";

const contractsDeck = contractsDeckJson as FlashcardDeck;
const partnershipsDeck = partnershipsDeckJson as FlashcardDeck;
const realPropertyDeck = realPropertyDeckJson as FlashcardDeck;
const tortsDeck = tortsDeckJson as FlashcardDeck;

export const flashcardDecks: FlashcardDeck[] = [contractsDeck, partnershipsDeck, realPropertyDeck, tortsDeck];

export function getFlashcardDecks() {
  return flashcardDecks;
}
