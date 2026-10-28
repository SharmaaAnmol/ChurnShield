"""
Part 1 to Part 3 of the ChurnShield Technical Architecture & Engineering Documentation
"""

def get_part_one():
    return r"""# PART ONE — UNDERSTAND THE COMPLETE PROJECT

## 1. Executive Overview: What is ChurnShield?
**ChurnShield** is an end-to-end, production-grade Machine Learning system designed to predict **customer inactivity risk** and optimize **retention marketing intelligence** for non-contractual e-commerce platforms. 

Using the real-world **Brazilian E-Commerce Public Dataset by Olist** (~100,000 orders from 2016 to 2018), ChurnShield solves one of the most difficult challenges in modern retail data science: identifying which previously active customers are unlikely to place another order in the subsequent 90 days, ranking them by inactivity risk, and simulating the financial return on investment (ROI) of targeted retention campaigns under real-world marketing budget constraints.

---

## 2. The Core Business Problem
In modern e-commerce, **customer acquisition is 5 to 7 times more expensive than customer retention**. High customer churn erodes unit economics and burns marketing capital. 

However, retention marketing teams cannot afford to send expensive discounts or high-touch win-back emails to their entire customer database:
1. **Budget Constraints:** Marketing budgets and outbound communication bandwidth are strictly finite.
2. **Margin Erosion:** Offering discounts to "loyal" customers who would have purchased anyway cannibalizes profit margins.
3. **Spam Fatigue:** Repeatedly messaging unengaged customers leads to email unsubscribes, app uninstalls, and brand degradation.

**The Business Need:** E-commerce retailers need a mathematically sound decision system that ranks customers by their likelihood of dormancy, allowing marketing teams to target only the top 10%, 20%, or 30% most at-risk accounts where intervention yields positive net contribution margin.

---

## 3. Why the Olist E-Commerce Dataset Instead of Telecom Churn?
Most machine learning introductory machine learning tutorials use synthetic or simplistic "Telecom Churn" datasets (such as Telco Churn from IBM). While convenient for tutorials, telecom churn is fundamentally unrepresentative of modern e-commerce:

| Dimension | Textbook Telecom Churn | Real-World E-Commerce (Olist) |
| :--- | :--- | :--- |
| **Contractual Nature** | **Contractual:** Customers have an active subscription and must explicitly call or click to cancel. | **Non-Contractual:** Customers never "cancel". They simply silently drift away and stop purchasing. |
| **Ground Truth Churn Label** | Explicit boolean flag (`Churn = Yes/No`) recorded at the moment of contract termination. | **No explicit churn label exists.** Churn must be mathematically proxied via behavioral observation windows. |
| **Class Balance** | Artificially balanced or moderately imbalanced (~20% to 30% churners). | **Extreme Class Imbalance:** Repeat purchasing in a fixed 90-day quarterly window is a rare event (< 1% repeat rate, > 99% inactive). |
| **Temporal Dynamics** | Static cross-sectional snapshot (often ignoring dates entirely). | **Strictly Temporal:** Longitudinal customer trajectories over multiple years requiring rigorous rolling-origin evaluation. |
| **Data Architecture** | Single, clean, pre-flattened CSV table. | **Relational Normalized Schema:** 9 separate relational tables requiring multi-table joins and aggregation. |

Choosing the Olist dataset demonstrates to senior engineers and industry stakeholders that you understand how machine learning operates on messy, complex, non-contractual production data.

---

## 4. The Relational Schema: Why Multiple CSVs are Necessary
The raw Olist dataset is organized as a **relational database schema** in third normal form (3NF). Normalization eliminates data redundancy and prevents update anomalies. 

The three core tables used for modeling are:
1. `olist_orders_dataset.csv` (99,441 rows): The central transaction log containing `order_id`, `customer_id`, `order_status`, and timestamps (`order_purchase_timestamp`, `order_delivered_customer_date`).
2. `olist_customers_dataset.csv` (99,441 rows): The customer identity mapping table containing `customer_id`, `customer_unique_id`, `customer_city`, and `customer_state`.
3. `olist_order_items_dataset.csv` (112,650 rows): The line-item detail table containing `order_id`, `order_item_id`, `product_id`, `seller_id`, `price`, and `freight_value`.

### Crucial Architectural Distinction: `customer_id` vs `customer_unique_id`
* **`customer_id` (Transaction-Level Identifier):** A transient token generated per order. Every row in `olist_orders_dataset.csv` has a distinct `customer_id`.
* **`customer_unique_id` (Human-Level Identifier):** The true individual person behind the purchase. A repeat buyer has multiple different `customer_id` tokens, but exactly one permanent `customer_unique_id`.
* *Failure to group by `customer_unique_id` would treat every single transaction as an independent one-time buyer, making customer-level churn prediction impossible.*

---

## 5. Mathematical Target Formulation: 90-Day Inactivity Proxy
Because non-contractual e-commerce lacks an explicit cancellation event, we formulate the target using a **two-stage temporal observation design**:

$$\text{Observation Window } [T - 180\text{d}, T) \implies \text{Snapshot Date } T \implies \text{Future Outcome Window } [T, T + 90\text{d})$$

1. **The Machine Learning Target (`repeat_purchase_next_90d`):**
   $$y_i = \begin{cases} 1 & \text{if customer } i \text{ places } \ge 1 \text{ qualifying order in } [T, T + 90\text{d}) \\ 0 & \text{if customer } i \text{ places } 0 \text{ qualifying orders in } [T, T + 90\text{d}) \end{cases}$$

2. **The Inactivity Risk Score ($S_{\text{inactivity}}$):**
   The classification pipeline outputs the predicted probability of repeat purchasing $\hat{P}(y = 1 \mid \mathbf{x})$. The complementary inactivity risk score is:
   $$S_{\text{inactivity}} = 1.0 - \hat{P}(y = 1 \mid \mathbf{x})$$
   * When $\hat{P} = 0.05$, the customer's Inactivity Risk Score is $0.95$ (95% probability of dormancy).
   * When $\hat{P} = 0.80$, the customer's Inactivity Risk Score is $0.20$ (20% probability of dormancy).

### What the Prediction Can and Cannot Tell a Business
* **What it CAN tell the business:** Which existing customers exhibit purchasing patterns (recency, frequency, velocity, monetary momentum) that historically correspond to near-zero repeat activity over the next quarter. It provides a reliable rank-ordering of customers from most dormant to most active.
* **What it CANNOT tell the business:** It cannot prove that a customer has permanently died, uninstalled the app forever, or will never return 18 months later. It is a **quarterly inactivity proxy**, not a proof of permanent defect. Furthermore, machine learning predicts propensity; it does not guarantee that a marketing coupon will causally persuade the customer to buy without a randomized controlled trial (A/B test).

---

## 6. End-to-End System Architecture

```
+-------------------------------------------------------------------------------+
|                       RAW RELATIONAL OLIST CSV TABLES                         |
|   olist_orders_dataset.csv   olist_customers_dataset.csv   olist_order_items  |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|              DATA QUALITY & INTEGRITY GATE (Zero Duplicates, Key Check)       |
|    - Verify PK uniqueness (order_id, customer_id, composite order_items)      |
|    - Parse timestamps & audit null values across all 9 raw tables             |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|               ORDER-ITEM AGGREGATION & 1:1 RELATIONAL JOIN                    |
|    - Group order_items to order_id level (sum price, sum freight, count items)|
|    - Merge orders 1:1 with aggregated items (filters 775 orphaned orders)     |
|    - Merge 1:1 with customers table to map customer_id -> customer_unique_id   |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                 LONGITUDINAL FEATURE STORE GENERATION (5 COHORTS)             |
|   Cohort Dates: 2017-06-01, 2017-09-01, 2017-12-01, 2018-03-01, 2018-06-01    |
|   For each cohort snapshot T:                                                 |
|     - Lookback Window [T - 180d, T): Engineer 20 numerical + 1 state feature  |
|     - Future Outcome Window [T, T + 90d): Label repeat_purchase_next_90d      |
|   Total Curated Snapshot Rows: 130,914 across 24 columns                      |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|            10-POINT FEATURE MATRIX GATE (Zero-Leakage & Cleanliness)          |
|    - Verify zero nulls, zero infinities, valid ranges, correct entity PKs     |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|           EXPLORATORY DATA ANALYSIS (15 Visual Panels, Figures 1 to 15)       |
|    - Cohort growth, spend/order distributions, RFM dynamics, state rates      |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                 CHRONOLOGICAL ROLLING-ORIGIN EXPERIMENTAL DESIGN              |
|   - Training Set   (2017-06, 09, 12) : 56,975 rows (0.91% repeat rate)        |
|   - Validation Set (2018-03-01)      : 34,777 rows (0.83% repeat rate)        |
|   - Test Set       (2018-06-01)      : 39,162 rows (0.69% repeat rate)        |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                   LEAKAGE-FREE SCIKIT-LEARN PIPELINE                          |
|   - Numerical Features   : SimpleImputer(median) -> StandardScaler()          |
|   - Categorical Feature  : SimpleImputer(most_frequent) -> OneHotEncoder()    |
|   - Pipeline encapsulation ensures transformations fit ONLY on training data  |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|            MODEL BENCHMARKING (7 ARCHITECTURES ACROSS 8 METRICS)              |
|   Dummy, Logistic Regression, Decision Tree, Random Forest, Extra Trees,      |
|   Gradient Boosting, HistGradientBoosting                                     |
|   Primary Selection Metric: PR-AUC (Average Precision)                        |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|              CHAMPION SELECTION & HYPERPARAMETER TUNING                       |
|   - Champion: Balanced Logistic Regression (C = 1.0, class_weight='balanced') |
|   - Val PR-AUC: 0.0173 | Val ROC-AUC: 0.5543 | Val Recall: 44.60%             |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|               FINAL EVALUATION ON UNTOUCHED JUNE 2018 TEST SET                |
|   - Test PR-AUC: 0.0117 (1.70x lift over Dummy baseline 0.0069)               |
|   - Test ROC-AUC: 0.5849 | Test Minority Recall: 42.59% | Brier Loss: 0.2279  |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                 RETENTION INTELLIGENCE & BUSINESS ROI SIMULATOR               |
|   - Decile Policy: Top 20% Inactivity Risk outreach captures 7,798 dormant    |
|     customers with 99.57% concentration                                       |
|   - Campaign ROI Simulation: R$ 39,160 spend yields R$ 46,788 gross margin    |
|     -> Net Gain: +R$ 7,628 (19.5% ROI)                                        |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                 MODEL EXPLAINABILITY & PERMUTATION IMPORTANCE                 |
|   - Top Drivers: orders_recent_90d, spend_ratio_recent_vs_earlier, recency    |
+-------------------------------------------------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                 PRODUCTION INFERENCE ENGINE & ARTIFACT EXPORT                 |
|   - predict_customer_inactivity() evaluates live single-customer payloads     |
|   - Full pipeline exported to churnshield_model.joblib (100% verified reload) |
|   - All 8 artifacts packaged into churnshield_artifacts.zip                   |
+-------------------------------------------------------------------------------+
```

---
"""

