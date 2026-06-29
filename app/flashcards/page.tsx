import { FlashcardsClient } from "@/components/FlashcardsClient";
import { getFlashcardDecks } from "@/lib/flashcards";

export default function FlashcardsPage() {
  return <FlashcardsClient decks={getFlashcardDecks()} />;
}
