import civilProcedureDeckJson from "@/data/flashcards/civil-procedure.json";
import constitutionalLawDeckJson from "@/data/flashcards/constitutional-law.json";
import agencyDeckJson from "@/data/flashcards/agency.json";
import criminalLawDeckJson from "@/data/flashcards/criminal-law.json";
import criminalProcedureDeckJson from "@/data/flashcards/criminal-procedure.json";
import contractsDeckJson from "@/data/flashcards/contracts.json";
import corporationsDeckJson from "@/data/flashcards/corporations.json";
import evidenceDeckJson from "@/data/flashcards/evidence.json";
import partnershipsDeckJson from "@/data/flashcards/partnerships.json";
import realPropertyDeckJson from "@/data/flashcards/real-property.json";
import tortsDeckJson from "@/data/flashcards/torts.json";
import type { FlashcardDeck } from "@/lib/types";

const civilProcedureDeck = civilProcedureDeckJson as FlashcardDeck;
const constitutionalLawDeck = constitutionalLawDeckJson as FlashcardDeck;
const agencyDeck = agencyDeckJson as FlashcardDeck;
const criminalLawDeck = criminalLawDeckJson as FlashcardDeck;
const criminalProcedureDeck = criminalProcedureDeckJson as FlashcardDeck;
const contractsDeck = contractsDeckJson as FlashcardDeck;
const corporationsDeck = corporationsDeckJson as FlashcardDeck;
const evidenceDeck = evidenceDeckJson as FlashcardDeck;
const partnershipsDeck = partnershipsDeckJson as FlashcardDeck;
const realPropertyDeck = realPropertyDeckJson as FlashcardDeck;
const tortsDeck = tortsDeckJson as FlashcardDeck;

export const flashcardDecks: FlashcardDeck[] = [
  agencyDeck,
  civilProcedureDeck,
  constitutionalLawDeck,
  criminalLawDeck,
  criminalProcedureDeck,
  contractsDeck,
  corporationsDeck,
  evidenceDeck,
  partnershipsDeck,
  realPropertyDeck,
  tortsDeck,
];

export function getFlashcardDecks() {
  return flashcardDecks;
}
