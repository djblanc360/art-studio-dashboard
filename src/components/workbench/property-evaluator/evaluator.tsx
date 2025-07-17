'use client';

import { useState, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Loader2, Download, AlertCircle, ArrowRight,DollarSign,Users,TrendingUp,Target,PiggyBank} from 'lucide-react';
import type { CollectorSubmission, CollectorWithWealth, ProcessingResults,CsvData} from '~/integrations/rentcast/types';

import { evaluateCollectors } from '~/integrations/rentcast/service';
import { FileUploader } from './file-uploader';

import { useQuery } from '@tanstack/react-query';

type EvaluatorState = {
  isProcessing: boolean;
  progress: { current: number; total: number; currentCollector: string } | null;
  results: ProcessingResults | null;
  error: string | null;
};

// Removed EvaluatorProps - component now uses useQuery

export default function PropertyEvaluator() {
  const [state, setState] = useState<EvaluatorState>({
    isProcessing: false,
    progress: null,
    results: null,
    error: null,
  });

  const [csvData, setCsvData] = useState<CollectorSubmission[]>([]);
  const [csvFile, setCsvFile] = useState<{ name: string; data: CollectorSubmission[] } | null>(null);

  /**
   * Handle CSV file upload
   */
  const handleFileUpload = useCallback((data: CollectorSubmission[], fileName: string) => {
    setCsvFile({ name: fileName, data });
    setCsvData(data);
    setState(prev => ({ 
      ...prev, 
      error: null,
      results: null 
    }));
  }, []);

  /**
   * Use useQuery to process collectors
   */
  const {
    data: results,
    isLoading: isProcessing,
    error: queryError,
    refetch: processCollectors,
  } = useQuery({
    queryKey: ['evaluateCollectors', csvData],
    queryFn: async () => {
      if (csvData.length === 0) {
        throw new Error('No CSV data to process');
      }

      setState(prev => ({ 
        ...prev, 
        progress: { current: 0, total: csvData.length, currentCollector: 'Starting evaluation...' }
      }));

      const results = await evaluateCollectors({
        data: {
          collectors: csvData,
        }
      });

      setState(prev => ({ 
        ...prev, 
        progress: null,
        results,
      }));

      return results;
    },
    enabled: false, // Only run when explicitly triggered
  });

  /**
   * Download enriched CSV using Papaparse
   */
  const downloadEnrichedCSV = useCallback(() => {
    if (!results?.enrichedCSV) return;

    const blob = new Blob([results.enrichedCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const baseFileName = csvFile?.name.replace('.csv', '') || 'collectors';
    link.download = `${baseFileName}_with_property_scores_${new Date().toISOString().split('T')[0]}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results, csvFile]);

  /**
   * Reset component state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      progress: null,
      results: null,
      error: null,
    });
    setCsvData([]);
    setCsvFile(null);
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader> 
          <CardTitle className="flex items-center text-2xl">
            <PiggyBank className="mr-3 h-6 w-6 text-pink-500" />
            Collector Property Evaluator
          </CardTitle>
          <CardDescription>
            Upload your collector submissions CSV to assess wealth scores and prioritize high-value collectors for product drops.
            Supports US property owners only (apartments, P.O. boxes, and non-US addresses are automatically filtered out).
          </CardDescription>
        </CardHeader>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Collector Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader 
            onFileProcessed={handleFileUpload}
            id="collector-csv"
            title="Collector CSV File"
            disabled={isProcessing}
          />
          {csvFile && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Loaded:</strong> {csvFile.name} ({csvFile.data.length} collector submissions)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Ready to evaluate property values
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {queryError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processing Error</AlertTitle>
          <AlertDescription>{queryError instanceof Error ? queryError.message : 'Unknown error'}</AlertDescription>
        </Alert>
      )}

      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle>2. Evaluate Collector Wealth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => processCollectors()}
              disabled={csvData.length === 0 || isProcessing}
              size="lg"
              className="flex-1 max-w-xs"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-5 w-5" />
                  Start Evaluation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <Button
              onClick={reset}
              disabled={isProcessing}
              variant="outline"
            >
              Reset
            </Button>
          </div>

          {/* Progress Display */}
          {state.progress && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Evaluating: {state.progress.currentCollector}</span>
                <span>{state.progress.current} / {state.progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${(state.progress.current / state.progress.total) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">
                    {Math.round((state.progress.current / state.progress.total) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Processing property values and rent estimates to calculate wealth scores...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Display */}
      {results && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>3. Wealth Assessment Results</CardTitle>
                <CardDescription>
                  Collector wealth scores calculated for {results.allCollectors.length} submissions
                </CardDescription>
              </div>
              <Button onClick={downloadEnrichedCSV} className="mt-4 sm:mt-0">
                <Download className="mr-2 h-4 w-4" />
                Download Enhanced CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                    {results.report.topTierPercentage}
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Rich ($1.5M+)</div>
              </div>
              {/* <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                    {state.results.report.high}
                  </div>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">High ($500K+)</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">
                    {state.results.report.mid}
                  </div>
                  <Target className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Mid ($250K+)</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-800 dark:text-gray-300">
                    {state.results.report.poor}
                  </div>
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Poor (&lt;$250K)</div>
              </div> */}
            </div>

            {/* Processing Stats */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Processing Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Valid Addresses:</span>
                  <div className="font-semibold">{results.validCollectorCount}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Filtered Out:</span>
                  <div className="font-semibold">{results.filteredOutCount}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Avg Wealth Score:</span>
                  <div className="font-semibold">${Math.round(results.report.avgWealthScore).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Top Tier:</span>
                  <div className="font-semibold">{results.report.topTierPercentage}%</div>
                </div>
              </div>
            </div>

            {/* Top Collectors Preview */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Priority Collectors for Targeting: {results.priorityCollectors.length}
              </h4>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collector</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Wealth Score</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Property Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.priorityCollectors.slice(0, 10).map((collector, index) => (
                      <TableRow key={collector.email} className={index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900/50'}>
                        <TableCell className="font-medium">
                          {collector.firstName} {collector.lastName}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {collector.city}, {collector.state}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${collector.wealthScore.toLocaleString()}
                        </TableCell>
                        {/* <TableCell>
                          <span className={cn(
                            "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                            collector.wealthCategory === 'Rich' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                            collector.wealthCategory === 'High' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                            collector.wealthCategory === 'Mid' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          )}>
                            {collector.wealthCategory}
                          </span>
                        </TableCell> */}
                        <TableCell className="text-sm">
                          {collector.propertyType}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {results.priorityCollectors.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing top 10 of {results.priorityCollectors.length} priority collectors. 
                  Download full CSV for complete data.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}