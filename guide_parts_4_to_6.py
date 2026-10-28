"""
Part 4 to Part 6 of the ChurnShield Technical Architecture & Engineering Documentation
"""

def get_part_four():
    return r"""# PART FOUR — FEATURE ENGINEERING AND TARGET CONSTRUCTION

## 1. Feature Engineering from First Principles

In machine learning, algorithms do not understand raw relational databases or raw transaction timestamps. They require a structured **feature matrix** ($\mathbf{X} \in \mathbb{R}^{N \times D}$) where each row represents an independent observation (a customer snapshot) and each column represents a numerical or categorical descriptor of their past purchasing behavior.

**Feature engineering** is the process of transforming raw transactional events (orders, items, prices, dates) into meaningful statistical signals that capture:
1. **Recency:** How recently did the customer interact with the platform?
2. **Frequency:** How often does the customer buy?
3. **Monetary Value:** How much capital does the customer inject?
4. **Basket Depth & Diversity:** How many items, products, and merchants are involved in their orders?
5. **Momentum / Velocity:** Is the customer's purchasing accelerating, constant, or decaying over time?

---

## 2. Temporal Windows & Leakage Prevention Timeline

To build a valid predictive model without data leakage, we structure the timeline around a chosen **Snapshot Date ($T$)**:

```
<================ 180-Day Lookback Window ================> | <====== 90-Day Outcome Window ======>
[ T - 180 Days ] -----------------------------------------> [ T ] ------------------------------> [ T + 90 Days ]
         Historical Behavioral Features (X)                  |            Target Label (y)
   - Order count, total spend, recency,                      |   Did the customer place >= 1 order?
     velocity ratios, basket depth, freight                  |   Yes -> y = 1 (Repeat Buyer)
                                                             |   No  -> y = 0 (Inactive Proxy)
```

### The Strict Non-Leakage Rule:
* **Features ($\mathbf{X}$):** Calculated **strictly and exclusively** from transactions occurring in $[T - 180\text{d}, T)$. Not a single second of data from $t \ge T$ is permitted to enter the feature matrix.
* **Target ($y$):** Evaluated **strictly** from transactions occurring in $[T, T + 90\text{d})$.
* **Why this prevents catastrophic leakage:** If a feature were allowed to check whether an order was placed at $T + 10\text{d}$, the model would simply memorize that future order and achieve a fake 100% accuracy during testing, completely collapsing when deployed in live production where future data does not exist.

---

## 3. Comprehensive Feature Dictionary (All 21 Model Features)

The table below details all 21 features engineered and utilized by ChurnShield:

| # | Feature Name | Type | Mathematical / Computational Formulation | Why it Helps Predict Future Inactivity |
| :--- | :--- | :---: | :--- | :--- |
| 1 | `order_count` | Numeric | Count of qualifying orders in $[T - 180\text{d}, T)$ | Direct measure of historical purchase frequency. Customers with multiple orders have fundamentally higher baseline propensity to repeat than one-time buyers. |
| 2 | `total_spend` | Numeric | $\sum (\text{item\_price} + \text{freight\_value})$ across all orders in lookback | Measures total customer lifetime financial commitment. High-spend accounts represent higher commercial value and distinct shopping patterns. |
| 3 | `avg_order_value` | Numeric | $\frac{\text{total\_spend}}{\text{order\_count}}$ | Measures typical cart size. Helps distinguish high-frequency low-ticket buyers from low-frequency luxury buyers. |
| 4 | `median_order_value`| Numeric | $\text{Median}(\text{order\_spend}_k)$ across customer's orders | Robust measure of typical spend that is unaffected by single extreme outlier transactions. |
| 5 | `order_value_std` | Numeric | Standard deviation of order values; 0.0 if $\le 1$ order | Captures spending consistency or volatility across orders. |
| 6 | `total_items` | Numeric | Total count of individual line items purchased | Captures physical volume of merchandise ordered. |
| 7 | `avg_items_per_order`| Numeric | $\frac{\text{total\_items}}{\text{order\_count}}$ | Measures basket depth. Bulk buyers show different retention behavior compared to single-item purchasers. |
| 8 | `total_freight` | Numeric | $\sum \text{freight\_value}$ paid by customer in lookback | Measures shipping friction. In Brazil, high shipping fees are a primary reason for cart abandonment and dormancy. |
| 9 | `freight_ratio` | Numeric | $\frac{\text{total\_freight}}{\text{total\_spend}}$ | Measures the freight burden as a proportion of total spend. High freight ratios strongly penalize repeat purchase likelihood. |
| 10 | `distinct_products` | Numeric | Count of unique `product_id`s purchased | Measures catalog exploration. Customers purchasing diverse products are more engaged than single-category buyers. |
| 11 | `distinct_sellers` | Numeric | Count of unique `seller_id`s fulfilled from | Captures marketplace fulfillment exposure. Interacting with multiple sellers reflects broader marketplace adoption. |
| 12 | `recency_days` | Numeric | $T - \max(\text{order\_timestamp})$ in days | **Strongest churn predictor.** Customers who purchased 5 days before $T$ are actively engaged; customers who purchased 175 days ago are likely already dormant. |
| 13 | `tenure_days` | Numeric | $T - \min(\text{order\_timestamp})$ in days | Time since customer's very first order in the lookback window. Measures relationship maturity. |
| 14 | `has_multiple_orders`| Binary | $1 \text{ if } \text{order\_count} > 1 \text{ else } 0$ | Clear non-linear indicator separating one-time trial purchasers from multi-order repeat buyers. |
| 15 | `avg_inter_order_days`| Numeric | Mean days between consecutive orders; 180.0 if $\le 1$ order | Measures purchasing cadence. Regular buyers have predictable re-order cycles; 180.0 signals no repeat cycle. |
| 16 | `std_inter_order_days`| Numeric | Standard deviation of inter-order days; 0.0 if $\le 1$ order | Measures cadence regularity. Low variance implies strict subscription-like periodic purchasing. |
| 17 | `orders_recent_90d` | Numeric | Count of orders in the recent subwindow $[T - 90\text{d}, T)$ | **Primary velocity driver.** Captures immediate, recent activity versus stale historical activity. |
| 18 | `spend_recent_90d` | Numeric | Total spend in the recent subwindow $[T - 90\text{d}, T)$ | Measures recent monetary momentum. High recent spend signals active commercial intent. |
| 19 | `order_ratio_recent_vs_earlier` | Numeric | $\frac{\text{orders in } [T-90\text{d}, T)}{\text{orders in } [T-180\text{d}, T-90\text{d})}$ | Velocity ratio. Value $> 1.0$ indicates accelerating purchase frequency; $< 1.0$ indicates declining engagement. |
| 20 | `spend_ratio_recent_vs_earlier` | Numeric | $\frac{\text{spend in } [T-90\text{d}, T)}{\text{spend in } [T-180\text{d}, T-90\text{d})}$ | Monetary momentum ratio. Captures whether customer spending is expanding or decaying leading up to snapshot date $T$. |
| 21 | `customer_state` | Categorical | Brazilian State code (SP, RJ, MG, etc. - 27 states) | Encodes geographic differences in shipping speed, regional fulfillment logistics, and local e-commerce adoption. |

---
"""

