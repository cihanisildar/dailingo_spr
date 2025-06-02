import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { addDays } from 'date-fns';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import { ReviewStatus } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to clean and format content
function cleanContent(content: any): string {
  if (!content) return '';
  return String(content).trim();
}

// Helper function to enhance content with AI
async function enhanceContent(word: string, definition: string) {
  try {
    const prompt = `Given this vocabulary word and its definition:
Word: ${word}
Definition: ${definition}

Please provide:
1. A clear, concise definition
2. 2-3 example sentences showing different uses
3. 2-3 synonyms
4. 2-3 antonyms
5. Any important notes about usage

Format the response as JSON:
{
  "definition": "string",
  "examples": ["string"],
  "synonyms": ["string"],
  "antonyms": ["string"],
  "notes": "string"
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Error enhancing content:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const userEmail = await getCurrentUser();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const wordListId = formData.get('wordListId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { 
        id: true,
        reviewSchedule: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate word list if provided
    if (wordListId) {
      const wordList = await prisma.wordList.findFirst({
        where: {
          id: wordListId,
          userId: user.id
        }
      });

      if (!wordList) {
        return NextResponse.json({ error: 'Word list not found or access denied' }, { status: 404 });
      }
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Fallback for common column names (English and Turkish)
    const fallbackTypes: Record<string, string> = {
      words: 'word',
      kelimeler: 'word',
      definitions: 'definition',
      anlamlar: 'definition',
      examples: 'example',
      "örnekler": 'example',
      synonyms: 'synonym',
      "eş anlamlıları": 'synonym',
      antonyms: 'antonym',
      "zıt anlamlılar": 'antonym',
      notes: 'notes',
      "notlar": 'notes',
    };
    const headers = Object.keys(data[0] as object);
    const columnMap = {
      word: headers.find(h => fallbackTypes[h.toLowerCase()] === 'word'),
      definition: headers.find(h => fallbackTypes[h.toLowerCase()] === 'definition'),
      example: headers.find(h => fallbackTypes[h.toLowerCase()] === 'example'),
      synonym: headers.find(h => fallbackTypes[h.toLowerCase()] === 'synonym'),
      antonym: headers.find(h => fallbackTypes[h.toLowerCase()] === 'antonym'),
      notes: headers.find(h => fallbackTypes[h.toLowerCase()] === 'notes'),
    };
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Get first interval from review schedule
    const intervals = user.reviewSchedule?.intervals || [1, 2, 7, 30, 365];
    const firstInterval = intervals[0] || 1;
    const now = new Date();

    // Process each row
    const batchSize = 10;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchPromises = batch.map(async (row) => {
        try {
          const r = row as any;
          const word = columnMap.word ? cleanContent(r[columnMap.word]) : '';
          const definition = columnMap.definition ? cleanContent(r[columnMap.definition]) : '';
          if (!word || !definition) {
            results.failed++;
            results.errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
            return;
          }
          await prisma.card.create({
            data: {
              word,
              definition,
              userId: user.id,
              wordListId: wordListId || null,
              nextReview: addDays(now, firstInterval),
              reviewStatus: ReviewStatus.ACTIVE,
              reviewStep: -1,
              viewCount: 0,
              successCount: 0,
              failureCount: 0,
              wordDetails: {
                create: {
                  examples: columnMap.example && r[columnMap.example] ? [r[columnMap.example]] : [],
                  synonyms: columnMap.synonym && r[columnMap.synonym] ? [r[columnMap.synonym]] : [],
                  antonyms: columnMap.antonym && r[columnMap.antonym] ? [r[columnMap.antonym]] : [],
                  notes: columnMap.notes && r[columnMap.notes] ? r[columnMap.notes] : null
                }
              }
            }
          });
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing row: ${JSON.stringify(row)}`);
        }
      });
      await Promise.all(batchPromises);
    }
    // Do NOT call enhanceContent or update cards after import!
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing cards:', error);
    return NextResponse.json(
      { error: 'Failed to import cards' },
      { status: 500 }
    );
  }
} 