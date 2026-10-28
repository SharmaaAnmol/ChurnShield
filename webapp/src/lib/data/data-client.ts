import Papa from 'papaparse';
import {
  EvaluationMetricsSchema,
  ModelSummarySchema,
  FeatureImportanceListSchema,
  CustomerPredictionCsvRowSchema,
} from './schemas';
import {
  adaptEvaluationMetrics,
  adaptModelSummary,
  adaptFeatureImportance,
  adaptCustomerPrediction,
  buildDashboardSummary,
} from './data-adapter';
import {
  EvaluationMetrics,
  ModelSummary,
  FeatureImportanceItem,
  CustomerPrediction,
  DashboardSummary,
} from './types';

export type LoadStatus<T> =
  | { status: 'success'; data: T; error?: null }
  | { status: 'missing'; data: null; error: string; missingFile: string }
  | { status: 'error'; data: null; error: string; missingFile?: string };

const BASE_DATA_PATH = '/data';

/**
 * Fetch and parse a JSON resource with fallback handling
 */
async function fetchJsonResource<T>(
  filename: string,
  validator?: (data: any) => boolean
): Promise<LoadStatus<any>> {
  try {
    const response = await fetch(`${BASE_DATA_PATH}/${filename}`);
    if (response.status === 404) {
      return {
        status: 'missing',
        data: null,
        error: `Data file "${filename}" was not found in the public data directory.`,
        missingFile: filename,
      };
    }
    if (!response.ok) {
      return {
        status: 'error',
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        missingFile: filename,
      };
    }

    const json = await response.json();
    if (validator && !validator(json)) {
      return {
        status: 'error',
        data: null,
        error: `File "${filename}" does not conform to the expected schema.`,
        missingFile: filename,
      };
    }

    return { status: 'success', data: json };
  } catch (err: any) {
    return {
      status: 'error',
      data: null,
      error: err?.message || `Failed to fetch "${filename}".`,
      missingFile: filename,
    };
  }
}

/**
 * Fetch and parse CSV resource using PapaParse
 */
async function fetchCsvResource(filename: string): Promise<LoadStatus<any[]>> {
  try {
    const response = await fetch(`${BASE_DATA_PATH}/${filename}`);
    if (response.status === 404) {
      return {
        status: 'missing',
        data: null,
        error: `CSV file "${filename}" was not found in public/data directory.`,
        missingFile: filename,
      };
    }
    if (!response.ok) {
      return {
        status: 'error',
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`,
        missingFile: filename,
      };
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      return {
        status: 'missing',
        data: null,
        error: `CSV file "${filename}" is empty.`,
        missingFile: filename,
      };
    }

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0 && results.data.length === 0) {
            resolve({
              status: 'error',
              data: null,
              error: `CSV parse error in "${filename}": ${results.errors[0]?.message || 'Unknown parse error'}`,
              missingFile: filename,
            });
          } else {
            resolve({ status: 'success', data: results.data });
          }
        },
        error: (error: any) => {
          resolve({
            status: 'error',
            data: null,
            error: error?.message || `Failed to parse "${filename}".`,
            missingFile: filename,
          });
        },
      });
    });
  } catch (err: any) {
    return {
      status: 'error',
      data: null,
      error: err?.message || `Failed to fetch "${filename}".`,
      missingFile: filename,
    };
  }
}

/**
 * Load Evaluation Metrics
 */
export async function loadEvaluationMetrics(): Promise<LoadStatus<EvaluationMetrics>> {
  const res = await fetchJsonResource('evaluation_metrics.json');
  if (res.status !== 'success') return res;

  const parsed = EvaluationMetricsSchema.safeParse(res.data);
  if (!parsed.success) {
    console.warn('EvaluationMetrics schema warnings:', parsed.error);
  }

  return {
    status: 'success',
    data: adaptEvaluationMetrics(res.data),
  };
}

/**
 * Load Model Summary Metadata
 */
export async function loadModelSummary(): Promise<LoadStatus<ModelSummary>> {
  const res = await fetchJsonResource('model_summary.json');
  if (res.status !== 'success') return res;

  const parsed = ModelSummarySchema.safeParse(res.data);
  if (!parsed.success) {
    console.warn('ModelSummary schema warnings:', parsed.error);
  }

  return {
    status: 'success',
    data: adaptModelSummary(res.data),
  };
}

/**
 * Load Feature Importance (tries JSON first, falls back to CSV)
 */
export async function loadFeatureImportance(): Promise<LoadStatus<FeatureImportanceItem[]>> {
  const jsonRes = await fetchJsonResource('feature_importance.json');
  if (jsonRes.status === 'success' && Array.isArray(jsonRes.data)) {
    return {
      status: 'success',
      data: adaptFeatureImportance(jsonRes.data),
    };
  }

  // Fallback to CSV
  const csvRes = await fetchCsvResource('feature_importance.csv');
  if (csvRes.status === 'success' && Array.isArray(csvRes.data)) {
    return {
      status: 'success',
      data: adaptFeatureImportance(csvRes.data),
    };
  }

  return {
    status: 'missing',
    data: null,
    error: 'Neither "feature_importance.json" nor "feature_importance.csv" was found in public/data.',
    missingFile: 'feature_importance.json / feature_importance.csv',
  };
}

/**
 * Load Customer Predictions CSV
 */
export async function loadCustomerPredictions(): Promise<LoadStatus<CustomerPrediction[]>> {
  const res = await fetchCsvResource('customer_predictions.csv');
  if (res.status !== 'success') return res;

  const validated: CustomerPrediction[] = [];
  for (const row of res.data) {
    if (!row || !row.customer_unique_id) continue;
    validated.push(adaptCustomerPrediction(row));
  }

  if (validated.length === 0) {
    return {
      status: 'missing',
      data: null,
      error: 'customer_predictions.csv contained no valid customer records.',
      missingFile: 'customer_predictions.csv',
    };
  }

  return {
    status: 'success',
    data: validated,
  };
}

/**
 * Master Data Loader for Dashboard Overview
 */
export async function loadDashboardData(): Promise<{
  summary: LoadStatus<DashboardSummary>;
  metrics: LoadStatus<EvaluationMetrics>;
  model: LoadStatus<ModelSummary>;
  customers: LoadStatus<CustomerPrediction[]>;
  features: LoadStatus<FeatureImportanceItem[]>;
}> {
  const [metricsRes, modelRes, customersRes, featuresRes] = await Promise.all([
    loadEvaluationMetrics(),
    loadModelSummary(),
    loadCustomerPredictions(),
    loadFeatureImportance(),
  ]);

  let summaryStatus: LoadStatus<DashboardSummary>;

  if (metricsRes.status === 'success' || modelRes.status === 'success' || customersRes.status === 'success') {
    const summary = buildDashboardSummary(
      metricsRes.data,
      modelRes.data,
      customersRes.data || []
    );
    if (summary) {
      summaryStatus = { status: 'success', data: summary };
    } else {
      summaryStatus = {
        status: 'missing',
        data: null,
        error: 'Unable to derive dashboard summary from available files.',
        missingFile: 'dashboard_summary.json',
      };
    }
  } else {
    summaryStatus = {
      status: 'missing',
      data: null,
      error: 'No data exports found. Run the ChurnShield export script or notebook.',
      missingFile: 'dashboard_summary.json',
    };
  }

  return {
    summary: summaryStatus,
    metrics: metricsRes,
    model: modelRes,
    customers: customersRes,
    features: featuresRes,
  };
}
