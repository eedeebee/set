
"""
    Game of Set
    4 dimensions, 3 values each = 3^4 = 81 cards
    Shape
        squiggle, diamond, oval
    Color
        red, green, purple
    Count
        1, 2, 3
    Fill
        empty, lines, solid

    Deck = 81 unique cards, then random shuffle
    Choose 12 cards from top
    Find a set, 
        If set, remove those 3 cards, add 3 more.
        If no set, add 3 more cards.
            If Find a set, remove three cards.
            If no set, add 3 more cards.
            Find a set and remove 3 cards.

    Brute force algorithm to find a set
    N = current # of cards laid down

    N = 12
    for i = 1 to N
        card[i] = next_card()

    for i = cur to N - 2
        for j = i + 1 to N - 1
            for k = j + 1 to N
                if card[i], card[j], card[k] == set

if ((all_same(cards, color) || all_different(cards, color)) &&
    (all_same(cards, shape) || all_different(cards, shape)) &&
    (all_same(cards, count) || all_different(cards, count)) &&
    (all_same(cards, fill) || all_different(cards, fill))):



"""

