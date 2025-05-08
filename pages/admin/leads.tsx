import { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Company } from '@/types';

export default function LeadsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();
  
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('name');
      
      if (data) {
        setCompanies(data);
      }
    };
    
    fetchCompanies();
  }, []);
  
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.city && company.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <AdminLayout>
      <Head>
        <title>Leads CRM | HVAC Sites</title>
      </Head>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leads & CRM</h1>
        <Button>Add New Lead</Button>
      </div>
      
      <div className="mb-6">
        <Input 
          type="text" 
          placeholder="Search leads..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredCompanies.map(company => (
          <Card key={company.biz_id || company.name} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>{company.name}</span>
                <span className="text-sm font-normal px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {company.city}, {company.state}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div>{company.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Rating</div>
                  <div>{company.rating || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Next Action</div>
                  <div>Follow up call</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" className="mr-2">View Details</Button>
                <Button size="sm">Add to Pipeline</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
