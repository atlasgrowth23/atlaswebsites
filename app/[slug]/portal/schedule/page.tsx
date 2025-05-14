'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tech {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Job {
  id: string;
  contact_id: string;
  tech_id: string | null;
  contact_name: string;
  contact_phone: string;
  service_type: string;
  status: 'NEW' | 'SCHEDULED' | 'PROGRESS' | 'DONE';
  priority: 'normal' | 'emergency';
  scheduled_at: string | null;
  notes: string | null;
}

export default function SchedulePage({ params }: { params: { slug: string } }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMultiTech, setIsMultiTech] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Function to load jobs and techs
  const loadScheduleData = async () => {
    setLoading(true);
    try {
      // Get company settings to check multi_tech
      const settingsResponse = await fetch(`/api/company/settings?slug=${params.slug}`);
      
      if (!settingsResponse.ok) {
        throw new Error('Failed to load company settings');
      }
      
      const settingsData = await settingsResponse.json();
      setIsMultiTech(settingsData.multi_tech || false);
      
      // Load technicians if multi_tech is true
      if (settingsData.multi_tech) {
        const techsResponse = await fetch(`/api/company/techs?slug=${params.slug}`);
        
        if (!techsResponse.ok) {
          throw new Error('Failed to load technicians');
        }
        
        const techsData = await techsResponse.json();
        setTechs(techsData.techs || []);
      }
      
      // Load jobs
      const jobsResponse = await fetch(
        `/api/company/jobs?slug=${params.slug}&date=${currentDate.toISOString().split('T')[0]}`
      );
      
      if (!jobsResponse.ok) {
        throw new Error('Failed to load jobs');
      }
      
      const jobsData = await jobsResponse.json();
      setJobs(jobsData.jobs || []);
    } catch (err) {
      console.error('Error loading schedule data:', err);
      setError('Failed to load schedule data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load schedule data on component mount and when date changes
  useEffect(() => {
    loadScheduleData();
  }, [params.slug, currentDate]);
  
  // Generate day navigation functions
  const goToToday = () => setCurrentDate(new Date());
  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setCurrentDate(prevDay);
  };
  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
  };
  
  // Format the current date for display
  const formatCurrentDate = () => {
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };
  
  // Calculate job color based on status and priority
  const getJobColor = (job: Job) => {
    if (job.status === 'DONE') {
      return 'bg-green-500 bg-opacity-50 border-green-600';
    }
    if (job.status === 'PROGRESS') {
      return 'bg-amber-500 border-amber-600';
    }
    if (job.priority === 'emergency') {
      return 'bg-red-500 border-red-600';
    }
    return 'bg-primary border-primary-dark';
  };
  
  // Format time from iso string or null
  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Unscheduled';
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };
  
  // Group jobs by tech
  const getJobsByTech = () => {
    const jobsByTech: { [key: string]: Job[] } = {};
    
    // Initialize with empty arrays for all techs
    if (isMultiTech) {
      techs.forEach((tech) => {
        jobsByTech[tech.id] = [];
      });
      // Add unassigned category
      jobsByTech['unassigned'] = [];
    } else {
      jobsByTech['single'] = [];
    }
    
    // Distribute jobs
    jobs.forEach((job) => {
      if (isMultiTech) {
        if (job.tech_id && jobsByTech[job.tech_id]) {
          jobsByTech[job.tech_id].push(job);
        } else {
          jobsByTech['unassigned'].push(job);
        }
      } else {
        jobsByTech['single'].push(job);
      }
    });
    
    return jobsByTech;
  };
  
  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          <p>{error}</p>
          <button
            onClick={loadScheduleData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  const jobsByTech = getJobsByTech();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Schedule</h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <button
            onClick={goToToday}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Today
          </button>
          
          <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-900 dark:text-white">
            {formatCurrentDate()}
          </div>
          
          <button
            onClick={goToNextDay}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          >
            <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isMultiTech ? (
          // Multi-tech view
          <>
            {techs.map((tech) => (
              <div
                key={tech.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                  {tech.avatar_url ? (
                    <img
                      src={tech.avatar_url}
                      alt={tech.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                      {getInitials(tech.name)}
                    </div>
                  )}
                  <h3 className="font-medium text-gray-900 dark:text-white">{tech.name}</h3>
                  <Link
                    href={`/api/company/ics/${tech.id}.ics?slug=${params.slug}`}
                    className="ml-auto text-sm text-primary hover:underline"
                    target="_blank"
                  >
                    Calendar
                  </Link>
                </div>
                
                <div className="p-4">
                  {jobsByTech[tech.id].length === 0 ? (
                    <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No jobs scheduled
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {jobsByTech[tech.id].map((job) => (
                        <li
                          key={job.id}
                          className={`relative p-3 rounded-md border ${getJobColor(job)}`}
                        >
                          <div className="flex justify-between">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {job.contact_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {formatTime(job.scheduled_at)}
                            </div>
                          </div>
                          <div className="mt-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {job.service_type}
                            </span>
                            {job.priority === 'emergency' && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Emergency
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {job.status === 'NEW' && 'New'}
                              {job.status === 'SCHEDULED' && 'Scheduled'}
                              {job.status === 'PROGRESS' && 'In Progress'}
                              {job.status === 'DONE' && 'Completed'}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            
            {/* Unassigned Jobs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Unassigned Jobs</h3>
              </div>
              
              <div className="p-4">
                {jobsByTech['unassigned'].length === 0 ? (
                  <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No unassigned jobs
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {jobsByTech['unassigned'].map((job) => (
                      <li
                        key={job.id}
                        className={`relative p-3 rounded-md border ${getJobColor(job)}`}
                      >
                        <div className="flex justify-between">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {job.contact_name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">
                            {formatTime(job.scheduled_at)}
                          </div>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {job.service_type}
                          </span>
                          {job.priority === 'emergency' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Emergency
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {job.status === 'NEW' && 'New'}
                            {job.status === 'SCHEDULED' && 'Scheduled'}
                            {job.status === 'PROGRESS' && 'In Progress'}
                            {job.status === 'DONE' && 'Completed'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : (
          // Single tech view
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-medium text-gray-900 dark:text-white">My Schedule</h3>
              <Link
                href={`/api/company/ics/personal.ics?slug=${params.slug}`}
                className="text-sm text-primary hover:underline"
                target="_blank"
              >
                Calendar
              </Link>
            </div>
            
            <div className="p-4">
              {jobsByTech['single'].length === 0 ? (
                <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No jobs scheduled
                </p>
              ) : (
                <ul className="space-y-3">
                  {jobsByTech['single'].map((job) => (
                    <li
                      key={job.id}
                      className={`relative p-3 rounded-md border ${getJobColor(job)}`}
                    >
                      <div className="flex justify-between">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {job.contact_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {formatTime(job.scheduled_at)}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {job.service_type}
                        </span>
                        {job.priority === 'emergency' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            Emergency
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {job.status === 'NEW' && 'New'}
                          {job.status === 'SCHEDULED' && 'Scheduled'}
                          {job.status === 'PROGRESS' && 'In Progress'}
                          {job.status === 'DONE' && 'Completed'}
                        </span>
                        <a
                          href={`tel:${job.contact_phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {job.contact_phone}
                        </a>
                      </div>
                      {job.notes && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {job.notes}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}