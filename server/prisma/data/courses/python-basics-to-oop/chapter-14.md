> **In simple words:**  A tuple is an **ordered collection that cannot be changed** after it is created, written inside  round brackets.

That immutability is the whole point: it protects data that must stay fixed, such as coordinates, configuration values or database credentials. Tuples are also slightly faster and use less memory than lists, and because they are hashable they can be used as dictionary keys and set members — something a list can never do.

## What Is a Tuple?

A tuple is an **ordered, immutable** collection written with round brackets. Once created it cannot be changed — and that is the point. Use a tuple when the data must never be modified by accident.

```python
point   = (10, 20)
rgb     = (255, 128, 0)
single  = (5,)            # NOTE the comma -- (5) is just the integer 5
empty   = ()
no_brackets = 1, 2, 3     # brackets are optional; this IS a tuple

# point[0] = 99           # TypeError -- tuples are immutable
```

## Tuple Operations

```python
t = (10, 20, 30, 20)

print(t[1])          # 20
print(t[::-1])       # (20, 30, 20, 10)
print(len(t))        # 4
print(t.count(20))   # 2
print(t.index(30))   # 2
print(20 in t)       # True

# Unpacking
x, y, z, w = t
a, *rest = t         # a = 10,  rest = [20, 30, 20]
```

## Why Tuples Exist — Three Real Reasons

- **Safety** — a database connection config or a coordinate should not be changed accidentally.
- **Speed** — tuples are slightly faster and use less memory than lists.
- **Hashable** — a tuple can be a dictionary key or a set member; a list cannot.

```python
# A list CANNOT be a dict key
# locations = {[17.38, 78.48]: "Hyderabad"}   # TypeError: unhashable type

# A tuple CAN
locations = {(17.38, 78.48): "Hyderabad",
             (12.97, 77.59): "Bengaluru"}
print(locations[(17.38, 78.48)])       # Hyderabad
```

## Tuples as Multiple Return Values

```python
def get_min_max_avg(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)
```

```python
lowest, highest, average = get_min_max_avg([85, 92, 78, 95, 88])
print(lowest, highest, round(average, 2))
```

**Output:**

```text
78 95 87.6
```

#### Real-Time Example — GPS Coordinates in a Delivery App

**Program: delivery_route.py**

```python
# Warehouse location NEVER changes -> tuple
WAREHOUSE = (17.3850, 78.4867)

# Delivery stops for today -> list of tuples
stops = [
    ("ORD1001", (17.4239, 78.4738), "Banjara Hills"),
    ("ORD1002", (17.4401, 78.3489), "Gachibowli"),
    ("ORD1003", (17.3616, 78.4747), "Charminar"),
]

for order_id, (lat, lon), area in stops:      # nested unpacking
    print(f"{order_id}: {area:<15} lat={lat}, lon={lon}")
```

**Output:**

```text
ORD1001: Banjara Hills   lat=17.4239, lon=78.4738
ORD1002: Gachibowli      lat=17.4401, lon=78.3489
ORD1003: Charminar       lat=17.3616, lon=78.4747
```

The coordinate pair is a tuple because a location is a single fixed fact. The list of stops is a list because stops get added and removed all day.

## More Practice — Simple Tuple Programs

### 1. Store a fixed set of days

```python
DAYS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")

print("Total days:", len(DAYS))
print("Weekend   :", DAYS[-2:])
print("Is 'Wed' a day?", "Wed" in DAYS)
```

**Output:**

```text
Total days: 7
Weekend   : ('Sat', 'Sun')
Is 'Wed' a day? True
```

### 2. A function returning several values

```python
def circle_info(radius):
    area = 3.14159 * radius ** 2
    circumference = 2 * 3.14159 * radius
    return radius, round(area, 2), round(circumference, 2)

r, area, circ = circle_info(5)
print(f"Radius {r} -> area {area}, circumference {circ}")
```

**Output:**

```text
Radius 5 -> area 78.54, circumference 31.42
```

### 3. Menu card as a tuple of tuples

```python
MENU = (
    ("Idli",   40, "Veg"),
    ("Dosa",   70, "Veg"),
    ("Biryani", 180, "Non-Veg"),
```

```python
)

print(f"{'ITEM':<10}{'PRICE':>7}  TYPE")
for item, price, kind in MENU:
    print(f"{item:<10}{price:>7}  {kind}")

veg_only = [item for item, price, kind in MENU if kind == "Veg"]
print("Veg items:", veg_only)
```

**Output:**

```text
ITEM        PRICE  TYPE
Idli           40  Veg
Dosa           70  Veg
Biryani       180  Non-Veg
Veg items: ['Idli', 'Dosa']
```

### 4. Unpacking with * (star)

```python
scores = (78, 85, 92, 67, 90)

first, *middle, last = scores
print("First :", first)      # 78
print("Middle:", middle)     # [85, 92, 67]
print("Last  :", last)       # 90
```

### 5. Swap and multiple assignment

```python
x, y = 5, 9
x, y = y, x                  # a tuple is created and unpacked behind the scenes
print(x, y)                  # 9 5

name, age, city = ("Ravi", 25, "Hyderabad")
print(f"{name} ({age}) from {city}")
```

### 6. Counting with a tuple key

```python
attendance = {}
records = [("Ravi", "Mon"), ("Anu", "Mon"), ("Ravi", "Tue"), ("Ravi", "Mon")]

for entry in records:
    attendance[entry] = attendance.get(entry, 0) + 1

for (name, day), count in attendance.items():
    print(f"{name} on {day}: {count} time(s)")
```

**Output:**

```text
Ravi on Mon: 2 time(s)
Anu on Mon: 1 time(s)
Ravi on Tue: 1 time(s)
```
