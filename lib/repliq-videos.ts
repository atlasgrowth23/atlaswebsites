import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface RepliqVideo {
  id: string;
  videoSuccess: string;
  originUrls: string;
  firstName: string;
  lastName: string;
  videoLink: string;
  videoHtmlEmail: string;
  shortVideoHtml: string;
  videoPreview: string;
  backgroundImageLink: string;
  imgHtmlEmail: string;
}

// Parse CSV and return video data
export function parseRepliqVideos(): RepliqVideo[] {
  try {
    const csvPath = path.join(process.cwd(), 'csv_n7cARw5Ps3O4qdf5kxQaX0yM3Uw1_n7b7b7cf2w1_n7b7b7cf2w1_file.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      quote: '"',
      escape: '"',
      relax_quotes: true,
      relax_column_count: true
    });

    return records.map((record: any) => ({
      id: record.Id,
      videoSuccess: record.VideoSucess,
      originUrls: record.OriginUrls,
      firstName: record.FirstName,
      lastName: record.LastName,
      videoLink: record.VideoLink,
      videoHtmlEmail: record.VideoHtmlEmail,
      shortVideoHtml: record.ShortVideoHtml,
      videoPreview: record.VideoPreview,
      backgroundImageLink: record.BackgroundImageLink,
      imgHtmlEmail: record.ImgHtmlEmail,
    }));
  } catch (error) {
    console.error('Error parsing Repliq videos CSV:', error);
    return [];
  }
}

// Get video data by name match
export function getVideoByName(firstName: string, lastName: string): RepliqVideo | null {
  const videos = parseRepliqVideos();
  return videos.find(video => 
    video.firstName.toLowerCase() === firstName.toLowerCase() && 
    video.lastName.toLowerCase() === lastName.toLowerCase()
  ) || null;
}

// Get video data by company mapping
export function getVideoByCompanySlug(companySlug: string): RepliqVideo | null {
  const companyVideoMap: Record<string, { firstName: string; lastName: string }> = {
    'ready-heating-and-air-llc': { firstName: 'John', lastName: 'Rangan' },
    'calderas-heating-and-air': { firstName: 'Sarah', lastName: 'Acker' },
    'toms-heating-and-air-conditioning': { firstName: 'Robert', lastName: 'Suun' },
  };

  const nameData = companyVideoMap[companySlug];
  if (!nameData) return null;

  return getVideoByName(nameData.firstName, nameData.lastName);
}

// Generate MMS image URL from video preview
export function getMmsImageUrl(videoData: RepliqVideo): string {
  return videoData.videoPreview;
}

// Generate personalized SMS message
export function generateSmsMessage(companyName: string, firstName: string, videoIntroUrl: string): string {
  return `Hi ${companyName}! I'm ${firstName} and I created a website for you. I recorded a quick walkthrough - check it out: ${videoIntroUrl}`;
}

// Extract video ID from Repliq URL
export function extractVideoId(videoLink: string): string {
  const match = videoLink.match(/\/videos\/([^\/]+)$/);
  return match ? match[1] : '';
}