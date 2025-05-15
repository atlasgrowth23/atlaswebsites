import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Calendar,
  Tool,
  Download
} from 'lucide-react';
import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

export default function ReportsPage() {
  const router = useRouter();
  const { company } = router.query;
  
  return (
    <MainLayout title="Reports">
      <Head>
        <title>Reports - HVAC Pro</title>
        <meta name="description" content="Financial and performance reports" />
      </Head>
      
      <div>
        {/* Page header */}
        <div className="border-b border-gray-200 pb-5 mb-5 flex flex-wrap items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Financial and performance analytics
            </p>
          </div>
          <div className="mt-3 sm:mt-0 flex space-x-3">
            <Button variant="outline" className="text-gray-700">
              <Calendar className="h-4 w-4 mr-2" />
              Change Period
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </div>
        </div>
        
        {/* Report stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$148,500</div>
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" /> 
                <span>+18% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94</div>
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" /> 
                <span>+8% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">New Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28</div>
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" /> 
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Avg. Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8 hours</div>
              <div className="flex items-center mt-2 text-green-600 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" /> 
                <span>15% faster than last month</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Reports tabs */}
        <Tabs defaultValue="financial" className="w-full">
          <TabsList className="w-full max-w-md justify-start mb-6">
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>
          
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-medium">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Revenue by Service Type
                </CardTitle>
                <CardDescription>
                  Breakdown of revenue by different service categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {/* Placeholder for chart */}
                  <div className="h-full flex items-center justify-center border border-dashed rounded-md">
                    <div className="text-center">
                      <BarChart3 className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Bar chart would be displayed here</p>
                      <p className="text-sm text-gray-400 mt-1">Showing revenue by service type</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-center">
                  <div>
                    <div className="font-medium text-blue-600">Installation</div>
                    <div className="text-xl font-bold">$64,800</div>
                    <div className="text-sm text-gray-500">43.6% of total</div>
                  </div>
                  <div>
                    <div className="font-medium text-yellow-600">Repair</div>
                    <div className="text-xl font-bold">$42,300</div>
                    <div className="text-sm text-gray-500">28.5% of total</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">Maintenance</div>
                    <div className="text-xl font-bold">$31,400</div>
                    <div className="text-sm text-gray-500">21.1% of total</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">Emergency</div>
                    <div className="text-xl font-bold">$10,000</div>
                    <div className="text-sm text-gray-500">6.8% of total</div>
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-medium">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Monthly Revenue Trend
                </CardTitle>
                <CardDescription>
                  Revenue trend over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  {/* Placeholder for chart */}
                  <div className="h-full flex items-center justify-center border border-dashed rounded-md">
                    <div className="text-center">
                      <TrendingUp className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Line chart would be displayed here</p>
                      <p className="text-sm text-gray-400 mt-1">Showing monthly revenue trend</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-medium">
                  <Tool className="h-5 w-5 mr-2 text-blue-600" />
                  Technician Performance
                </CardTitle>
                <CardDescription>
                  Metrics for individual technician performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Mike Johnson</div>
                      <div className="text-green-600 font-medium">96% Customer Satisfaction</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Jobs Completed</div>
                        <div className="font-bold">42</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg. Job Duration</div>
                        <div className="font-bold">2.3 hours</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Revenue Generated</div>
                        <div className="font-bold">$68,400</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">David Wilson</div>
                      <div className="text-green-600 font-medium">92% Customer Satisfaction</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Jobs Completed</div>
                        <div className="font-bold">38</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg. Job Duration</div>
                        <div className="font-bold">2.6 hours</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Revenue Generated</div>
                        <div className="font-bold">$54,300</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Sarah Lee</div>
                      <div className="text-green-600 font-medium">94% Customer Satisfaction</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Jobs Completed</div>
                        <div className="font-bold">14</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg. Job Duration</div>
                        <div className="font-bold">2.1 hours</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Revenue Generated</div>
                        <div className="font-bold">$25,800</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-medium">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Customer Growth
                </CardTitle>
                <CardDescription>
                  New customer acquisition over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  {/* Placeholder for chart */}
                  <div className="h-full flex items-center justify-center border border-dashed rounded-md">
                    <div className="text-center">
                      <Users className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Line chart would be displayed here</p>
                      <p className="text-sm text-gray-400 mt-1">Showing customer growth over time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-medium">
                  <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                  Customer Revenue Analysis
                </CardTitle>
                <CardDescription>
                  Revenue breakdown by customer segments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Customer Type</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Residential</span>
                          <span className="font-medium">$102,300</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '69%' }}></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">69% of total revenue</div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Commercial</span>
                          <span className="font-medium">$46,200</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-600 rounded-full" style={{ width: '31%' }}></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">31% of total revenue</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-4">Customer Loyalty</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>New Customers</span>
                          <span className="font-medium">$28,500</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-600 rounded-full" style={{ width: '19%' }}></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">19% of total revenue</div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>Returning Customers</span>
                          <span className="font-medium">$120,000</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '81%' }}></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">81% of total revenue</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}