def get_part_five():
    return r"""# PART FIVE — EXPLORATORY DATA ANALYSIS (EDA)

The notebook executes 15 distinct visualization panels organized across 4 figures. Below is the detailed breakdown of each figure, how to read the axes, and the empirical business insights revealed.

---

### Figure Group 1 (Cell 13 / Code Cell 06): Population Growth, Orders, Spend & Recency

#### Panel 1: Customer Population Growth by Observation Date
* **Visual Type:** Bar plot (X: Observation Date, Y: Active Eligible Customers).
* **Variables:** `observation_date` vs count of unique customers in lookback window.
* **How to Read Axes:** X-axis shows the 5 snapshot dates from June 2017 to June 2018. Y-axis shows the volume of eligible customers.
* **Empirical Observation:** The active customer population expands dramatically from **10,955** in June 2017 to **39,162** in June 2018 (a 3.57x expansion).
* **Business Takeaway:** Reflects the rapid organic scaling of the Olist marketplace during 2017–2018. Models trained on early cohorts must generalize to much larger later cohorts.

#### Panel 2: Distribution of Qualifying Orders (Log Scale)
* **Visual Type:** Count plot on logarithmic Y-scale (X: Order Count, Y: Customer Count).
* **Variables:** `order_count` (1, 2, 3, 4, 5+).
* **How to Read Axes:** X-axis shows integer order counts. Y-axis is logarithmic ($10^0$ to $10^5$).
* **Empirical Observation:** **96.8% of all customer snapshots have an order count of exactly 1.** Fewer than 3% placed 2 orders, and fewer than 0.3% placed 3 or more orders.
* **Business Takeaway:** In non-contractual e-commerce, the overwhelming majority of consumers are "one-time transactional buyers." Repeat buyers are rare, high-value outliers.

#### Panel 3: Customer Spend Distribution (Log Scale, R$)
* **Visual Type:** Histogram with Kernel Density Estimate (KDE) on logarithmic X-scale.
* **Variables:** `total_spend` in Brazilian Real (R$).
* **How to Read Axes:** X-axis is log-transformed spend (R$ 10 to R$ 5,000+). Y-axis is probability density.
* **Empirical Observation:** Spend follows a classic log-normal distribution with a median around **R$ 105** and a mean around **R$ 158**. The extreme upper tail extends beyond R$ 3,000.
* **Business Takeaway:** Because spend is log-normally distributed, median order value is a much safer metric of central tendency than mean order value, and linear models require standard scaling to handle the skew.

#### Panel 4: Days Since Most Recent Order at Snapshot (Recency)
* **Visual Type:** Histogram with KDE (X: Recency in Days, Y: Count).
* **Variables:** `recency_days` spanning 0 to 180 days.
* **How to Read Axes:** X-axis is days (0 = bought yesterday, 180 = bought at the very start of lookback).
* **Empirical Observation:** The distribution is relatively flat and uniform across the 180-day window, with slight bumps reflecting shopping peaks.
* **Business Takeaway:** Eligible customers are evenly distributed across the lookback horizon, ensuring the model sees a balanced mix of newly acquired and older accounts.

---

### Figure Group 2 (Cell 15 / Code Cell 07): Basket Depth, Momentum, Repeat Rates & Imbalance

#### Panel 5: Distinct Products & Sellers per Customer
* **Visual Type:** Dual boxplot on log Y-scale.
* **Variables:** `distinct_products` and `distinct_sellers`.
* **Empirical Observation:** Median is 1 for both. However, the upper quartile and outliers reach 10+ products fulfilled by 5+ distinct merchants.
* **Business Takeaway:** Most buyers purchase a single catalog item, but multi-item buyers introduce multi-seller logistics complexity.

#### Panel 6: Purchasing Momentum (Recent 90d vs Total Spend)
* **Visual Type:** Hexbin / Scatter on log-log axes.
* **Variables:** X: `spend_recent_90d`, Y: `total_spend`.
* **Empirical Observation:** Customers lie along two regimes: those along the line $Y = X$ (whose spend was 100% concentrated in the last 90 days) and those along the horizontal boundary (whose spend occurred 90–180 days ago and have spent R$ 0 recently).
* **Business Takeaway:** Captures sudden drops in purchasing activity, a key warning signal for inactivity.

#### Panel 7: Repeat Purchase Rate Trajectory Across Cohorts
* **Visual Type:** Line plot with point markers (X: Cohort, Y: Repeat Rate %).
* **Empirical Observation:** Repeat rates:
  - 2017-06-01: **0.89%**
  - 2017-09-01: **0.96%**
  - 2017-12-01: **0.88%**
  - 2018-03-01: **0.83%**
  - 2018-06-01: **0.69%**
* **Business Takeaway:** The repeat rate is remarkably stable under 1.0%, but shows a slight secular decline as platform acquisition accelerated in 2018, bringing in more casual one-time buyers.

#### Panel 8: Target Class Balance (Donut Chart)
* **Visual Type:** Donut pie chart.
* **Variables:** `repeat_purchase_next_90d` ($y=0$ vs $y=1$).
* **Empirical Observation:** **99.14% Inactive (0) vs 0.86% Repeat (1)** across the pooled dataset.
* **Critical Takeaway:** **This visual proves why standard Accuracy is useless.** A dumb model predicting 0 for every customer achieves 99.14% accuracy while catching zero repeat buyers.

---

### Figure Group 3 (Cell 17 / Code Cell 08): Geography, RFM Dynamics & Correlations

#### Panel 9: Repeat Purchase Rate by State
* **Visual Type:** Horizontal bar chart sorted by repeat rate (filtered to states with $\ge 500$ buyers).
* **Empirical Observation:** São Paulo (SP), Rio de Janeiro (RJ), and Minas Gerais (MG) dominate total volume, but repeat rates vary regionally from ~0.6% to ~1.2%.
* **Takeaway:** State encoding captures regional variations in logistics and delivery speed.

#### Panel 10: Multi-Dimensional RFM (Recency vs AOV by Target)
* **Visual Type:** Scatter plot with hue = `repeat_purchase_next_90d`.
* **Empirical Observation:** Red dots (repeat buyers) cluster heavily in the lower recency band (< 60 days). Customers with recency > 120 days rarely repeat.
* **Takeaway:** Recency is the primary separator between active and dormant buyers.

#### Panel 11: Feature Correlation Heatmap
* **Visual Type:** Annotated lower-triangle Pearson correlation matrix.
* **Key Correlations:**
  - `order_count` and `total_items`: $r = 0.82$ (Strong collinearity).
  - `total_spend` and `total_freight`: $r = 0.76$.
  - `orders_recent_90d` and `order_count`: $r = 0.65$.
* **Takeaway:** High collinearity exists among volume metrics. Regularized models (L2 Ridge penalty in Logistic Regression) are necessary to stabilize coefficients.

---

### Figure Group 4 (Cell 19 / Code Cell 09): Distributions by Outcome & Freight Impact

#### Panel 12: Recency Density (Repeat vs Inactive)
* **Visual Type:** Overlaid KDE density curves.
* **Observation:** Repeat buyers have a sharply left-shifted recency curve (median ~38 days), while inactive customers have a flat median around ~92 days.

#### Panel 13: Average Order Value by Cohort
* **Visual Type:** Bar chart with value annotations.
* **Observation:** Stable AOV: R$ 153.2 (2017-06) to R$ 164.5 (2018-06). Spending per transaction is steady across years.

#### Panel 14: Data Quality & Zero-Null Certification
* **Visual Type:** Rendered tabular matrix confirming 0 missing values across all 21 features.

#### Panel 15: Freight Ratio by Customer Outcome
* **Visual Type:** Comparative boxplots of `freight_ratio` for inactive vs repeat customers.
* **Observation:** Inactive customers exhibit higher freight ratios (paying a larger proportion of total order value in shipping), indicating shipping costs drive customer attrition.

---

## 4. Correlation vs Association vs Causation

A critical distinction in production predictive systems:
* **Correlation:** A linear statistical association between two numeric variables (e.g., $r = 0.82$ between `order_count` and `total_items`).
* **Association (Predictive Utility):** When knowledge of feature $X$ helps narrow the probability distribution of outcome $Y$ (e.g., customers with recency < 30 days are more likely to buy again).
* **Causation:** Proving that changing $X$ directly forces $Y$ to change (e.g., "Giving a customer R$ 10 discount *causes* them to buy").
* *Critical Production Note: Machine learning models discover associations, NOT causation. A model can accurately rank dormant customers without proving that sending them a marketing email will causally force them to make a purchase.*

---
"""

