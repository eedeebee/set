# Logic

1. Start a game
- Shuffle cards
- Deal initial board - spots 1 thru 12
- Player says set and touches 3 cards
	- If set, then give player a set then
		 - If cards, add 3 more cards from deck.
		 - If no more cards, end game.
	- Else, subtract a set from player
- Player says no sets.
	- If no sets, then
		- If cards, add 3 more cards from deck.
		- If no more cards, end game.
	- If there is a set, say no. 

# Objects

## Game

- Functions
	- start
	- quit
	- end
- Has
	- cards
	- board
	- players

## Card

- Shape
- Color
- Number
- Fill

## Board

- Functions
	- placeCard
	- removeCard
	- removeSet
	- hasSet
	- listCards 
- Has
    - Cards


## Player

- Function
	- loseSet
	
- Has
	- sets 
	- name