def get_part_two():
    return r"""# PART TWO — EXPLAIN EVERY NOTEBOOK SECTION & CODE CELL

Below is the complete, sequential walkthrough of all **21 Code Cells** and **24 Markdown sections** in `ChurnShield_Customer_Inactivity_Prediction.ipynb`.

---

### Cell 00 [Markdown]: Notebook Title & Executive Abstract
* **Purpose:** Introduces the project identity ("ChurnShield"), institutional attribution, and problem statement.
* **Why it matters:** Establishes the business and scientific framing immediately for university examiners.

---

### Cell 01 [Markdown]: Environment Setup Header
* **Purpose:** Explains reproducibility requirements, library versions, and execution environments.

---

### Cell 02 [CODE #01]: Environment Setup & Automated Dependency Management
* **Purpose:** Configures environment variables, suppresses non-critical warnings, sets random seeds, establishes directory paths, detects Google Colab vs Local execution, installs `kagglehub` if missing in Colab, and prints package versions.
* **Key Code Lines:**
  ```python
  os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib'
  RANDOM_STATE = 42
  np.random.seed(RANDOM_STATE)
  IN_COLAB = 'google.colab' in sys.modules
  if IN_COLAB:
      subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "kagglehub"])
  ```
* **Why it matters:** Setting `MPLCONFIGDIR` eliminates matplotlib font cache rebuild delays. `RANDOM_STATE = 42` guarantees identical train/validation splits across different runs. The dynamic Colab check ensures the notebook runs automatically in Google Colab without manual user installation.
* **Inputs & Outputs:** Input: OS environment. Output: Directory creation (`data/`, `artifacts/`) and system version banner (Python 3.13, Scikit-Learn 1.9+, Pandas 2.3+).
* **System Design & Implementation Rationale:** *Why did you set a random state seed, and why is `os.environ['MPLCONFIGDIR']` configured?*  
  *Answer:* Random seed (42) guarantees deterministic, reproducible splits and stochastic initialization. Configuring `MPLCONFIGDIR` to `/tmp/matplotlib` prevents matplotlib from failing or pausing to index system fonts when running in restricted/sandboxed user directories.

---

### Cell 03 [Markdown]: Section 1 Header — Project Identity & Target Formulation
* **Purpose:** Outlines the mathematical definition of repeat purchase propensity and inactivity risk.

---

### Cell 04 [Markdown]: Section 2 Header — Dataset Acquisition & Provenance
* **Purpose:** Documents the dataset source (Kaggle: Brazilian E-Commerce by Olist) and its CC BY-NC-SA 4.0 license.

---

### Cell 05 [CODE #02]: Multi-Tier Dataset Acquisition & Recursive File Discovery
* **Purpose:** Implements a resilient 3-tier file loader:
  1. *Tier 1:* Checks if CSVs exist in `./data/`.
  2. *Tier 2:* In Google Colab, downloads dataset via `kagglehub.dataset_download("olistbr/brazilian-ecommerce")`.
  3. *Tier 3:* Unzips `archive.zip` if manually uploaded to Colab.
* **Key Code Lines:**
  ```python
  for root, dirs, files in os.walk(data_search_path):
      for f in files:
          if f.endswith('.csv'): discovered_files[f] = os.path.join(root, f)
  ```
* **Why it matters:** Hardcoded paths break when sharing notebooks. Recursive discovery finds the CSV files wherever Colab or Kagglehub places them.
* **Inputs & Outputs:** Discovers all 9 CSV files totaling ~124 MB uncompressed.
* **System Design & Implementation Rationale:** *Why did you implement a multi-tier fallback instead of a simple hardcoded `pd.read_csv('/content/...')`?*  
  *Answer:* A hardcoded path fails if the notebook is moved across local machines, Kaggle kernels, or fresh Google Colab instances. The multi-tier engine guarantees seamless execution anywhere.

---

### Cell 06 [Markdown]: Section 3 Header — Comprehensive Data Quality Audit
* **Purpose:** Introduces the rigorous pre-modeling data quality verification methodology.

---

### Cell 07 [CODE #03]: Comprehensive Data Quality & Relational Join Audit
* **Purpose:** Loads the 3 core CSVs (`orders`, `customers`, `order_items`), validates primary key uniqueness, inspects date ranges, detects orphaned records, performs order-level item aggregation, and executes the 1:1 relational merge.
* **Key Code Lines:**
  ```python
  items_agg = raw_items.groupby('order_id').agg(
      total_price=('price', 'sum'),
      total_freight=('freight_value', 'sum'),
      total_items=('order_item_id', 'count'),
      distinct_products=('product_id', 'nunique'),
      distinct_sellers=('seller_id', 'nunique')
  ).reset_index()
  merged = raw_orders.merge(items_agg, on='order_id', how='inner')
  merged = merged.merge(raw_customers[['customer_id', 'customer_unique_id', 'customer_state']], on='customer_id', how='inner')
  ```
* **Why it matters:** Orders have multiple line items. If you join `raw_items` directly with `raw_orders` without aggregation, a single order with 3 items multiplies into 3 rows, catastrophically inflating order counts and revenue. Aggregating items first guarantees an exact 1:1 merge (98,666 valid orders).
* **Inputs & Outputs:** Inputs: 99,441 orders, 112,650 items, 99,441 customers. Outputs: 98,666 verified merged records with 0 orphaned keys and 0 duplicate rows.
* **System Design & Implementation Rationale:** *Why are there 99,441 rows in `orders` but only 98,666 in your merged table?*  
  *Answer:* Exactly 775 orders in the raw dataset have no associated items in `olist_order_items_dataset.csv` (orders that were canceled or unavailable before merchant item assignment). An inner join correctly drops these orphaned orders.

---

### Cell 08 [Markdown]: Section 4 Header — Curating the Feature Store
* **Purpose:** Explains the sliding window logic across 5 historical snapshot cohorts.

---

### Cell 09 [CODE #04]: Longitudinal Feature Store Construction Across 5 Cohorts
* **Purpose:** Iterates across 5 quarterly snapshot dates (`2017-06-01`, `2017-09-01`, `2017-12-01`, `2018-03-01`, `2018-06-01`). For each snapshot $T$, isolates past transactions $[T - 180\text{d}, T)$, calculates 21 behavioral features, and evaluates future transactions $[T, T + 90\text{d})$ to create the boolean target `repeat_purchase_next_90d`.
* **Key Code Lines:**
  ```python
  history = cohort_orders[(cohort_orders['order_purchase_timestamp'] >= start_lookback) & 
                          (cohort_orders['order_purchase_timestamp'] < snap_dt)]
  future = cohort_orders[(cohort_orders['order_purchase_timestamp'] >= snap_dt) & 
                         (cohort_orders['order_purchase_timestamp'] < end_outcome)]
  future_repeats = set(future['customer_unique_id'].unique())
  cust_features['repeat_purchase_next_90d'] = cust_features['customer_unique_id'].isin(future_repeats).astype(int)
  ```
* **Why it matters:** Prevents temporal leakage. Past features only see past data; future targets only see future data.
* **Inputs & Outputs:** Output: Curated analytical dataset of **130,914 customer-snapshot rows and 24 columns** saved to `artifacts/curated_customer_snapshots.csv`.
* **System Design & Implementation Rationale:** *Why did you pool multiple snapshot dates instead of just taking one single snapshot?*  
  *Answer:* A single snapshot would introduce severe seasonal bias and limit training data. Creating 5 quarterly snapshot cohorts captures seasonal variation across different quarters and provides 130,914 customer snapshots for robust training and validation.

---

### Cell 10 [Markdown]: Section 5 Header — Missing Values & Feature Matrix Gate
* **Purpose:** Introduces the automated 10-point data validation gate.

---

### Cell 11 [CODE #05]: 10-Point Feature Matrix Validation Gate
* **Purpose:** Executes 10 assertions before modeling: checks shape (130,914 x 24), target prevalence range (0.5% - 2.0%), zero null values, zero infinities, uniqueness of `(customer_unique_id, observation_date)`, exclusion of ID fields from features, schema consistency, valid spend ranges, non-negative recency/tenure, and audit tracking columns.
* **Why it matters:** Acts as a production unit test for data engineering. If any data leakage or null values exist, the script raises an error before modeling begins.
* **Inputs & Outputs:** All 10 checks return `PASS [OK]`.
* **System Design & Implementation Rationale:** *How did you handle missing values in `avg_inter_order_days` and `std_inter_order_days` for one-time buyers?*  
  *Answer:* A customer with only 1 order has no interval between orders. We impute `avg_inter_order_days = 180.0` (the maximum observation window duration, signaling no repeat event) and `std_inter_order_days = 0.0`. This ensures 100% zero-null integrity without dropping records.

---

### Cell 12 [Markdown]: Section 6 Header — Exploratory Data Analysis
* **Purpose:** Outlines the 15 visualization panels structured across 4 composite display figures.

---

### Cell 13 [CODE #06]: EDA Visualizations 1 to 4 (Figures 1–4)
* **Purpose:** Generates a 2x2 grid displaying:
  1. *Customer Population Growth:* Active customers growing from 10,955 (June 2017) to 39,162 (June 2018).
  2. *Distribution of Orders:* Severe right-skew (96.8% have exactly 1 order, plotted on log scale).
  3. *Total Spend Distribution:* Log-normal spend distribution centered around R$ 100 - R$ 150.
  4. *Recency Distribution:* Flat, uniform spread from 0 to 180 days across the lookback window.
* **Output:** Inline high-resolution plot and markdown interpretation.

---

### Cell 14 [Markdown]: Interpretation of Figures 1–4
* **Purpose:** Details business takeaways from Figures 1–4 (rapid platform scaling, extreme one-time purchasing propensity, log-normal spend characteristics).

---

### Cell 15 [CODE #07]: EDA Visualizations 5 to 8 (Figures 5–8)
* **Purpose:** Generates a 2x2 grid displaying:
  5. *Distinct Products & Sellers:* Majority purchase 1 product from 1 seller; high-basket buyers engage multiple sellers.
  6. *Purchasing Momentum:* Scatter of recent 90d spend vs 180d total spend.
  7. *Repeat Rate Trajectory:* Repeat rates steadily range between 0.69% and 0.96% across cohorts.
  8. *Target Class Balance Donut:* Visualizes the 99.1% inactive vs 0.9% repeat imbalance.
* **Output:** Inline high-resolution plot and markdown interpretation.

---

### Cell 16 [Markdown]: Interpretation of Figures 5–8
* **Purpose:** Explains why overall accuracy is completely useless on a 99:1 imbalanced distribution.

---

### Cell 17 [CODE #08]: EDA Visualizations 9 to 11 (Figures 9–11)
* **Purpose:** Generates a 3-panel figure displaying:
  9. *Repeat Rate by State:* Compares repeat rates across Brazilian states with $\ge 500$ buyers (SP, RJ, MG lead).
  10. *Multi-Dimensional RFM:* Recency vs Average Order Value (AOV) colored by repeat outcome.
  11. *Correlation Heatmap:* Pearson correlation matrix across behavioral features (shows high collinearity between `order_count` and `total_items`, motivating regularized modeling).
* **Output:** Inline high-resolution plot.

---

### Cell 18 [Markdown]: Interpretation of Figures 9–11
* **Purpose:** Explains geographic dynamics in Brazilian e-commerce and why freight disparities impact repeat purchase behavior.

---

### Cell 19 [CODE #09]: EDA Visualizations 12 to 15 (Figures 12–15)
* **Purpose:** Generates a 2x2 grid displaying:
  12. *Recency Density by Outcome:* Repeat buyers show substantially lower recency (purchased recently) compared to dormant buyers.
  13. *AOV by Cohort:* Mean AOV remains stable between R$ 150 and R$ 165 over time.
  14. *Zero-Null Summary Table:* Visual certification that all 21 features contain 0 missing values.
  15. *Freight Ratio Boxplot:* High freight-to-spend ratios correlate with higher inactivity risk.
* **Output:** Inline high-resolution plot.

---

### Cell 20 [Markdown]: Interpretation of Figures 12–15
* **Purpose:** Synthesizes the core empirical insights discovered during EDA before modeling begins.

---

### Cell 21 [Markdown]: Section 7 Header — Leakage-Safe Preprocessing
* **Purpose:** Explains the design of Scikit-Learn `ColumnTransformer` and the prevention of data snooping.

---

### Cell 22 [CODE #10]: Chronological Partitions & Pipeline Architecture
* **Purpose:** Partitions data chronologically:
  - **Training Partition** (`2017-06-01`, `2017-09-01`, `2017-12-01`): 56,975 rows (519 repeats, 0.91%).
  - **Validation Partition** (`2018-03-01`): 34,777 rows (287 repeats, 0.83%).
  - **Test Partition** (`2018-06-01`): 39,162 rows (270 repeats, 0.69%).
  Defines `preprocessor = ColumnTransformer(...)` with `StandardScaler` for numeric features and `OneHotEncoder(handle_unknown='ignore')` for state.
* **Key Code Lines:**
  ```python
  preprocessor = ColumnTransformer(
      transformers=[
          ('num', Pipeline([('imputer', SimpleImputer(strategy='median')), ('scaler', StandardScaler())]), num_cols),
          ('cat', Pipeline([('imputer', SimpleImputer(strategy='most_frequent')), 
                            ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))]), cat_cols)
      ]
  )
  ```
* **Why it matters:** Encoding and scaling parameters (mean, std, median) are learned *exclusively* from the training set, eliminating data leakage into validation or test sets.
* **System Design & Implementation Rationale:** *Why did you set `handle_unknown='ignore'` in `OneHotEncoder`?*  
  *Answer:* If an unseen category (e.g., a customer from a new state or invalid postal code) appears in future inference data, `handle_unknown='ignore'` encodes it as all zeros rather than crashing the pipeline with a ValueError.

---

### Cell 23 [Markdown]: Section 9 Header — Model Training & Rolling-Origin Evaluation
* **Purpose:** Explains the rolling-origin cross-validation design and multi-model benchmark.

---

### Cell 24 [CODE #11]: Multi-Model Benchmark Execution & Rolling-Origin CV
* **Purpose:** Benchmarks 7 classification algorithms: Dummy Classifier, Balanced Logistic Regression, Decision Tree, Random Forest, Extra Trees, Gradient Boosting, and HistGradientBoosting. Evaluates each on rolling-origin folds and validation cohort across 8 metrics: PR-AUC, ROC-AUC, Precision, Recall, F1, Balanced Accuracy, Overall Accuracy, and MCC.
* **Outputs:** Generates `artifacts/model_comparison.csv`.
* **System Design & Implementation Rationale:** *What is rolling-origin cross-validation and why is it better than standard K-Fold CV here?*  
  *Answer:* Standard K-Fold CV shuffles rows randomly, allowing the model to train on future records to predict past transactions (temporal data leakage). Rolling-origin CV respects time: Fold 1 trains on June 2017 to validate on Sept 2017; Fold 2 trains on June+Sept 2017 to validate on Dec 2017.

---

### Cell 25 [CODE #12]: Benchmark Visualization (PR-AUC & ROC-AUC)
* **Purpose:** Generates a dual-panel bar plot comparing validation PR-AUC and ROC-AUC across all 7 candidate architectures, highlighting Logistic Regression and Extra Trees as top performers.
* **Output:** High-resolution comparison bar chart.

---

### Cell 26 [Markdown]: Section 10 Header — Hyperparameter Tuning
* **Purpose:** Details the regularization tuning for the winning Logistic Regression architecture.

---

### Cell 27 [CODE #13]: Systematic Hyperparameter Tuning for Logistic Regression
* **Purpose:** Tunes inverse regularization strength $C \in [0.01, 0.05, 0.1, 0.5, 1.0, 5.0]$ using rolling-origin CV. Finalizes the champion pipeline with $C = 1.0$ and `class_weight='balanced'`. Fits the finalized champion on the complete training set (56,975 rows).
* **Key Code Lines:**
  ```python
  champion_pipeline = Pipeline([
      ('prep', preprocessor),
      ('clf', LogisticRegression(C=1.0, class_weight='balanced', solver='lbfgs', max_iter=1000, random_state=RANDOM_STATE))
  ])
  champion_pipeline.fit(train_df[feature_cols], train_df[target_col])
  ```
* **Output:** Champion pipeline fitted and ready for test evaluation.

---

### Cell 28 [Markdown]: Section 11 Header — Final Holdout Test Evaluation
* **Purpose:** Documents the strict freeze of the June 2018 test cohort until this final evaluation step.

---

### Cell 29 [CODE #14]: Final Evaluation on Untouched June 2018 Test Cohort
* **Purpose:** Evaluates the champion pipeline on the untouched held-out test cohort ($N = 39,162$). Computes Confusion Matrix, Precision-Recall Curve, ROC Curve, and classification report. Compares against the Dummy baseline.
* **Outputs:**
  - Base Repeat Rate: **0.6894%**
  - Average Precision (PR-AUC): **0.0117 vs Dummy 0.0069 (1.70x lift)**
  - ROC-AUC: **0.5849**
  - Minority Class Recall: **42.59%** (115 out of 270 returning customers caught)
  - Confusion Matrix: TN=26,802, FP=12,090, FN=155, TP=115.
  - Saves `artifacts/final_test_metrics.json` and `artifacts/holdout_predictions.csv`.
* **System Design & Implementation Rationale:** *Why is precision so low (0.0094) while recall is high (42.59%)?*  
  *Answer:* Because repeat purchase is an extreme 0.69% minority event. Balanced weighting intentionally trades off precision to achieve high recall, ensuring the retention team captures 42.6% of returning buyers rather than missing all of them. For retention campaigns, ranking by probability is far more important than raw binary thresholding.

---

### Cell 30 [Markdown]: The Accuracy Paradox in Imbalanced E-Commerce
* **Purpose:** Theoretical explanation of why naive accuracy is misleading. (A model predicting 100% zeros gets 99.31% accuracy but is completely useless).

---

### Cell 31 [Markdown]: Section 12 Header — Prioritization Policies & Calibration
* **Purpose:** Explains probability calibration and decile capacity constraints.

---

### Cell 32 [CODE #15]: Retention Prioritization Policies & Lift Evaluation
* **Purpose:** Evaluates retention capacity policies: contacting the top 10%, 20%, and 30% highest inactivity risk customers on the test set. Also assesses re-engagement campaigns targeting top repeat propensity.
* **Outputs:**
  - Inactivity outreach at top 20% capacity contacts 7,832 customers, capturing 7,798 inactive buyers (**99.57% concentration**).
  - Re-engagement campaign on top 10% repeat propensity yields **1.63x lift** over random outreach.
* **System Design & Implementation Rationale:** *What does "Lift" mean in your retention evaluation?*  
  *Answer:* Lift measures how much better the model performs compared to random guessing. A lift of 1.63x means the top 10% model-selected group contains 63% more repeat buyers than a randomly selected 10% group.

---

### Cell 33 [CODE #16]: Calibration Reliability Curve & Inactivity Score Distribution
* **Purpose:** Plots the probability calibration reliability curve and histogram of Inactivity Risk Scores on the test cohort with the 80th percentile cutoff marked.
* **Output:** Brier score loss = **0.2279** and high-resolution calibration plots.

---

### Cell 34 [Markdown]: Section 13 Header — Business ROI Scenario Simulator
* **Purpose:** Explains the unit economics and assumptions of targeted customer win-back campaigns.

---

### Cell 35 [CODE #17]: Business Impact & Financial ROI Simulation
* **Purpose:** Simulates a retention campaign under realistic unit economics:
  - Eligible test customers: 39,162
  - Contact capacity: Top 20% highest risk = 7,832 customers
  - Outreach cost: R$ 5.00 per customer = R$ 39,160.00 spend
  - Intervention conversion rate: 5% re-activation
  - Gross margin preserved: R$ 40/month over 3 months = R$ 120 per preserved customer
  - Preserved margin: $389.9 \times \text{R\$} 120 = \text{R\$} 46,788.00$
  - **Net Financial Benefit:** $\text{R\$} 46,788 - \text{R\$} 39,160 = \mathbf{+\text{R\$} 7,628.00}$ (**19.5% ROI**).
* **System Design & Implementation Rationale:** *Is this ROI guaranteed in production?*  
  *Answer:* No. This is a business scenario simulation based on standard e-commerce benchmarks. Actual ROI must be validated via an A/B test with a randomized holdout control group.

---

### Cell 36 [Markdown]: Section 14 Header — Model Explainability & Permutation Importance
* **Purpose:** Explains permutation feature importance and regression coefficient analysis.

---

### Cell 37 [CODE #18]: Permutation Importance & Model Coefficients
* **Purpose:** Computes permutation feature importance on the validation set (`scoring='average_precision'`, `n_repeats=5`, `n_jobs=1`) and extracts standardized regression coefficients from the champion pipeline.
* **Outputs:** Saves `artifacts/feature_importance.csv`. Top 3 drivers: `orders_recent_90d`, `spend_ratio_recent_vs_earlier`, and `order_count`.
* **System Design & Implementation Rationale:** *Why did you use Permutation Importance instead of relying only on regression coefficients?*  
  *Answer:* Permutation importance directly measures the drop in the model's actual evaluation metric (PR-AUC) when a feature's values are randomly shuffled, providing a model-agnostic, non-linear assessment of feature utility.

---

### Cell 38 [CODE #19]: Explainability Visualizations
* **Purpose:** Plots horizontal bar charts of the top 10 permutation importance drivers and top 10 standardized regression coefficients.
* **Output:** High-resolution explainability dual-panel plot.

---

### Cell 39 [Markdown]: Key Behavioral Insights
* **Purpose:** Explains the physical meaning of the discovered feature rankings (velocity matters more than lifetime spend).

---

### Cell 40 [Markdown]: Section 15 Header — Production Prediction Function
* **Purpose:** Outlines the design of the standalone single-customer inference engine.

---

### Cell 41 [CODE #20]: Production-Grade Interactive Inference Engine
* **Purpose:** Implements `predict_customer_inactivity(customer_data, model_pipeline)`: accepts a dictionary or DataFrame, validates schema, predicts probability, computes `inactivity_risk_score = 1 - repeat_prob`, assigns a risk tier (HIGH, MODERATE, LOW), and recommends an action. Demonstrates inference on 3 personas (Persona A: At-Risk Single-Order, Persona B: Active VIP, Persona C: Dormant Buyer).
* **Outputs:**
  - Persona A: Repeat Prob = 0.4232, Inactivity Risk = 0.5768 (MODERATE RISK)
  - Persona B: Repeat Prob = 0.9865, Inactivity Risk = 0.0135 (LOW RISK)
  - Persona C: Repeat Prob = 0.6078, Inactivity Risk = 0.3922 (LOW RISK)
* **System Design & Implementation Rationale:** *Why does your inference function take raw customer statistics rather than pre-scaled numbers?*  
  *Answer:* Because the full `Pipeline` includes the `ColumnTransformer`. Raw data enters the pipeline, which automatically applies the exact median imputation, scaling, and one-hot encoding learned during training, preventing training-serving skew.

---

### Cell 42 [Markdown]: Section 16 Header — Model Serialization & Artifacts
* **Purpose:** Explains persistence, integrity assertions, and Colab packaging.

---

### Cell 43 [CODE #21]: Pipeline Serialization, Verification & 1-Click Packaging
* **Purpose:** Serializes the fitted champion pipeline to `artifacts/churnshield_model.joblib`. Reloads it immediately and asserts `np.allclose(orig_probs, reloaded_probs, atol=1e-8)`. Compiles all 8 artifacts into `churnshield_artifacts.zip` (8.4 MB) and triggers a 1-click Colab browser download.
* **Outputs:** `Assertion Passed: Reloaded pipeline produces 100% bit-for-bit identical outputs.`
* **System Design & Implementation Rationale:** *Why did you save the entire pipeline rather than just the classifier?*  
  *Answer:* If you only save the classifier, you cannot make predictions on new data without manually re-applying identical scaling, imputation, and encoding. Saving the entire pipeline packages preprocessing and estimator together into an atomic, deployment-ready object.

---

### Cell 44 [Markdown]: Section 17 Header — Project Synthesis & Technical Architecture Specifications
* **Purpose:** Comprehensive technical summary and production engineering specifications.

---
"""