def get_part_six():
    return r"""# PART SIX — DATA PREPROCESSING PIPELINES

## 1. Why Preprocessing is Essential

Raw tabular features have wildly disparate scales, units, and mathematical structures:
* `recency_days` ranges from $0$ to $180$ days.
* `total_spend` ranges from $R\$ 10$ to $R\$ 10,000+$ Brazilian Real.
* `has_multiple_orders` is a binary integer ($0$ or $1$).
* `customer_state` is a string category (`'SP'`, `'RJ'`, `'MG'`).

If fed directly into linear models or distance-based algorithms:
1. `total_spend` (in hundreds or thousands) would artificially dominate the objective function simply due to its scale, while `has_multiple_orders` (0 or 1) would be completely ignored.
2. In regularized logistic regression, the L2 penalty $\lambda \sum \beta_j^2$ penalizes all coefficients equally. If features are not standardized, coefficients cannot be meaningfully compared, and regularization unfairly penalizes features with small raw scales.

---

## 2. The ChurnShield Preprocessing Architecture

To ensure 100% reproducibility and prevent data leakage, preprocessing is implemented using Scikit-Learn's `ColumnTransformer` and encapsulated within an end-to-end `Pipeline`.

```
Raw Customer Feature Row (21 Features)
                 |
                 +-----------------------+
                 |                       |
                 v                       v
     [20 Numerical Features]     [1 Categorical Feature: customer_state]
                 |                       |
                 v                       v
     SimpleImputer(median)       SimpleImputer(most_frequent)
                 |                       |
                 v                       v
          StandardScaler()         OneHotEncoder(handle_unknown='ignore')
                 |                       |
                 +-----------+-----------+
                             |
                             v
                 Unified Scaled Feature Vector (47 Dimensions)
                             |
                             v
                 Scikit-Learn Classifier
```

---

## 3. Preprocessing Techniques Explained

### A. Median Imputation (`SimpleImputer(strategy='median')`)
* **How it works:** Replaces any missing values with the median of that feature calculated on the training set.
* **Why Median over Mean:** Financial and behavioral metrics (spend, items) are heavily right-skewed. The mean is pulled upward by extreme outliers; the median represents the true 50th percentile.

### B. Standard Scaling (`StandardScaler()`)
* **Mathematical Formula:**
  $$z = \frac{x - \mu}{\sigma}$$
  where $\mu$ is the training mean and $\sigma$ is the training standard deviation.
* **Result:** Centers every numeric feature at mean $0.0$ with unit variance ($\sigma^2 = 1.0$).

### C. One-Hot Encoding (`OneHotEncoder(handle_unknown='ignore', sparse_output=False)`)
* **How it works:** Converts a categorical variable with $K$ unique categories into $K$ binary columns ($0$ or $1$).
* **Illustrative Example:**
  ```
  Customer State -> [ state_MG, state_RJ, state_SP ]
  'SP'           -> [    0    ,    0    ,    1     ]
  'RJ'           -> [    0    ,    1    ,    0     ]
  'MG'           -> [    1    ,    0    ,    0     ]
  ```
* **Why `handle_unknown='ignore'` is critical:** If a new state code appears during future production inference (e.g., `'DF'` or an invalid entry `'XX'`), the encoder outputs `[0, 0, 0]` across all state columns instead of throwing an unhandled exception.

---

## 4. `fit` vs `transform` vs `fit_transform`

A fundamental distinction in Scikit-Learn pipeline design:

| Method | What It Does | Where It Must Be Called |
| :--- | :--- | :--- |
| `fit()` | Calculates and stores the internal transformation parameters (e.g., $\mu$ and $\sigma$ for `StandardScaler`, category lists for `OneHotEncoder`). | **Strictly on Training Data ONLY.** |
| `transform()` | Applies the stored parameters to transform data into scaled/encoded format. Does NOT recalculate parameters. | **On Validation Data, Test Data, and Production Data.** |
| `fit_transform()` | Computes parameters and transforms data in a single combined call. Equivalent to `fit(X).transform(X)`. | **On Training Data ONLY.** |

### The Data Snooping Trap:
If you call `fit_transform` on the entire dataset (or on the test set), the scaler uses the test set's mean and standard deviation. The model has now "peeked" into the test set before evaluation. This is **data leakage**.

### Why Encapsulating in a `Pipeline` Solves This:
When you call `champion_pipeline.fit(train_df)`, Scikit-Learn automatically calls `fit_transform` *only* on the training data. When you later call `champion_pipeline.predict(test_df)`, it automatically calls `transform` using the previously stored training parameters. This mathematically guarantees zero data leakage.

---
"""

if __name__ == "__main__":
    print("Parts 4-6 loaded successfully.")
