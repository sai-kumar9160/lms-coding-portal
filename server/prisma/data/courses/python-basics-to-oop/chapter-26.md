> **In simple words:**  These are ready-made toolkits installed with `pip` that give Python abilities it does not have  out of the box.

**NumPy** adds fast numeric arrays and lets you do maths on thousands of numbers without writing a loop. **Pandas** adds the DataFrame, a table you can filter, group and summarise like a spreadsheet or a SQL query. **Matplotlib** turns the results into charts. Together they are the standard toolkit for data analysis, reporting and machine learning.

## Why External Libraries?

Python's standard library is large, but the real power comes from **third-party packages** installed with `pip`. Three of them appear in almost every data-related job: **NumPy** for fast numeric arrays, **Pandas** for table- shaped data, and **Matplotlib** for charts. Everything you learned so far — lists, dictionaries, loops, functions, classes — is what these libraries are built on and what you use to drive them.

**Install once, in the terminal**

```python
pip install numpy pandas matplotlib openpyxl requests
```

## 26.1  NumPy — Numerical Python

NumPy gives you the **ndarray**: a fixed-type, fixed-size array that stores numbers in one continuous block of memory. A Python list stores pointers to scattered objects; a NumPy array stores the raw numbers. That single difference makes NumPy **10 to 100 times faster** for maths, and it is why Pandas, scikit-learn, TensorFlow and OpenCV are all built on top of it.

### Creating Arrays

```python
import numpy as np                       # np is the universal alias

a = np.array([1, 2, 3, 4, 5])            # from a list
b = np.array([[1, 2, 3], [4, 5, 6]])     # 2-D array (matrix)

print(np.zeros(5))                # [0. 0. 0. 0. 0.]
print(np.ones((2, 3)))            # 2 rows, 3 columns of 1.0
print(np.arange(0, 10, 2))        # [0 2 4 6 8]      -- like range()
print(np.linspace(0, 1, 5))       # [0.  0.25 0.5 0.75 1. ]  -- 5 evenly spaced
print(np.eye(3))                  # 3x3 identity matrix
print(np.random.randint(1, 100, 5))       # 5 random integers
```

### Array Attributes

```python
b = np.array([[1, 2, 3], [4, 5, 6]])

print(b.shape)     # (2, 3)   -> 2 rows, 3 columns
print(b.ndim)      # 2        -> number of dimensions
print(b.size)      # 6        -> total elements
print(b.dtype)     # int64    -> data type of EVERY element
print(b.T)         # transpose -> [[1 4] [2 5] [3 6]]
print(b.reshape(3, 2))      # change shape without changing data
```

### Vectorised Operations — No Loops Needed

This is the concept that matters most. In plain Python you loop over a list to do maths. In NumPy you write the operation once and it applies to **every element at once**.

```python
prices = np.array([100, 250, 400, 175])

# Plain Python needs a loop or comprehension
with_gst_list = [round(p * 1.18, 2) for p in [100, 250, 400, 175]]

# NumPy -- one expression, applied to the whole array
with_gst = np.round(prices * 1.18, 2)
print(with_gst)                  # [118. 295. 472. 206.5]

print(prices + 50)               # add 50 to every element
print(prices * 2)                # double every element
print(prices > 200)              # [False  True  True False]  -- boolean array
print(prices[prices > 200])      # [250 400]  -- BOOLEAN MASKING, very common
```

### Indexing and Slicing

```python
a = np.array([10, 20, 30, 40, 50])
print(a[0], a[-1], a[1:4])       # 10 50 [20 30 40]

m = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

print(m[1, 2])       # 6        -> row 1, column 2
print(m[0])          # [1 2 3]  -> whole first row
print(m[:, 1])       # [2 5 8]  -> whole second COLUMN
print(m[0:2, 1:3])   # [[2 3] [5 6]] -> a sub-block
```

### Aggregation Functions

| Function | Meaning | Example on `[10, 20, 30, 40]` |
| --- | --- | --- |
| `np.sum(a)` | total | 100 |
| `np.mean(a)` | average | 25.0 |
| `np.median(a)` | middle value | 25.0 |
| `np.std(a)` | standard deviation | 11.18 |
| `np.min()' / 'np.max()` | smallest / largest | 10 / 40 |
| `np.argmax(a)` | INDEX of the largest | 3 |
| `np.cumsum(a)` | running total | [10 30 60 100] |
| `np.sort(a)` | sorted copy | [10 20 30 40] |

