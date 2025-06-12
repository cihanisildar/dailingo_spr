'use client';

import { useState } from 'react';
import { useCards } from '@/hooks/useCards';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useQueryClient } from "@tanstack/react-query";

interface ImportCardsDialogProps {
  onImportComplete?: () => void;
  className?: string;
}

export function ImportCardsDialog({ onImportComplete, className }: ImportCardsDialogProps) {
  const { importCards } = useCards();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [wordListId, setWordListId] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleWordListIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWordListId(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (wordListId.trim()) {
          formData.append('wordListId', wordListId.trim());
        }
        const result = await importCards(formData);
        if (result?.failed > 0) {
          toast.error(`Imported with ${result.failed} errors.`);
          if (result.errors && result.errors.length > 0) {
            result.errors.forEach((err) => toast.error(err));
          }
        } else {
          toast.success('Cards imported successfully');
          queryClient.invalidateQueries({ queryKey: ["cards"] });
        }
      } else if (text) {
        const result = await importCards({ text });
        if (result?.failed > 0) {
          toast.error(`Imported with ${result.failed} errors.`);
          if (result.errors && result.errors.length > 0) {
            result.errors.forEach((err) => toast.error(err));
          }
        } else {
          toast.success('Cards imported successfully');
          queryClient.invalidateQueries({ queryKey: ["cards"] });
        }
      } else {
        throw new Error('Please provide either a file or text input');
      }

      setOpen(false);
      setFile(null);
      setText("");
      setWordListId("");
      onImportComplete?.();
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        error.response.data.errors.forEach((err: string) => toast.error(err));
      } else if (error?.data?.errors) {
        error.data.errors.forEach((err: string) => toast.error(err));
      } else if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to import cards');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>Import Cards</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Cards</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Import from file (Excel .xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wordListId">Word List ID (optional)</Label>
            <Input
              id="wordListId"
              type="text"
              value={wordListId}
              onChange={handleWordListIdChange}
              placeholder="Enter Word List ID (optional)"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Or paste text (one word per line)</Label>
            <Textarea
              id="text"
              value={text}
              onChange={handleTextChange}
              placeholder="word1&#10;word2&#10;word3"
              disabled={loading}
              rows={5}
            />
          </div>
          <Button type="submit" disabled={loading || (!file && !text.trim())}>
            {loading ? 'Importing...' : 'Import'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 