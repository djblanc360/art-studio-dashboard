'use client';

import { useState, useCallback } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '~/components/ui/tooltip';
import { Loader2, Download, AlertCircle, ArrowRight,DollarSign,Users,TrendingUp,Target,PiggyBank, Type, Info} from 'lucide-react';
import type { CollectorSubmission, CollectorWithWealth, ProcessingResults,CsvData} from '~/integrations/rentcast/types';

import { evaluateCollectors, generateCollectorCSV } from '~/integrations/rentcast/service';
import { FileUploader } from './file-uploader';

import { useQuery } from '@tanstack/react-query';
import { Switch } from '~/components/ui/switch';

import { Label } from '~/components/ui/label';
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
  const [showSnapshot, setShowSnapshot] = useState(false);
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

      // Remove progress tracking since server function can't update it
      const results = await evaluateCollectors({
        data: {
          collectors: csvData,
          showSnapshot,
        }
      });

      return results;
    },
    enabled: false,
  });

  /**
   * Download enriched CSV using streaming backend endpoint
   */
  const downloadEnrichedCSV = useCallback(async () => {
    if (!results?.allCollectors) return;

    try {
      const isSnapshot = results.isSnapshot;
      const baseFileName = csvFile?.name.replace('.csv', '') || 'collectors';
      const dateStamp = new Date().toISOString().split('T')[0];
      
      // Determine filename based on mode
      const filename = isSnapshot 
        ? `${baseFileName}_filtered_snapshot_${dateStamp}.csv`
        : `${baseFileName}_with_property_scores_${dateStamp}.csv`;

      if (results.allCollectors.length > 100 && !isSnapshot) {
        // Use streaming for large non-snapshot datasets
        const csvContent = await generateCollectorCSV({
          data: { collectors: results.allCollectors }
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // For smaller datasets or snapshots, use the existing CSV content
        if (results.enrichedCSV && results.enrichedCSV.length > 200) {
          const blob = new Blob([results.enrichedCSV], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          const mode = isSnapshot ? 'snapshot' : 'evaluation';
          console.log(`✅ ${mode} CSV download completed`);
        }
      }
    } catch (error) {
      console.error('❌ CSV download failed:', error);
    }
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

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-start">
                <Label htmlFor="full-chars-switch" className="flex items-center gap-2">
                  Show Filtering Snapshot 
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Display detailed breakdown of which addresses were filtered out during processing</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Switch
                  id="full-chars-switch"
                  className="ml-2"
                  checked={showSnapshot}
                  onCheckedChange={(c) => setShowSnapshot(c)}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Note: will not run scraping API calls if this is enabled.</p>
              </div>
            </div>

          </div>

          

          {/* Progress Display */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing {csvData.length} collectors through RentCast API...</span>
              </div>
              <p className="text-xs text-gray-500">
                This may take a few minutes for large datasets. Please wait...
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
                <CardTitle>
                  3. {results.isSnapshot ? 'Filtering Analysis Results' : 'Wealth Assessment Results'}
                </CardTitle>
                <CardDescription>
                  {results.isSnapshot 
                    ? `Filtering breakdown for ${results.allCollectors.length + results.filteredOutCount} collector submissions` 
                    : `Collector wealth scores calculated for ${results.allCollectors.length} submissions`
                  }
                </CardDescription>
              </div>
              <Button onClick={downloadEnrichedCSV} className="mt-4 sm:mt-0">
                <Download className="mr-2 h-4 w-4" />
                {results.isSnapshot ? 'Download Filtered List' : 'Download Enhanced CSV'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Snapshot Filtering Details */}
            {results.isSnapshot && results.detailedFilterStats && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Filtering Overview
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 dark:text-blue-400">Total Submissions:</span>
                      <div className="font-bold text-lg">{results.detailedFilterStats.originalCount}</div>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Valid Collectors:</span>
                      <div className="font-bold text-lg text-green-700 dark:text-green-300">{results.detailedFilterStats.validCount}</div>
                    </div>
                    <div>
                      <span className="text-red-600 dark:text-red-400">Filtered Out:</span>
                      <div className="font-bold text-lg text-red-700 dark:text-red-300">{results.detailedFilterStats.removedCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Removal Rate:</span>
                      <div className="font-bold text-lg">{results.detailedFilterStats.removalPercentage}%</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Filtering Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {results.detailedFilterStats.summary.incompleteCount > 0 && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400">
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">Incomplete Addresses</div>
                        <div className="font-bold text-lg">{results.detailedFilterStats.summary.incompleteCount}</div>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Missing address/city/state</div>
                      </div>
                    )}
                    {results.detailedFilterStats.summary.nonUSCount > 0 && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border-l-4 border-purple-400">
                        <div className="text-sm text-purple-700 dark:text-purple-300">Non-US Addresses</div>
                        <div className="font-bold text-lg">{results.detailedFilterStats.summary.nonUSCount}</div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">Outside United States</div>
                      </div>
                    )}
                    {results.detailedFilterStats.summary.poBoxCount > 0 && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded border-l-4 border-orange-400">
                        <div className="text-sm text-orange-700 dark:text-orange-300">PO Box Addresses</div>
                        <div className="font-bold text-lg">{results.detailedFilterStats.summary.poBoxCount}</div>
                        <div className="text-xs text-orange-600 dark:text-orange-400">Post office boxes</div>
                      </div>
                    )}
                    {results.detailedFilterStats.summary.apartmentCount > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border-l-4 border-red-400">
                        <div className="text-sm text-red-700 dark:text-red-300">Apartment/Rental</div>
                        <div className="font-bold text-lg">{results.detailedFilterStats.summary.apartmentCount}</div>
                        <div className="text-xs text-red-600 dark:text-red-400">Likely rental properties</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sample Filtered Collectors */}
                {results.detailedFilterStats.removedCount > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Sample Filtered Collectors</h4>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Collector</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Reason Filtered</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            ...results.detailedFilterStats.breakdown.incomplete.slice(0, 3),
                            ...results.detailedFilterStats.breakdown.nonUS.slice(0, 3),
                            ...results.detailedFilterStats.breakdown.poBox.slice(0, 3),
                            ...results.detailedFilterStats.breakdown.apartment.slice(0, 3),
                          ].slice(0, 10).map((detail, index) => (
                            <TableRow key={`${detail.collector.email}-${index}`} className={index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900/50'}>
                              <TableCell className="font-medium">
                                {detail.collector.firstName} {detail.collector.lastName}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                {detail.collector.deliveryAddress}, {detail.collector.city}, {detail.collector.state}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                {detail.reason}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  detail.category === 'incomplete' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                                  detail.category === 'non-us' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                  detail.category === 'po-box' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' :
                                  detail.category === 'apartment' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                                }`}>
                                  {detail.category}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {results.detailedFilterStats.removedCount > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing sample of {Math.min(10, results.detailedFilterStats.removedCount)} filtered collectors. 
                        Total filtered: {results.detailedFilterStats.removedCount}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Summary Stats - only for non-snapshot results */}
            {!results.isSnapshot && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                      {results.priorityCollectors.length}
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Rich ($1.5M+)</div>
                </div>
              </div>
            )}

            {/* Processing Stats */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                {results.isSnapshot ? 'Filter Processing Summary' : 'Processing Summary'}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Valid Addresses:</span>
                  <div className="font-semibold">{results.validCollectorCount}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Filtered Out:</span>
                  <div className="font-semibold">{results.filteredOutCount}</div>
                </div>
                {!results.isSnapshot && (
                  <>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Avg Property Value:</span>
                      <div className="font-semibold">${Math.round(results.report.avgWealthScore).toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Top Tier:</span>
                      <div className="font-semibold">{results.priorityCollectors.length}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top Collectors Preview - only for non-snapshot results */}
            {!results.isSnapshot && results.priorityCollectors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Priority Collectors for Targeting: {results.priorityCollectors.length}
                </h4>
                <div className="overflow-x-auto rounded-lg border max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Collector</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Property Value</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Property Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.priorityCollectors.map((collector, index) => (
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}