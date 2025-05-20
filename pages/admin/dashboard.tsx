import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { query, queryMany } from '../../lib/db';

// Pipeline stages for the sales process
const PIPELINE_STAGES = [
  { id: 'prospect', name: 'Prospect', color: '#e5e7eb' },
  { id: 'contacted', name: 'Contacted', color: '#93c5fd' },
  { id: 'meeting', name: 'Meeting Scheduled', color: '#fcd34d' },
  { id: 'proposal', name: 'Proposal Sent', color: '#fca5a5' },
  { id: 'negotiation', name: 'Negotiation', color: '#c4b5fd' },
  { id: 'closed', name: 'Closed Won', color: '#a7f3d0' }
];

interface Company {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string;
  rating: number;
  reviews: number;
  pipeline_stage: string;
  last_contact_date: string | null;
  notes: string | null;
}

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [pipelineStats, setPipelineStats] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        
        // Calculate pipeline stats
        const stats: Record<string, number> = {};
        PIPELINE_STAGES.forEach(stage => {
          stats[stage.id] = data.filter((c: Company) => c.pipeline_stage === stage.id).length;
        });
        
        // Add 'all' category
        stats.all = data.length;
        setPipelineStats(stats);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateCompanyStage = async (companyId: string, newStage: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      
      if (response.ok) {
        // Update local state
        setCompanies(prevCompanies => 
          prevCompanies.map(company => 
            company.id === companyId 
              ? { ...company, pipeline_stage: newStage } 
              : company
          )
        );
        
        // Also update the stats
        setPipelineStats(prevStats => {
          const company = companies.find(c => c.id === companyId);
          if (company) {
            const oldStage = company.pipeline_stage;
            return {
              ...prevStats,
              [oldStage]: (prevStats[oldStage] || 0) - 1,
              [newStage]: (prevStats[newStage] || 0) + 1
            };
          }
          return prevStats;
        });
      }
    } catch (error) {
      console.error('Error updating company stage:', error);
    }
  };
  
  const updateCompanyNotes = async () => {
    if (!activeCompany) return;
    
    try {
      const response = await fetch(`/api/admin/companies/${activeCompany.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        // Update local state
        setCompanies(prevCompanies => 
          prevCompanies.map(company => 
            company.id === activeCompany.id 
              ? { ...company, notes } 
              : company
          )
        );
        
        setActiveCompany(prev => prev ? { ...prev, notes } : null);
      }
    } catch (error) {
      console.error('Error updating company notes:', error);
    }
  };
  
  const getFilteredCompanies = () => {
    if (!activeStage || activeStage === 'all') {
      return companies;
    }
    return companies.filter(company => company.pipeline_stage === activeStage);
  };
  
  return (
    <>
      <Head>
        <title>Admin Dashboard - Pipeline Management</title>
      </Head>
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Sidebar */}
        <div style={{ 
          width: '250px', 
          backgroundColor: '#1e3a8a', 
          color: 'white',
          padding: '20px 0',
          position: 'relative'
        }}>
          <div style={{ padding: '0 20px', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Admin Portal</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '5px' }}>HVAC Sales Dashboard</p>
          </div>
          
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setActiveStage('all'); }}
                  style={{ 
                    display: 'block',
                    padding: '12px 20px',
                    color: 'white',
                    textDecoration: 'none',
                    backgroundColor: activeStage === 'all' ? '#2c4f9c' : 'transparent',
                    borderLeft: activeStage === 'all' ? '4px solid white' : '4px solid transparent',
                  }}
                >
                  All Companies ({pipelineStats.all || 0})
                </a>
              </li>
              
              {PIPELINE_STAGES.map(stage => (
                <li key={stage.id}>
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); setActiveStage(stage.id); }}
                    style={{ 
                      display: 'block',
                      padding: '12px 20px',
                      color: 'white',
                      textDecoration: 'none',
                      backgroundColor: activeStage === stage.id ? '#2c4f9c' : 'transparent',
                      borderLeft: activeStage === stage.id ? '4px solid white' : '4px solid transparent',
                    }}
                  >
                    {stage.name} ({pipelineStats[stage.id] || 0})
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          <div style={{ padding: '20px', position: 'absolute', bottom: '0', width: 'calc(100% - 40px)' }}>
            <Link href="/" style={{ 
                display: 'block',
                textAlign: 'center',
                padding: '8px',
                backgroundColor: '#0f2259',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}>
                Back to Website
            </Link>
          </div>
        </div>
        
        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ 
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ margin: 0, fontSize: '1.8rem' }}>
              Pipeline Management
              {activeStage && activeStage !== 'all' && (
                ': ' + PIPELINE_STAGES.find(s => s.id === activeStage)?.name
              )}
            </h1>
          </div>
          
          {/* Content area */}
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Companies list */}
            <div style={{ 
              width: '350px', 
              borderRight: '1px solid #e5e7eb',
              overflowY: 'auto',
              backgroundColor: '#f9fafb'
            }}>
              {loading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  Loading companies...
                </div>
              ) : (
                <>
                  {getFilteredCompanies().length > 0 ? (
                    <div>
                      {getFilteredCompanies().map(company => (
                        <div 
                          key={company.id}
                          style={{
                            padding: '15px',
                            borderBottom: '1px solid #e5e7eb',
                            backgroundColor: activeCompany?.id === company.id ? '#f0f9ff' : 'white',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setActiveCompany(company);
                            setNotes(company.notes || '');
                          }}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                            {company.name}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            {company.city}, {company.state}
                          </div>
                          <div style={{ 
                            marginTop: '8px', 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ 
                              backgroundColor: PIPELINE_STAGES.find(s => s.id === company.pipeline_stage)?.color || '#e5e7eb',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '0.75rem'
                            }}>
                              {PIPELINE_STAGES.find(s => s.id === company.pipeline_stage)?.name || 'Prospect'}
                            </span>
                            {company.rating && (
                              <span style={{ fontSize: '0.85rem' }}>
                                ⭐ {company.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '30px', 
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      No companies in this stage
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Company details */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
              {activeCompany ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                  }}>
                    <h2 style={{ margin: 0 }}>{activeCompany.name}</h2>
                    <a 
                      href={`/p/${activeCompany.slug}`}
                      target="_blank"
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#1e3a8a',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}
                    >
                      View Portal
                    </a>
                  </div>
                  
                  {/* Company info card */}
                  <div style={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>Company Information</h3>
                    
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '15px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#666' }}>Location</div>
                        <div>{activeCompany.city}, {activeCompany.state}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#666' }}>Phone</div>
                        <div>{activeCompany.phone}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#666' }}>Rating</div>
                        <div>{activeCompany.rating} ⭐ ({activeCompany.reviews} reviews)</div>
                      </div>
                      
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#666' }}>Last Contact</div>
                        <div>{activeCompany.last_contact_date ? new Date(activeCompany.last_contact_date).toLocaleDateString() : 'No contact yet'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pipeline Stage */}
                  <div style={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>Pipeline Stage</h3>
                    
                    <div style={{ 
                      display: 'flex',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      {PIPELINE_STAGES.map(stage => (
                        <button 
                          key={stage.id}
                          onClick={() => updateCompanyStage(activeCompany.id, stage.id)}
                          style={{
                            padding: '8px 12px',
                            border: `1px solid ${stage.color}`,
                            backgroundColor: activeCompany.pipeline_stage === stage.id ? stage.color : 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: activeCompany.pipeline_stage === stage.id ? 'bold' : 'normal',
                          }}
                        >
                          {stage.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div style={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px'
                  }}>
                    <div style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '15px'
                    }}>
                      <h3 style={{ margin: 0 }}>Notes & Follow-up</h3>
                      <button
                        onClick={updateCompanyNotes}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#1e3a8a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Save Notes
                      </button>
                    </div>
                    
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '200px',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        resize: 'vertical'
                      }}
                      placeholder="Add notes about this company, follow-up tasks, or contact information..."
                    />
                  </div>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#666'
                }}>
                  Select a company to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}