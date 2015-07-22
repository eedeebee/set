from enum import Enum
import random
import signal
import sys
from termcolor import colored


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
class Number(Enum):
    one = 1
    two = 2
    three = 3
class Fill(Enum):
    solid = 1
    linefilled = 2
    empty = 3
class Color(Enum):
    green = 1
    red = 2
    blue = 3
class Shape(Enum):
    squiggle = u'\u20DE' # square
    diamond = u'\u20DF' # diamond
    oval = u'\u25EF' #circle

class Card:
    def __init__(self, number, fill, color, shape):
        self.color = color
        self.number = number
        self.fill = fill
        self.shape = shape

    def __str__(self):
        # shape =  str(self.shape.value)
        shape =  self.shape.name
        return colored(" " .join([str(self.number.value), self.fill.name, shape]), self.color.name)

    def isSet(set):

        a = set[0]
        b = set[1]
        c = set[2]

        numberOK =  ((a.number == b.number == c.number) or (a.number != b.number and b.number != c.number and a.number != c.number))
        fillOK =  ((a.fill == b.fill == c.fill) or (a.fill != b.fill and b.fill != c.fill and a.fill != c.fill))
        colorOK =  ((a.color == b.color == c.color) or (a.color != b.color and b.color != c.color and a.color != c.color))
        shapeOK =  ((a.shape == b.shape == c.shape) or (a.shape != b.shape and b.shape != c.shape and a.shape != c.shape))

        return colorOK and fillOK and shapeOK and numberOK

class Board:

    def __init__(self):
        self.cards = []

    def placeCard(self, card):
        self.cards.append(card)
        return 

    def removeCard(self, index):
        self.cards.pop(index)
        return 

    def removeSet(self, s):
        if len(s) != 3:
            return False

        x = int(s[0]) - 1
        y = int(s[1]) - 1
        z = int(s[2]) - 1
        if Card.isSet([self.cards[x], self.cards[y], self.cards[z]]):
            for c in sorted([x, y, z], reverse=True):
                self.cards.pop(c)
            return True
        else:
            return False

    def hasSet(self):
        N = len(self.cards)

        for i in range(0, N - 2):
            for j in range(i + 1, N - 1):
                for k in range(j + 1, N):
                    set = self.cards[i], self.cards[j], self.cards[k]
                    if Card.isSet(set):
                        return set

        return False

class Player:

    def __init__(self):
        self.points = 0
        self.name = ''

    def addPoint(self):
        return 

    def losePoint(self):
        return 

class Game:

    def __init__(self):
        self.cards = []
        self.board = Board()
        self.players = []
        for n in Number:
            for c in Color:
                for f in Fill:
                    for s in Shape:
                        self.cards.append(Card(n, f, c, s))

        random.shuffle(self.cards)

    def start(self):
        for x in range(0,12):
            self.board.placeCard(self.cards.pop())

        while True:

            for index, c in enumerate(self.board.cards):
                end = " " if (index - 2) % 3 != 0 else "\n"
                print('({:2n}) {:<33}'.format(index+1, str(c)), end=end)

            # Multiplex on input from players
            # but for now, hard code to one player on term

            v = input("Find a set: ")
            if v.startswith('q'): 
                self.quit()
            elif v.startswith('h'): 
                s = self.board.hasSet()
                if s:
                    print("Hint: first card is: " + str(s[0]))
                else:
                    print("No set!")
            elif v.startswith('i'): 
                s = self.board.hasSet()
                if s:
                    print("Hint: second card is: " + str(s[1]))
                else:
                    print("No set!")
            elif v.startswith('n'): 
                if self.board.hasSet():
                    print("Wrong, there is a SET!")
                else:
                    print("No SET!")
                    self.board.placeCard(self.cards.pop())
                    self.board.placeCard(self.cards.pop())
                    self.board.placeCard(self.cards.pop())
            elif self.board.removeSet(v.split()):
                print("SET!")
                if (len(self.board.cards) < 12) :
                    self.board.placeCard(self.cards.pop())
                    self.board.placeCard(self.cards.pop())
                    self.board.placeCard(self.cards.pop())
            else:
                print(v + " is not a SET!")

        return 

    def quit(self):
        sys.exit()

    def end(self):
        return 

signal.signal(signal.SIGINT, lambda signal, frame: sys.exit(0))
game = Game()
game.players.append(Player())
game.start()
