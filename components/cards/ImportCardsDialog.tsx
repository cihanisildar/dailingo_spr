import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Download, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

interface ImportCardsDialogProps {
  wordListId?: string;
  onImportComplete?: () => void;
  className?: string;
}

interface PreviewData {
  totalRows: number;
  detectedColumns: {
    name: string;
    type: 'word' | 'definition' | 'example' | 'other';
    sample: string;
  }[];
  sampleRows: any[];
}

export function ImportCardsDialog({ wordListId, onImportComplete, className }: ImportCardsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [progress, setProgress] = useState<{ status: string; done: number; total: number; elapsed: number } | null>(null);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          selectedFile.type !== 'application/vnd.ms-excel') {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      setFile(selectedFile);
      
      // Analyze file structure
      setIsAnalyzing(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch('/api/cards/import/analyze', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to analyze file');
        }
        
        const data = await response.json();
        setPreview(data);
      } catch (error) {
        toast.error('Failed to analyze file structure');
        setFile(null);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setIsLoading(true);
    setProgress({ status: 'running', done: 0, total: 0, elapsed: 0 });
    const formData = new FormData();
    formData.append('file', file);
    if (wordListId) {
      formData.append('wordListId', wordListId);
    }

    try {
      const response = await fetch('/api/cards/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import cards');
      }

      toast.success(`Successfully imported ${data.success} cards. ${data.failed} cards failed to import.`);
      if (data.errors.length > 0) {
        console.error('Import errors:', data.errors);
      }
      
      setIsOpen(false);
      setFile(null);
      setPreview(null);
      onImportComplete?.();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import cards');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple Excel template with headers
    const headers = ['Word', 'Definition', 'Synonyms', 'Antonyms', 'Examples', 'Notes'];
    const csvContent = headers.join(',') + '\\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cards_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Effect: refresh cards when import is done
  useEffect(() => {
    if (progress && progress.status === 'done') {
      if (onImportComplete) {
        onImportComplete();
      } else {
        router.refresh();
      }
    }
  }, [progress, onImportComplete, router]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className={className || "bg-gradient-to-r from-purple-500 to-pink-500 text-white"} 
          size="lg"
        >
          Import Cards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-4 rounded-xl shadow-lg border border-gray-100 bg-white">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-semibold">Import Cards from Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isLoading || isAnalyzing || (progress && progress.status && progress.status !== 'done')}
              className="text-sm px-2 py-1 border rounded-md w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Upload any Excel file – structure will be detected automatically.</p>
          </div>
          {isAnalyzing && (
            <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-md p-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500 mb-1" />
              <span className="text-xs text-gray-600">Analyzing file structure...</span>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full animate-pulse" style={{ width: '40%' }} />
              </div>
            </div>
          )}
          {preview && !isAnalyzing && (
            <div className="bg-gray-50 rounded-md p-2 text-xs">
              <div className="mb-1 font-medium text-gray-700">Detected Columns:</div>
              <div className="flex flex-wrap gap-2">
                {preview.detectedColumns.map((col, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded bg-gray-200 ${col.type !== 'other' ? 'text-blue-700' : 'text-gray-400'}`}>{col.name}: <span className="font-semibold">{col.type !== 'other' ? col.type : 'Other'}</span></span>
                ))}
              </div>
              {preview.sampleRows && preview.sampleRows.length > 0 && (
                <div className="mt-2 text-gray-500">
                  <span className="font-medium">Sample:</span> {Object.values(preview.sampleRows[0]).filter(Boolean).join(' | ')}
                </div>
              )}
            </div>
          )}
          {progress && progress.status && progress.status !== 'done' && (
            <div className="flex flex-col items-center gap-1 bg-gray-50 rounded-md p-2">
              <span className="text-xs text-blue-700">Import is running in the background. You can continue using the app.</span>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-300" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <span className="text-xs text-gray-500 mt-1">{progress.done}/{progress.total} cards – {Math.round(progress.elapsed / 1000)}s</span>
            </div>
          )}
          {progress && progress.status === 'done' && (
            <div className="text-green-600 font-medium text-center text-sm">Import complete!</div>
          )}
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleImport}
              disabled={!!(!file || isLoading || isAnalyzing || (progress && progress.status && progress.status !== 'done'))}
              className="px-4 py-1 text-sm rounded-md"
            >
              {isAnalyzing
                ? 'Analyzing...'
                : progress && progress.status && progress.status !== 'done'
                ? 'Importing...'
                : isLoading
                ? 'Importing...'
                : 'Import Cards'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 