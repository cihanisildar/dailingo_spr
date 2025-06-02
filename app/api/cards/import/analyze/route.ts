import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to get a sample of rows
function getSampleRows(data: any[], count: number = 3) {
  return data.slice(0, count);
}

// Helper function to prepare data for AI analysis
function prepareDataForAnalysis(headers: string[], sampleRows: any[]) {
  const columnSamples = headers.map(header => {
    const samples = sampleRows.map(row => row[header]).filter(Boolean);
    return {
      header,
      samples: samples.slice(0, 3)
    };
  });

  return columnSamples;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    const headers = Object.keys(data[0] as object);
    const sampleRows = getSampleRows(data);

    console.log('Excel Headers:', headers);
    console.log('Sample Rows:', sampleRows);

    // Prepare data for AI analysis
    const columnSamples = prepareDataForAnalysis(headers, sampleRows);

    // Use AI to analyze column types
    const prompt = `Analyze these Excel columns and determine their types. For each column, determine if it contains:
1. Vocabulary words (single words or short phrases)
2. Definitions (longer text explaining meaning)
3. Examples (sentences showing usage)
4. Other information

Here are the columns and their sample data:
${columnSamples.map(col => `
Column: ${col.header}
Samples: ${col.samples.join(', ')}`).join('\n')}

Respond with a JSON array of objects, each with:
{
  "column": "column name",
  "type": "word" | "definition" | "example" | "other",
  "confidence": number between 0 and 1
}`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    // Safe check for valid JSON response from OpenAI
    let content = completion.choices[0].message.content;
    if (!content || typeof content !== 'string' || !content.trim().startsWith('{')) {
      content = '{"analysis": []}';
    }
    const response = JSON.parse(content);
    let analysis = response.analysis;
    if (!Array.isArray(analysis)) {
      if (analysis && typeof analysis === 'object') {
        analysis = [analysis];
      } else {
        analysis = [];
      }
    }

    console.log('AI Analysis Response:', response);
    console.log('AI Analysis Array:', analysis);

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

    const detectedColumns = headers.map(header => {
      const columnAnalysis = analysis.find((a: any) => a.column === header);
      return {
        name: header,
        type: columnAnalysis?.type !== 'other' && columnAnalysis?.type !== undefined
          ? columnAnalysis?.type
          : fallbackTypes[header.toLowerCase()] || 'other',
        sample: sampleRows[0]?.[header] || ''
      };
    });

    console.log('Final Detected Columns:', detectedColumns);
    console.log('Sample Data for UI:', sampleRows.map(row => {
      const wordCol = detectedColumns.find(col => col.type === 'word')?.name || '';
      const defCol = detectedColumns.find(col => col.type === 'definition')?.name || '';
      const exampleCol = detectedColumns.find(col => col.type === 'example')?.name || '';
      const synonymCol = detectedColumns.find(col => col.type === 'synonym')?.name || '';
      return {
        word: row[wordCol] || '',
        definition: row[defCol] || '',
        example: row[exampleCol] || '',
        synonym: row[synonymCol] || ''
      };
    }));

    return NextResponse.json({
      totalRows: data.length,
      detectedColumns,
      sampleRows: sampleRows.map(row => {
        const wordCol = detectedColumns.find(col => col.type === 'word')?.name || '';
        const defCol = detectedColumns.find(col => col.type === 'definition')?.name || '';
        const exampleCol = detectedColumns.find(col => col.type === 'example')?.name || '';
        const synonymCol = detectedColumns.find(col => col.type === 'synonym')?.name || '';
        return {
          word: row[wordCol] || '',
          definition: row[defCol] || '',
          example: row[exampleCol] || '',
          synonym: row[synonymCol] || ''
        };
      })
    });
  } catch (error) {
    console.error('Error analyzing file:', error);
    return NextResponse.json(
      { error: 'Failed to analyze file' },
      { status: 500 }
    );
  }
} 