def get_part_three():
    return r"""# PART THREE — DATASET AND DATA ENGINEERING

## 1. The Core Olist Tables in Detail

The ChurnShield feature store is constructed by combining three primary relational tables from the Olist repository:

### A. `olist_orders_dataset.csv` (99,441 rows, 8 columns)
* **Primary Key:** `order_id` (Unique string hash representing a specific checkout cart).
* **Foreign Key:** `customer_id` (Links to `olist_customers_dataset.csv`).
* **Key Columns:**
  - `order_id`: Unique identifier for each order.
  - `customer_id`: Transient order-level customer token.
  - `order_status`: Status of the order (`delivered`, `shipped`, `canceled`, `invoiced`, `unavailable`).
  - `order_purchase_timestamp`: Exact timestamp when the order was placed.
  - `order_delivered_customer_date`: Timestamp when the customer received the package.
* **Data Engineering Role:** Establishes the exact chronological order timeline for lookback window filtering and future target labeling.

### B. `olist_customers_dataset.csv` (99,441 rows, 5 columns)
* **Primary Key:** `customer_id` (Transient transaction token).
* **Entity Identifier:** `customer_unique_id` (The true human customer).
* **Key Columns:**
  - `customer_id`: Unique per order.
  - `customer_unique_id`: Unique per individual human across all their lifetime orders.
  - `customer_city`: City name.
  - `customer_state`: Brazilian 2-letter state abbreviation (e.g., SP, RJ, MG).
* **Data Engineering Role:** Maps order-level transactions to the permanent customer entity and provides geographic attributes.

### C. `olist_order_items_dataset.csv` (112,650 rows, 7 columns)
* **Composite Primary Key:** `(order_id, order_item_id)` (An order with 3 items has 3 rows: item 1, item 2, item 3).
* **Foreign Keys:** `order_id` (links to `orders`), `product_id` (links to `products`), `seller_id` (links to `sellers`).
* **Key Columns:**
  - `order_id`: References the parent order.
  - `order_item_id`: Sequential integer (1, 2, 3...) identifying item position within the order.
  - `product_id`: Identifier for the catalog item.
  - `seller_id`: Identifier for the fulfilling merchant seller.
  - `price`: Item purchase price in Brazilian Real (R$).
  - `freight_value`: Shipping and logistics fee charged for this item (R$).
* **Data Engineering Role:** Provides financial transaction values, basket depth, and merchant diversity.

---

## 2. Entity Disambiguation: Why Identity Mapping Matters

A frequent point of failure in e-commerce machine learning is confusing order-level tokens with customer-level entities:

```
[Customer Alice] (customer_unique_id: "alice_perm_hash_123")
      |
      +---> Order 1 (2017-02-10): customer_id: "token_aaa_111"
      |
      +---> Order 2 (2017-08-15): customer_id: "token_bbb_222"
      |
      +---> Order 3 (2018-01-20): customer_id: "token_ccc_333"
```

* If you group by `customer_id`, Alice appears as **3 separate customers**, each with exactly 1 order. Alice would be classified as a one-time buyer three times, and her repeat purchasing behavior would be completely invisible.
* Grouping by `customer_unique_id` connects all 3 orders into Alice's unified longitudinal history, enabling the model to learn from her repeat purchasing pattern.

---

## 3. Order-Item Aggregation: Preventing Row Multiplication

In relational databases, a **one-to-many (1:N)** relationship exists between `orders` and `order_items` because a single customer checkout cart can contain multiple items.

### The Row Multiplication Trap:
* `raw_orders` has 99,441 rows.
* `raw_items` has 112,650 rows.
* If you execute `raw_orders.merge(raw_items, on='order_id')` directly:
  An order containing 4 items produces **4 identical order rows**. If you later calculate customer order frequency by counting rows (`count()`), that customer's order count will be inflated 4x, and their total spend will be calculated incorrectly.

### The ChurnShield Solution (Pre-Aggregation):
In Cell 07 (Code Cell 03), we aggregate `raw_items` to the `order_id` level **before** joining:
```python
items_agg = raw_items.groupby('order_id').agg(
    total_price=('price', 'sum'),
    total_freight=('freight_value', 'sum'),
    total_items=('order_item_id', 'count'),
    distinct_products=('product_id', 'nunique'),
    distinct_sellers=('seller_id', 'nunique')
).reset_index()
```
This reduces `raw_items` to exactly 98,666 distinct `order_id` rows. Joining `orders` with `items_agg` yields a strictly 1:1 merged table with zero row multiplication.

---

## 4. Missing-Value Handling Strategy

Rather than blindly dropping rows with missing values (`dropna()`), which discards valid commercial data, ChurnShield implements a domain-informed missing-value strategy:

1. **Orphaned Orders (775 rows):** Orders in `olist_orders_dataset.csv` with zero associated items in `olist_order_items_dataset.csv` represent canceled or unavailable orders prior to merchant assignment. Dropped via an `inner` join.
2. **Inter-Order Interval Features (`avg_inter_order_days`, `std_inter_order_days`):** For one-time buyers (who represent 96.8% of the customer base), the mathematical interval between orders is undefined. 
   - Instead of leaving `NaN` or imputing 0 (which would falsely imply they placed multiple orders on the same day), we assign `avg_inter_order_days = 180.0` (the maximum duration of the observation window, indicating no repeat purchase occurred) and `std_inter_order_days = 0.0`.
3. **Spend and Order Ratios (`order_ratio_recent_vs_earlier`, `spend_ratio_recent_vs_earlier`):** For customers with zero orders in the earlier 90-day subwindow, dividing by earlier spend would produce division-by-zero (`inf` or `NaN`). We replace zero denominators with 0.0, representing that 100% of their activity was concentrated in the recent window.
4. **Pipeline Imputation Gate:** Inside the Scikit-Learn `ColumnTransformer`, numerical features pass through `SimpleImputer(strategy='median')` and categorical features pass through `SimpleImputer(strategy='most_frequent')`. This guarantees that if future production data contains unexpected nulls, the pipeline processes them gracefully without crashing.

---
"""

if __name__ == "__main__":
    print("Parts 1-3 loaded successfully.")
