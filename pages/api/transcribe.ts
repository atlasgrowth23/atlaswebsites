import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.OPEN_AI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Create a readable stream from the file
    const audioBuffer = fs.readFileSync(audioFile.filepath);
    const audioBlob = new Blob([audioBuffer], { type: audioFile.mimetype || 'audio/webm' });
    
    // Convert blob to File for OpenAI
    const audioFileForAPI = new File([audioBlob], audioFile.originalFilename || 'audio.webm', {
      type: audioFile.mimetype || 'audio/webm'
    });

    const transcription = await openai.audio.transcriptions.create({
      file: audioFileForAPI,
      model: 'whisper-1',
      language: 'en',
    });

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    res.status(200).json({ 
      text: transcription.text,
      success: true 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}