```python
scores = np.array([[85, 92, 78],       # student 1: 3 subjects
                   [75, 88, 95],       # student 2
                   [60, 71, 68]])      # student 3

print(scores.sum())            # 712  -- everything
print(scores.sum(axis=1))      # [255 258 199]  -- total PER STUDENT (row-wise)
print(scores.mean(axis=0))     # [73.3 83.7 80.3] -- average PER SUBJECT (column-wise)
print(scores.max(axis=1))      # [92 95 71]  -- best subject per student
```

> **Remember the axis:**  `axis=0` moves down the rows (gives you a result per column). `axis=1` moves across the

columns (gives you a result per row).

### Broadcasting

```python
base = np.array([[45000], [62000], [38000]])     # 3 employees, shape (3,1)
months = np.array([1, 2, 3, 4])                  # shape (4,)

# NumPy stretches both to (3,4) automatically
cumulative = base * months
print(cumulative)
# [[ 45000  90000 135000 180000]
#  [ 62000 124000 186000 248000]
#  [ 38000  76000 114000 152000]]
```

#### Real-Time Example — Analysing Exam Results for a Class of 500

**Program: exam_analysis_numpy.py**

```python
import numpy as np

np.random.seed(42)                                  # reproducible results
subjects = ["Python", "DBMS", "OS", "Networks", "Maths"]
marks = np.random.randint(30, 101, size=(500, 5))   # 500 students x 5 subjects

totals      = marks.sum(axis=1)                     # total per student
percentages = totals / 5
subject_avg = marks.mean(axis=0)                    # average per subject

print("Class size          :", marks.shape[0])
print("Class average       :", round(percentages.mean(), 2), "%")
print("Highest percentage  :", round(percentages.max(), 2), "%")
print("Topper is student # :", np.argmax(percentages) + 1)

print("\nSubject-wise average:")
for name, avg in zip(subjects, subject_avg):
    print(f"  {name:<10} {avg:6.2f}   {'#' * int(avg / 5)}")

# Boolean masking -- who passed everything?
all_passed = (marks >= 35).all(axis=1)
any_failed = (marks < 35).any(axis=1)
distinction = percentages >= 75

print(f"\nPassed all subjects : {all_passed.sum()}")
print(f"Failed at least one : {any_failed.sum()}")
print(f"Distinction (>=75%) : {distinction.sum()}")
print(f"Top-10 percentages  : {np.sort(percentages)[-10:][::-1].round(1)}")
```

Five hundred students and five subjects — 2,500 numbers — analysed in about fifteen lines with **no loop over** **students at all**. The same job with plain lists would need three nested loops and run many times slower.

## 26.2  Pandas — Data Analysis

Pandas gives you two objects. A **Series** is a single labelled column. A **DataFrame** is a full table with rows and named columns — think of it as an Excel sheet or a SQL table you can control from Python. Pandas is how you read CSV/Excel files, clean messy data, group it and summarise it.

### Series and DataFrame

```python
import pandas as pd

# Series -- one column with an index
```

```python
s = pd.Series([45000, 62000, 38000], index=["Ravi", "Anu", "Kiran"], name="salary")
print(s["Anu"])            # 62000
print(s.mean())            # 48333.33

# DataFrame -- built from a dictionary of columns
df = pd.DataFrame({
    "name":   ["Ravi", "Anu", "Kiran", "Meera", "Sunil"],
    "dept":   ["IT", "HR", "IT", "Sales", "IT"],
    "salary": [45000, 62000, 38000, 71000, 20000],
    "city":   ["Hyderabad", "Bengaluru", "Hyderabad", "Chennai", "Hyderabad"],
})
print(df)
```

**Output:**

```text
name   dept  salary       city
0   Ravi     IT   45000  Hyderabad
1    Anu     HR   62000  Bengaluru
2  Kiran     IT   38000  Hyderabad
3  Meera  Sales   71000    Chennai
4  Sunil     IT   20000  Hyderabad
```

### Reading and Writing Files — Usually Line One of Any Project

```python
df = pd.read_csv("employees.csv")            # CSV
df = pd.read_excel("data.xlsx", sheet_name="Sheet1")
df = pd.read_json("data.json")
df = pd.read_sql("SELECT * FROM employees", connection)

df.to_csv("output.csv", index=False)         # write back
df.to_excel("output.xlsx", index=False)
```

### First Look at Any Dataset

| Command | What it tells you |
| --- | --- |
| `df.head()` | first 5 rows |
| `df.tail(3)` | last 3 rows |
| `df.shape` | (rows, columns) |
| `df.info()` | column names, data types, non-null counts |
| `df.describe()` | count, mean, std, min, quartiles, max for numeric columns |
| `df.columns` | list of column names |
| `df.dtypes` | data type of each column |
| `df.isnull().sum()` | how many missing values per column |
| `df['dept'].unique()` | distinct values |
| `df['dept'].value_counts()` | frequency of each value |

### Selecting Data

