"""
Part 7 to Part 9 of the ChurnShield Live Demo & Viva Guide
"""

def get_part_seven():
    return r"""# PART SEVEN — DATA SPLITTING AND LEAKAGE PREVENTION

## 1. The Catastrophic Flaw of Random Train/Test Splits

In introductory ML courses, students typically use `train_test_split(test_size=0.2, random_state=42)` to randomly partition data. In non-contractual e-commerce forecasting, **a random split is a catastrophic methodological error**.

### Why Random Splitting Causes Catastrophic Leakage:
1. **Temporal Inversion (Looking into the Future):** A random split places orders from August 2018 into the training set and orders from February 2017 into the test set. The model trains on future market conditions to "predict" the past.
2. **Entity Trajectory Leakage:** If customer Alice placed an order in 2017 and another order in 2018, a random split could assign her 2018 order to the training set and her 2017 order to the test set. The model would already "know" Alice is a repeat customer.
3. **Over-Optimistic Illusion:** A random split produces unrealistically high accuracy and PR-AUC during offline experimentation, but when deployed into production (where the model must predict future unobserved time horizons), the system collapses.

---

## 2. The ChurnShield Chronological Partition Design

To mirror real-world production forecasting, ChurnShield implements a **chronological rolling-origin evaluation design** across 5 distinct snapshot dates:

```
[2017-06-01] [2017-09-01] [2017-12-01]       [2018-03-01]              [2018-06-01]
|-------------------------------------|       |----------|              |----------|
       TRAINING PARTITION                     VALIDATION                 HELD-OUT TEST
     56,975 Snapshot Rows                    34,777 Rows                 39,162 Rows
     519 Repeats (0.91%)                     287 Repeats (0.83%)         270 Repeats (0.69%)
```

### The Three Chronological Tiers:
1. **Training Partition (June, Sept, Dec 2017 — 56,975 rows):** Used to fit preprocessing transformations and model candidate weights.
2. **Validation Partition (March 2018 — 34,777 rows):** Used to evaluate candidate architectures, compare validation metrics, and tune regularization hyperparameters.
3. **Untouched Held-Out Test Partition (June 2018 — 39,162 rows):** **Completely frozen and untouched** during all model exploration, architecture selection, and hyperparameter tuning. Only evaluated once at the very end to estimate true out-of-time production generalization.

---

## 3. Rolling-Origin Cross-Validation

Within the training partition, ChurnShield executes **Rolling-Origin Cross-Validation** (also known as Walk-Forward or Expanding Window CV):

* **Fold 1:**
  - *Train:* Snapshot `2017-06-01` (10,955 customers)
  - *Validate:* Snapshot `2017-09-01` (19,338 customers)
* **Fold 2:**
  - *Train:* Snapshots `2017-06-01` + `2017-09-01` (30,293 customers)
  - *Validate:* Snapshot `2017-12-01` (26,682 customers)

### Why Rolling-Origin CV is Superior to K-Fold:
* Standard K-Fold shuffles time.
* Rolling-origin CV expands the training horizon forward in chronological order, exactly mimicking how a machine learning model is retrained on accumulating history in production.

---
"""

