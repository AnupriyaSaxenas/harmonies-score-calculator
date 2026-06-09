# Harmonies Score Calculator Skill Context

## Purpose

This document provides all gameplay and scoring rules needed for an AI assistant (Claude Vision or similar multimodal model) to automatically calculate a final score for the board game **Harmonies** using:

1. An image of a player's personal board
2. Images of completed/incomplete animal cards
3. Optional Nature’s Spirit card image
4. Optional clarification from user regarding Side A or Side B board

The AI should:
- Detect all landscape elements
- Detect all placed animal cubes
- Determine completed and incomplete animal cards
- Apply all scoring rules exactly
- Produce a detailed scoring breakdown

---

# Core Concepts

## Token Colors

| Color | Landscape Type |
|---|---|
| Blue | Water |
| Yellow | Field |
| Green | Tree top |
| Brown | Tree trunk / Building base |
| Gray | Mountain |
| Red | Building top |

---

# Landscape Construction Rules

## Mountains

A mountain is made from stacked gray tokens.

| Height | Points |
|---|---|
| 1 | 1 |
| 2 | 3 |
| 3 | 7 |

IMPORTANT:
- A mountain scores **0** if it is NOT adjacent to another mountain.
- Adjacency is hex adjacency.

---

## Trees

A tree is:
- Green token on top
- Supported by 0, 1, or 2 brown tokens

| Height | Points |
|---|---|
| 1 | 1 |
| 2 | 4 |
| 3 | 7 |

Tree height includes the green token.

Examples:
- Green alone = height 1
- Brown + green = height 2
- Brown + brown + green = height 3

---

## Buildings

A building is:
- Red token on top
- Supported by brown, gray, or red token

A building scores:
- 5 points IF adjacent to at least 3 DIFFERENT token colors
- Otherwise 0 points

Important:
- Only top visible tokens count for adjacency color checks.
- Need 3 distinct colors among adjacent spaces.
- Empty spaces do not count.

---

## Fields

A field is a connected group of yellow tokens.

Scoring:
- Every isolated connected group containing 2 or more yellow tokens scores 5 points.
- A group of 4 yellows still only scores 5 points.
- Goal is multiple separate groups.

Examples:
- 2 connected yellows = 5
- 3 connected yellows = 5
- 7 connected yellows = 5
- Two separate groups of 2 = 10 total

Single isolated yellow token:
- Scores 0

---

# Water Scoring

## Side A — River Scoring

Blue tokens form rivers.

Only the BEST river scores.

River score:
- Count shortest path length between river endpoints.
- If river length <= 6:
  - Score equals river length
- If river length > 6:
  - First 6 tokens = 6 points
  - Each additional token = 4 points

Formula:
- score = 6 + (extra_tokens × 4)

Examples:
- Length 4 river = 4
- Length 6 river = 6
- Length 8 river = 14

Important:
- Ignore side branches not part of shortest endpoint path.

---

## Side B — Island Scoring

Blue tokens divide the board into islands.

Each isolated land region scores:
- 5 points

Important:
- Player always has at least 1 island
- Blue spaces separate islands
- Count connected non-blue regions

---

# Animal Card Scoring

Each animal card has:
- Multiple cube positions
- Point values decreasing downward

At end of game:
- Score equals highest visible number WITHOUT cube

Examples:
- All cubes present → 0 points
- 1 cube placed → reveal next value
- Fully completed card → maximum score

AI must:
1. Detect how many cubes remain on each card
2. Determine corresponding visible score

---

# Habitat Recognition Rules

Animal habitats:
- Can be rotated any direction
- Must match exact shape
- Mountains and trees must match exact height
- Buildings may use gray/brown/red as base beneath red token
- Animal cube placement is permanent even if landscape later changes

A single token may participate in multiple habitats.

---

# Board Recognition Requirements

The AI should identify:

## For Each Hex Cell
- Empty or occupied
- Top visible token color
- Stack height
- Full stack composition if visible

## Landscape Detection
Detect:
- Tree locations and heights
- Mountain locations and heights
- Buildings
- Yellow field groups
- Blue river/island structure

## Animal Cubes
Identify:
- Cube placements on board
- Corresponding animal cards if visible

---

# Image Interpretation Guidelines

## Perspective Correction
- Normalize board perspective when possible
- Hex adjacency must remain accurate

## Occlusion Handling
If uncertain:
- Mark region as uncertain
- Ask user clarification instead of hallucinating

## Token Stack Priority
Always interpret top visible token as active terrain type.

Examples:
- Gray topped by red = building
- Brown + green = tree
- Gray + gray + gray = mountain

---

# Recommended Workflow

## Step 1 — Detect Board Side
Determine:
- Side A (River scoring)
OR
- Side B (Island scoring)

If uncertain:
- Ask user

---

## Step 2 — Build Hex Map

Represent board as coordinate grid:

Example:
{
  "q": 0,
  "r": 0,
  "stack": ["brown", "green"],
  "top": "green",
  "height": 2
}

---

## Step 3 — Detect Landscapes

Calculate:
- Trees
- Mountains
- Buildings
- Fields
- Rivers/islands

---

## Step 4 — Read Animal Cards

For each card:
- Detect remaining cubes
- Determine visible score

---

## Step 5 — Read Nature’s Spirit Card

If present:
- Apply additional custom scoring

Nature’s Spirit scores are additive.

---

# Final Output Format

The assistant should produce:

## Landscape Scores

### Trees
- Height 1: X
- Height 2: Y
- Height 3: Z
- Total

### Mountains
...

### Fields
...

### Buildings
...

### Water
...

### Nature Spirit
...

## Animal Card Scores

| Animal | Score |
|---|---|
| Fox | 12 |
| Deer | 8 |

## Grand Total

Landscape Total: XX  
Animal Total: YY  
Nature Spirit Total: ZZ  

FINAL SCORE: NNN

---

# Ambiguity Handling

If any of the following cannot be reliably determined:
- Stack height
- Board side
- Cube ownership
- Adjacency
- Hidden token color

The assistant should:
1. Explain uncertainty
2. Ask targeted clarification questions
3. Avoid guessing

---

# Important Edge Cases

## Mountain Isolation
Single mountain with no adjacent mountain:
- Scores 0 regardless of height

## Field Size
Any connected yellow group:
- Maximum 5 points per group

## Buildings
Need 3 DIFFERENT adjacent colors.
Duplicates do not count.

## Rivers
Only ONE river scores:
- The best one

## Animal Cubes
Cube placements remain valid permanently even if habitat later breaks.

---

# Suggested Claude Prompt

Use this document as scoring rules context.

Then provide:
1. Personal board image
2. Animal card image(s)
3. Nature Spirit image if applicable

Task:
- Detect all terrain and token structures
- Compute scoring exactly according to Harmonies rules
- Provide detailed scoring breakdown
- Explain assumptions or uncertainties
- Never invent hidden information

Return:
1. Human-readable explanation
2. Structured JSON score breakdown

---

# Suggested JSON Output

```json
{
  "boardSide": "A",
  "landscapeScores": {
    "trees": 12,
    "mountains": 10,
    "fields": 15,
    "buildings": 5,
    "water": 14
  },
  "animalScores": [
    {
      "animal": "Fox",
      "score": 12
    }
  ],
  "natureSpiritScore": 10,
  "total": 78
}
```

---

# Source Notes

Rules derived from Harmonies official rulebook scoring sections.