```python
df["salary"]                     # one column  -> Series
df[["name", "salary"]]           # several columns -> DataFrame

df.loc[2]                        # row by LABEL
df.loc[2, "name"]                # single cell by label
df.loc[df["dept"] == "IT"]       # rows matching a condition

df.iloc[0]                       # row by POSITION
df.iloc[0:3, 0:2]                # first 3 rows, first 2 columns
```

### Filtering — The Most-Used Skill

```python
# Single condition
it_staff = df[df["dept"] == "IT"]

# Multiple conditions -- use & and |, and wrap each part in ()
senior_it = df[(df["dept"] == "IT") & (df["salary"] > 40000)]

# isin() instead of a long chain of ors
metro = df[df["city"].isin(["Hyderabad", "Bengaluru"])]

# String matching
h_cities = df[df["city"].str.startswith("H")]

# between()
mid_band = df[df["salary"].between(35000, 65000)]
```

### Adding, Changing and Removing Columns

```python
df["annual"] = df["salary"] * 12                     # new column
df["band"] = df["salary"].apply(lambda s: "High" if s > 50000 else "Standard")
df["name"] = df["name"].str.upper()                  # transform in place

df = df.drop(columns=["city"])                       # remove a column
df = df.rename(columns={"salary": "monthly_salary"}) # rename
df = df.sort_values("salary", ascending=False)       # sort
```

### Handling Missing Data

```python
df.isnull().sum()                 # count NaN per column
df.dropna()                       # drop rows with any NaN
df.dropna(subset=["salary"])      # drop only if salary is missing
df.fillna(0)                      # replace all NaN with 0
df["salary"].fillna(df["salary"].mean(), inplace=True)   # fill with the average
df.drop_duplicates(subset=["email"])                     # remove duplicate rows
```

### groupby() — Split, Apply, Combine

`groupby()` is the single most valuable function in Pandas. It splits the table into groups, applies a calculation to each group, and combines the results — the same thing SQL's `GROUP BY` does.

```python
df.groupby("dept")["salary"].sum()          # total payroll per department
df.groupby("dept")["salary"].mean()         # average salary per department
df.groupby("dept").size()                   # headcount per department

# Several statistics at once
df.groupby("dept")["salary"].agg(["count", "sum", "mean", "max"])

# Group by two columns
df.groupby(["dept", "city"])["salary"].mean()

# Pivot table -- like Excel
df.pivot_table(values="salary", index="dept", columns="city", aggfunc="mean")
```

### Joining Tables

```python
employees = pd.DataFrame({"emp_id": [1, 2, 3], "name": ["Ravi", "Anu", "Kiran"]})
```

```python
salaries  = pd.DataFrame({"emp_id": [1, 2, 4], "amount": [45000, 62000, 51000]})

pd.merge(employees, salaries, on="emp_id", how="inner")   # only matching rows
pd.merge(employees, salaries, on="emp_id", how="left")    # all employees, NaN if no salary
pd.concat([df1, df2])                                     # stack rows on top of each other
```

#### Real-Time Example — Monthly Sales Analysis From a CSV

**Program: sales_analysis_pandas.py**

```python
import pandas as pd

# --- normally: df = pd.read_csv("sales.csv") ---
df = pd.DataFrame({
    "date":     ["2026-08-01", "2026-08-01", "2026-08-02", "2026-08-02",
                 "2026-08-03", "2026-08-03", "2026-08-04"],
    "region":   ["South", "North", "South", "West", "North", "South", "West"],
    "product":  ["Mouse", "Keyboard", "Monitor", "Mouse", "Monitor", "Keyboard", "Monitor"],
    "qty":      [12, 5, 3, 20, 2, 8, 4],
    "price":    [799, 1499.5, 12999, 799, 12999, 1499.5, 12999],
})

# 1. Derived column
df["revenue"] = df["qty"] * df["price"]
df["date"] = pd.to_datetime(df["date"])

# 2. Headline numbers
print(f"Total revenue : Rs.{df['revenue'].sum():,.2f}")
print(f"Total units   : {df['qty'].sum()}")
print(f"Avg order val : Rs.{df['revenue'].mean():,.2f}")

# 3. Revenue by region  (split -> apply -> combine)
by_region = (df.groupby("region")["revenue"]
               .agg(["sum", "count"])
               .rename(columns={"sum": "revenue", "count": "orders"})
               .sort_values("revenue", ascending=False))
print("\nRevenue by region:")
print(by_region)

# 4. Best-selling product
by_product = df.groupby("product").agg(
    units=("qty", "sum"),
    revenue=("revenue", "sum")
).sort_values("revenue", ascending=False)
print("\nProduct performance:")
print(by_product)

# 5. Daily trend
daily = df.groupby("date")["revenue"].sum()
print("\nDaily revenue:")
for d, r in daily.items():
    print(f"  {d.strftime('%d-%b')}  Rs.{r:>10,.2f}  {'#' * int(r / 5000)}")

# 6. Filter + export
big_orders = df[df["revenue"] > 10000].sort_values("revenue", ascending=False)
print(f"\nOrders above Rs.10,000: {len(big_orders)}")
big_orders.to_csv("big_orders.csv", index=False)
```

