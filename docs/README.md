# Harmonies Score Calculator — Reference Docs

## Files

### `scoring-rules.md`
Structured text breakdown of all scoring rules used as the AI prompt context. This is the source of truth for `src/prompt.js` — if rules need updating, edit here first then sync to the prompt.

### `rules-images/`
Official rulebook screenshots for reference when updating scoring logic.

| File | Content |
|---|---|
| `01-tallying-points.png` | Trees, Mountains, Fields, Buildings, Water (Side A & B) scoring — the core scoring reference |
| `02-animal-cube-placement-end-of-game.png` | Animal cube placement rules, habitat requirements, end of game conditions |
| `03-game-turn-animal-cards.png` | Game turn structure, how to take/place tokens, Animal card description |
| `04-setup-goal.png` | Game goal, contents list, board setup steps |
| `05-player-aid.png` | Quick reference card — all actions and placement rules summarised |
| `06-natures-spirit-solo-mode.png` | Nature's Spirit card rules, solo mode rules and scoring thresholds |

## Updating the AI Prompt

The scoring rules are embedded in `src/prompt.js`. When making changes:
1. Consult the images and `scoring-rules.md` for the exact rule wording
2. Edit `src/prompt.js` directly
3. The `---SCORE BREAKDOWN---` block format at the end of the prompt must stay intact — `src/components/Results.jsx` parses it to extract individual scores