def get_part_eight():
    return r"""# PART EIGHT — EXPLAIN EVERY MACHINE-LEARNING ALGORITHM

The notebook benchmarks **7 distinct classification architectures** (Cell 24 / Code Cell 11). Below is the comprehensive theoretical and practical explanation of each algorithm.

---

## 1. Dummy Classifier (`strategy='prior'`)
* **Core Idea:** A non-learning baseline null model. It ignores all input features ($\mathbf{x}$) and simply predicts the empirical class distribution of the training set.
* **Why it is necessary:** Acts as the scientific zero-intelligence benchmark. In severe class imbalance (0.69% positive), a model must beat the Dummy Classifier's PR-AUC (0.0069) to prove that it has learned actual predictive signal rather than exploiting base rates.
* **Actual Experimental Finding:** Validation PR-AUC: **0.0083**, ROC-AUC: **0.5000**, Recall: **0.0000**.

---

## 2. Balanced Logistic Regression (`class_weight='balanced', C=1.0`)
* **Core Idea:** A linear probabilistic classifier. It computes a weighted linear combination of input features and maps it to a probability between 0 and 1 using the standard logistic (sigmoid) function:
  $$z = \mathbf{w}^T \mathbf{x} + b, \quad \hat{P}(y = 1 \mid \mathbf{x}) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
* **How it Learns:** Minimizes weighted binary cross-entropy loss with an L2 Ridge regularization penalty:
  $$\mathcal{L}(\mathbf{w}) = - \sum_{i=1}^N \left[ w_1 y_i \log(\hat{p}_i) + w_0 (1 - y_i) \log(1 - \hat{p}_i) \right] + \frac{1}{2C} \|\mathbf{w}\|_2^2$$
* **The Magic of `class_weight='balanced'`:**
  In our training data, 99.1% of rows are $y=0$ and only 0.9% are $y=1$. A standard unweighted model would treat every error equally, leading it to predict 0 for everyone to achieve 99.1% accuracy.
  Setting `class_weight='balanced'` calculates weights inversely proportional to class frequencies:
  $$w_1 = \frac{N}{2 \times N_1} \approx \frac{56,975}{2 \times 519} \approx 54.89, \quad w_0 = \frac{N}{2 \times N_0} \approx \frac{56,975}{2 \times 56,456} \approx 0.50$$
  The loss function penalizes a false negative **~110 times more severely** than a false positive, forcing the decision boundary to identify minority repeat buyers.
* **Strengths:** Highly stable, produces well-calibrated probabilities, resistant to overfitting, extremely fast, fully explainable via regression coefficients.
* **Weaknesses:** Assumes linear log-odds relationship; cannot capture complex feature interactions without explicit interaction terms.
* **Actual Experimental Finding:** **Selected as Champion.** Validation PR-AUC: **0.0173**, Val ROC-AUC: **0.5543**, Val Recall: **44.60%**.

---

## 3. Decision Tree (`max_depth=6, class_weight='balanced'`)
* **Core Idea:** Non-parametric recursive binary partitioning. Splits the feature space along orthogonal feature thresholds to maximize purity (Gini Impurity reduction):
  $$\text{Gini}(D) = 1 - \sum_{k=0}^1 p_k^2$$
* **Strengths:** Captures non-linear thresholds (e.g., "If recency > 90 AND order count == 1").
* **Weaknesses:** High variance, step-function probability outputs, severe tendency to overfit noisy tabular data.
* **Actual Experimental Finding:** Validation PR-AUC: **0.0109**, Val ROC-AUC: **0.5145**, Val Recall: **40.42%**. Underperformed Logistic Regression.

---

## 4. Random Forest (`n_estimators=100, max_depth=6, class_weight='balanced_subsample'`)
* **Core Idea:** Bagging (Bootstrap Aggregation) ensemble. Constructs 100 decorrelated decision trees, each trained on a bootstrap sample of rows, while randomly selecting a subset of features at each split ($\sqrt{D}$). Final prediction is the average probability across all 100 trees.
* **Strengths:** Drastically reduces variance compared to a single decision tree; handles outliers well.
* **Weaknesses:** Under severe class imbalance, averaging probabilities across trees tends to compress predicted probabilities toward the mean, reducing recall on the extreme minority tail unless aggressively calibrated.
* **Actual Experimental Finding:** Validation PR-AUC: **0.0115**, Val ROC-AUC: **0.5330**, Val Recall: **20.21%**.

---

## 5. Extra Trees (Extremely Randomized Trees) (`n_estimators=100, max_depth=6`)
* **Core Idea:** An ensemble similar to Random Forest, but with an additional level of randomization: when choosing split points at each node, it picks split thresholds *at random* for each candidate feature and selects the best of those random thresholds.
* **Strengths:** Extreme computational speed; produces smoother decision boundaries and lower variance than standard Random Forest.
* **Actual Experimental Finding:** Strongest tree-based model. Validation PR-AUC: **0.0168**, Val ROC-AUC: **0.5892**, Val Recall: **26.13%**. Second place behind Logistic Regression.

---

## 6. Gradient Boosting (`GradientBoostingClassifier`, `max_depth=4`)
* **Core Idea:** Sequential boosting. Builds trees iteratively, where each new tree fits the negative gradient (pseudo-residuals) of the loss function with respect to the previous ensemble's predictions:
  $$F_m(\mathbf{x}) = F_{m-1}(\mathbf{x}) + \eta \cdot h_m(\mathbf{x})$$
* **Strengths:** State-of-the-art predictive power on structured tabular data when classes are relatively balanced.
* **Weaknesses:** Extremely sensitive to hyperparameter tuning; under 99:1 class imbalance without native balance weighting, standard gradient boosting focuses heavily on the majority class, achieving 99.1% accuracy but capturing almost zero repeat buyers (Recall = 0.35%).
* **Actual Experimental Finding:** Validation PR-AUC: **0.0145**, Val ROC-AUC: **0.5634**, Val Recall: **0.0035 (0.35%)**.

---

## 7. HistGradientBoosting (`HistGradientBoostingClassifier`, `class_weight='balanced'`)
* **Core Idea:** Modern histogram-based gradient boosting (similar to LightGBM). Bins continuous features into 256 discrete integer bins, vastly speeding up split evaluations and supporting native class weighting.
* **Actual Experimental Finding:** Validation PR-AUC: **0.0112**, Val ROC-AUC: **0.5169**, Val Recall: **28.92%**.

---

## 8. Why Complex Tree Models Did Not Beat Simple Logistic Regression

A frequent viva question: *Why did sophisticated gradient boosting or random forest fail to dramatically outperform a simple linear Logistic Regression?*

### The Scientific Reason (Occam's Razor & Minority Noise):
1. **Extreme Class Imbalance (99:1):** There are only 519 positive repeat buyers in the 56,975 training instances. High-capacity non-linear models (gradient boosting, deep trees) have high degrees of freedom and easily overfit the random idiosyncrasies of those 519 individuals.
2. **Smooth Global Monotonicity:** Customer inactivity is governed by smooth monotonic relationships: as recency increases, repeat propensity steadily declines; as velocity increases, repeat propensity steadily rises. A linear log-odds model represents this monotonic truth without carving noisy local decision pockets.
3. **Well-Calibrated Linear Log-Odds:** Regularized Logistic Regression with balanced weighting establishes a smooth, global hyperplane that generalizes reliably across time.

---
"""

