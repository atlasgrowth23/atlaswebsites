import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Company } from '@/types';

// Define pipeline stages
const PIPELINE_STAGES = [
  { id: 'lead', name: 'New Lead' },
  { id: 'contact', name: 'Contacted' },
  { id: 'meeting', name: 'Meeting Set' },
  { id: 'proposal', name: 'Proposal' },
  { id: 'negotiation', name: 'Negotiation' },
  { id: 'closed', name: 'Closed Won' },
];

export default function PipelinePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const supabase = createClient();
  
  // In a real app, you'd have a separate table for pipeline entries
  // For now, we'll just simulate it with companies data
  
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('name')
        .limit(10);
      
      if (data) {
        setCompanies(data);
      }
    };
    
    fetchCompanies();
  }, []);
  
  // Randomly distribute companies across pipeline stages for demo
  const getCompaniesInStage = (stageId: string) => {
    // This is just for demo - in reality, you'd filter by actual stage field
    const stageIndex = PIPELINE_STAGES.findIndex(stage => stage.id === stageId);
    return companies.filter((_, index) => index % PIPELINE_STAGES.length === stageIndex);
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Sales Pipeline | HVAC Sites</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-6">Sales Pipeline</h1>
      
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => (
          <div key={stage.id} className="min-w-[250px] flex-shrink-0">
            <h2 className="font-semibold mb-3 text-gray-700">{stage.name}</h2>
            <div className="space-y-3">
              {getCompaniesInStage(stage.id).map(company => (
                <Card key={company.biz_id || company.name} className="bg-white hover:shadow-md transition-shadow cursor-move">
                  <CardContent className="p-4">
                    <div className="font-medium">{company.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {company.city}, {company.state}
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Est. Value:</span> $2,500
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getCompaniesInStage(stage.id).length === 0 && (
                <div className="p-4 border border-dashed rounded-lg text-center text-gray-400">
                  No companies in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
