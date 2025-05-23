"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCard } from '@/hooks/useCards';
import { Card } from '@/types/card';

type FormData = {
  word: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  notes: string;
  wordListId?: string;
};

export default function CardForm() {
  const router = useRouter();
  const { mutate: createCard, isPending, error: mutationError } = useCreateCard();
  const [formData, setFormData] = useState<FormData>({
    word: '',
    definition: '',
    synonyms: [''],
    antonyms: [''],
    examples: [''],
    notes: '',
  });

  const handleArrayFieldChange = (
    field: 'synonyms' | 'antonyms' | 'examples',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayField = (field: 'synonyms' | 'antonyms' | 'examples') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'synonyms' | 'antonyms' | 'examples', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty strings from arrays
    const cleanedData = {
      ...formData,
      synonyms: formData.synonyms.filter(Boolean),
      antonyms: formData.antonyms.filter(Boolean),
      examples: formData.examples.filter(Boolean),
    };

    createCard(cleanedData, {
      onSuccess: () => {
        router.push('/cards');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {mutationError && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error creating card
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {mutationError instanceof Error ? mutationError.message : 'An error occurred'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="word" className="block text-sm font-medium text-gray-700">
          Word
        </label>
        <input
          type="text"
          id="word"
          required
          value={formData.word}
          onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="definition" className="block text-sm font-medium text-gray-700">
          Definition
        </label>
        <textarea
          id="definition"
          required
          rows={3}
          value={formData.definition}
          onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Synonyms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Synonyms
        </label>
        {formData.synonyms.map((synonym, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={synonym}
              onChange={(e) => handleArrayFieldChange('synonyms', index, e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter a synonym"
            />
            <button
              type="button"
              onClick={() => removeArrayField('synonyms', index)}
              className="px-2 py-1 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayField('synonyms')}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Synonym
        </button>
      </div>

      {/* Antonyms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Antonyms
        </label>
        {formData.antonyms.map((antonym, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={antonym}
              onChange={(e) => handleArrayFieldChange('antonyms', index, e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter an antonym"
            />
            <button
              type="button"
              onClick={() => removeArrayField('antonyms', index)}
              className="px-2 py-1 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayField('antonyms')}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Antonym
        </button>
      </div>

      {/* Examples */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Example Sentences
        </label>
        {formData.examples.map((example, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={example}
              onChange={(e) => handleArrayFieldChange('examples', index, e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter an example sentence"
            />
            <button
              type="button"
              onClick={() => removeArrayField('examples', index)}
              className="px-2 py-1 text-red-600 hover:text-red-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayField('examples')}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Example
        </button>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create Card'}
        </button>
      </div>
    </form>
  );
} 