**Output:**

```text
Total revenue : Rs.129,955.00
Total units   : 54
Avg order val : Rs.18,565.00
Revenue by region:
        revenue  orders
```

```python
         region
         South   61585.0       3
         West    67984.0       2
         North   33495.5       2

         Product performance:
                   units   revenue
         product
         Monitor       9  116991.0
         Keyboard     13   19493.5
         Mouse        32   25568.0
```

Everything a business analyst does daily is in those six steps: create a derived column, compute headline totals, group by a dimension, rank the results, look at a trend over time, and export the exceptions. Doing this with plain dictionaries and loops would take four times the code.

## 26.3  Matplotlib — Charts

```python
import matplotlib.pyplot as plt

regions = ["South", "North", "West"]
revenue = [61585, 33495, 67984]

plt.figure(figsize=(7, 4))
plt.bar(regions, revenue, color="#1565C0")
plt.title("Revenue by Region - August 2026")
plt.xlabel("Region")
plt.ylabel("Revenue (Rs.)")
plt.grid(axis="y", alpha=0.3)
plt.tight_layout()
plt.savefig("revenue.png", dpi=150)      # save to a file
plt.show()                               # open a window

# Other chart types
plt.plot(dates, values)                  # line chart -- trends over time
plt.scatter(x, y)                        # scatter   -- relationship between 2 values
plt.pie(values, labels=names, autopct="%1.1f%%")   # pie -- share of a total
plt.hist(values, bins=20)                # histogram -- distribution

# Pandas can plot directly
df.groupby("region")["revenue"].sum().plot(kind="bar")
```

## 26.4  Other Libraries Worth Knowing

| Library | Purpose | One-line example |
| --- | --- | --- |
| `requests` | call REST APIs over HTTP | `requests.get(url).json()` |
| `openpyxl` | read/write Excel with formatting | `load_workbook("x.xlsx")` |
| `datetime` | dates, times, differences (built-in) | `datetime.now() - timedelta(days=7)` |
| `collections` | Counter, defaultdict (built-in) | `Counter(words).most_common(5)` |
| `re` | regular expressions (built-in) | `re.findall(r"\d+", text)` |
| `sqlalchemy` | talk to databases as objects | `session.query(Employee).all()` |
| `scikit-learn` | machine learning models | `model.fit(X, y)` |
| `flask' / 'fastapi` | build web APIs | `@app.route("/users")` |

```python
import requests
from collections import Counter
```

```python
from datetime import datetime, timedelta

# --- calling a REST API safely ---
try:
    response = requests.get("https://api.example.com/orders", timeout=10)
    response.raise_for_status()               # raises on 4xx / 5xx
    orders = response.json()                  # JSON -> list of dicts
except requests.exceptions.Timeout:
    print("API took too long to respond")
except requests.exceptions.RequestException as e:
    print("API call failed:", e)

# --- Counter: frequency in one line ---
statuses = ["Delivered", "Pending", "Delivered", "Shipped", "Delivered"]
print(Counter(statuses).most_common(2))       # [('Delivered', 3), ('Pending', 1)]

# --- dates ---
today = datetime.now()
last_week = today - timedelta(days=7)
print(today.strftime("%d-%b-%Y %I:%M %p"))    # 25-Aug-2026 06:30 PM
print((today - last_week).days)               # 7
```

## 26.5  list vs ndarray vs DataFrame

|  | Python list | NumPy ndarray | Pandas DataFrame |
| --- | --- | --- | --- |
| Holds | anything, mixed | one numeric type | labelled columns of any type |
| Shape | 1-D (nest for more) | N-dimensional | 2-D table |
| Maths on all items | needs a loop | vectorised, no loop | vectorised, no loop |
| Speed on 1M numbers | slow | very fast | fast |
| Column names | no | no | yes |
| Reads CSV/Excel | manual | limited | one line |
| Best for | general programming | maths, matrices, images | tables, analysis, reports |

> **How they fit together:**  A Pandas DataFrame column is a NumPy array underneath, and a NumPy array is a block  of numbers. So `df["salary"].values` hands you a NumPy array, and `list(arr)` hands you a plain Python list. Learn them in that order: list → ndarray → DataFrame.