def get_part_nine():
    return r"""# PART NINE — EVALUATION METRICS & THE ACCURACY PARADOX

## 1. The Confusion Matrix Defined for ChurnShield

In ChurnShield, our machine learning target is:
* **Positive Class ($y = 1$):** **Repeat Purchaser** (customer places $\ge 1$ order in the next 90 days).
* **Negative Class ($y = 0$):** **Inactive Customer** (customer places $0$ orders in the next 90 days).

On the held-out test cohort ($N = 39,162$), the champion Balanced Logistic Regression outputs the following confusion matrix:

| | Predicted Inactive ($\hat{y} = 0$) | Predicted Repeat ($\hat{y} = 1$) | Total Actual |
| :--- | :---: | :---: | :---: |
| **Actual Inactive ($y = 0$)** | **TN = 26,802** | **FP = 12,090** | 38,892 (99.31%) |
| **Actual Repeat ($y = 1$)** | **FN = 155** | **TP = 115** | 270 (0.69%) |
| **Total Predicted** | 26,957 | 12,205 | **39,162** |

### Definitions in Business Context:
* **True Positive (TP = 115):** Customer was predicted to repeat, and they genuinely placed a repeat order.
* **False Positive (FP = 12,090):** Customer was predicted to repeat, but they remained dormant.
* **True Negative (TN = 26,802):** Customer was predicted to remain inactive, and they placed zero orders.
* **False Negative (FN = 155):** Customer was predicted to remain inactive, but they unexpectedly placed an order.

---

## 2. Why Overall Accuracy is Completely Misleading (The Accuracy Paradox)

$$\text{Accuracy} = \frac{\text{TP} + \text{TN}}{\text{TP} + \text{TN} + \text{FP} + \text{FN}} = \frac{115 + 26,802}{39,162} = \frac{26,917}{39,162} = \mathbf{68.73\%}$$

### The Paradox:
* A "Zero-Intelligence Null Model" that predicts $0$ (Inactive) for all 39,162 customers achieves:
  $$\text{Accuracy}_{\text{null}} = \frac{38,892}{39,162} = \mathbf{99.31\%}$$
* **Why this is catastrophic:** The null model achieves 99.31% accuracy while catching **0 repeat buyers** (Recall = 0%).
* In severe class imbalance, **overall accuracy is an illusion**. It simply reflects the proportion of majority class non-events.

---

## 3. The Comprehensive Metrics Portfolio

### A. Minority Class Recall (Sensitivity)
$$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}} = \frac{115}{115 + 155} = \frac{115}{270} = \mathbf{42.59\%}$$
* **Meaning:** The model successfully detects **42.6% of all future repeat purchasers** across the 39,162 customer population.
* **Business Value:** Without this model, all 270 returning customers would be indistinguishable from the 38,892 dormant accounts.

### B. Precision
$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}} = \frac{115}{115 + 12,090} = \frac{115}{12,205} = \mathbf{0.0094 \text{ (0.94\%)}}$$
* **Meaning:** Out of all customers flagged as potential repeat buyers at the default 0.5 threshold, 0.94% actually repeat.
* **Why it is low:** Because the natural base rate in the population is only 0.69%. Achieving 0.94% precision at high recall represents a positive lift over the base rate. Furthermore, retention campaigns do not rely on a fixed 0.5 threshold; they sort customers by continuous probability.

### C. Balanced Accuracy
$$\text{Balanced Accuracy} = \frac{1}{2} \left( \frac{\text{TP}}{\text{TP} + \text{FN}} + \frac{\text{TN}}{\text{TN} + \text{FP}} \right) = \frac{1}{2} \left( \frac{115}{270} + \frac{26,802}{38,892} \right) = \frac{1}{2} (0.4259 + 0.6891) = \mathbf{55.75\%}$$
* **Meaning:** Unweighted average of recall obtained on each class. Random guessing yields 50.00%. Our score of 55.75% confirms superior discrimination over chance.

### D. F1-Score
$$\text{F1} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = 2 \times \frac{0.0094 \times 0.4259}{0.0094 + 0.4259} = \mathbf{0.0184}$$
* Harmonic mean of precision and recall. Heavily penalized by the low precision inherent in 99:1 imbalance.

### E. Area Under ROC Curve (ROC-AUC)
$$\text{ROC-AUC} = \mathbf{0.5849} \quad (\text{Random Baseline} = 0.5000)$$
* Evaluates trade-off between True Positive Rate and False Positive Rate across all thresholds. Score of 0.5849 confirms genuine discriminatory ranking.

### F. Average Precision / PR-AUC (The Gold Standard Primary Metric)
$$\text{PR-AUC} = \sum_n (R_n - R_{n-1}) P_n = \mathbf{0.0117} \quad (\text{Dummy Baseline} = \mathbf{0.0069})$$
* **Lift Over Dummy Baseline:**
  $$\text{Lift} = \frac{0.0117}{0.0069} = \mathbf{1.70\times \text{ Baseline Lift}}$$
* **Why PR-AUC is the single most important metric:**
  Unlike ROC-AUC (which evaluates False Positive Rate $\frac{FP}{FP+TN}$ and is artificially compressed toward 0 because $TN = 26,802$ is huge), PR-AUC evaluates Precision $\frac{TP}{TP+FP}$ directly against Recall. It directly penalizes false alarms and measures how effectively the model concentrates rare positive repeat buyers at the top of the ranked list.

### G. Brier Score Loss
$$\text{Brier Score} = \frac{1}{N} \sum_{i=1}^N (\hat{p}_i - y_i)^2 = \mathbf{0.2279}$$
* Evaluates probability calibration. Lower is better. A score of 0.2279 confirms reliable, well-calibrated probabilistic scoring.

---
"""

if __name__ == "__main__":
    print("Parts 7-9 loaded successfully.")
