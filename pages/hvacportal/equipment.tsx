import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Equipment, EquipmentType, EquipmentTypeLabels } from '@/types/equipment';
import EquipmentForm from '@/components/hvac/EquipmentForm';

export default function EquipmentPage() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch equipment from the API
  useEffect(() => {
    async function fetchEquipment() {
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Create demo equipment for initial preview
        const demoEquipment: Equipment[] = [
          {
            id: 1,
            company_id: 'demo-company',
            contact_id: 1,
            equipment_type: 'air_conditioner',
            make: 'Carrier',
            model: 'Infinity 26',
            serial_number: 'AC298374662',
            installation_date: '2020-05-15',
            btu_rating: 36000,
            tonnage: 3.0,
            efficiency_rating: '26 SEER',
            refrigerant_type: 'R-410A',
            location: 'Backyard',
            notes: 'Premium high-efficiency unit installed after customer had issues with previous builder-grade system.',
            warranty_expiration: '2030-05-15',
            warranty_details: '10 year parts, 10 year compressor',
            last_service_date: '2023-04-10',
            next_service_date: '2024-04-10',
            image_url: null,
            created_at: '2020-05-15T10:30:00Z',
            updated_at: '2023-04-10T14:22:15Z',
            service_status: 'good',
            warranty_status: 'active'
          },
          {
            id: 2,
            company_id: 'demo-company',
            contact_id: 1,
            equipment_type: 'furnace',
            make: 'Trane',
            model: 'XR80',
            serial_number: 'TNF87652310',
            installation_date: '2018-10-05',
            btu_rating: 80000,
            tonnage: null,
            efficiency_rating: '80% AFUE',
            refrigerant_type: null,
            location: 'Basement',
            notes: 'Standard efficiency furnace. Customer interested in upgrading to high-efficiency model in the future.',
            warranty_expiration: '2028-10-05',
            warranty_details: '10 year parts, lifetime heat exchanger',
            last_service_date: '2022-11-15',
            next_service_date: '2023-11-15',
            image_url: null,
            created_at: '2018-10-05T15:45:22Z',
            updated_at: '2022-11-15T09:33:47Z',
            service_status: 'due_soon',
            warranty_status: 'active'
          },
          {
            id: 3,
            company_id: 'demo-company',
            contact_id: 2,
            equipment_type: 'heat_pump',
            make: 'Lennox',
            model: 'Elite Series',
            serial_number: 'LX45697823',
            installation_date: '2021-03-20',
            btu_rating: 24000,
            tonnage: 2.0,
            efficiency_rating: '18 SEER',
            refrigerant_type: 'R-410A',
            location: 'Side yard',
            notes: 'Installed as part of energy efficiency upgrade program.',
            warranty_expiration: '2031-03-20',
            warranty_details: '10 year parts and labor',
            last_service_date: '2023-03-15',
            next_service_date: '2024-03-15',
            image_url: null,
            created_at: '2021-03-20T09:15:00Z',
            updated_at: '2023-03-15T11:45:30Z',
            service_status: 'good',
            warranty_status: 'active'
          },
          {
            id: 4,
            company_id: 'demo-company',
            contact_id: 3,
            equipment_type: 'mini_split',
            make: 'Mitsubishi',
            model: 'Mr. Slim',
            serial_number: 'MS12345678',
            installation_date: '2022-06-10',
            btu_rating: 12000,
            tonnage: 1.0,
            efficiency_rating: '20 SEER',
            refrigerant_type: 'R-410A',
            location: 'Home office',
            notes: 'Installed for supplemental cooling in home office addition.',
            warranty_expiration: '2027-06-10',
            warranty_details: '5 year parts',
            last_service_date: null,
            next_service_date: '2023-06-10',
            image_url: null,
            created_at: '2022-06-10T14:30:00Z',
            updated_at: null,
            service_status: 'overdue',
            warranty_status: 'active'
          },
          {
            id: 5,
            company_id: 'demo-company',
            contact_id: 4,
            equipment_type: 'thermostats',
            make: 'Ecobee',
            model: 'Smart Thermostat Premium',
            serial_number: 'EB987654321',
            installation_date: '2023-01-15',
            btu_rating: null,
            tonnage: null,
            efficiency_rating: null,
            refrigerant_type: null,
            location: 'Living room',
            notes: 'Smart thermostat with remote sensors installed throughout the home.',
            warranty_expiration: '2025-01-15',
            warranty_details: '2 year manufacturer warranty',
            last_service_date: null,
            next_service_date: null,
            image_url: null,
            created_at: '2023-01-15T10:00:00Z',
            updated_at: null,
            service_status: 'unknown',
            warranty_status: 'active'
          }
        ];

        setEquipment(demoEquipment);
        setFilteredEquipment(demoEquipment);

        // Try to fetch from the API but don't block UI
        try {
          const response = await fetch(`/api/hvac/equipment?company_id=${storedBusinessSlug}`);
          const data = await response.json();
          
          if (data.success && data.equipment?.length > 0) {
            setEquipment(data.equipment);
            setFilteredEquipment(data.equipment);
          }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }

      } catch (err) {
        console.error('Error initializing equipment:', err);
        setError('Unable to load equipment data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEquipment();
  }, []);

  // Filter equipment by type and search query
  useEffect(() => {
    let filtered = equipment;
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(eq => eq.equipment_type === typeFilter);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(eq => 
        eq.make.toLowerCase().includes(query) ||
        eq.model.toLowerCase().includes(query) ||
        eq.serial_number.toLowerCase().includes(query) ||
        (eq.location && eq.location.toLowerCase().includes(query))
      );
    }
    
    setFilteredEquipment(filtered);
  }, [typeFilter, searchQuery, equipment]);

  // Get equipment type label
  const getTypeLabel = (type: string): string => {
    return EquipmentTypeLabels[type as EquipmentType] || type;
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Handle adding new equipment
  const handleAddEquipment = () => {
    setShowCreateModal(true);
  };

  // Handle view equipment details
  const handleViewEquipment = (equipmentId: number) => {
    router.push(`/hvacportal/equipment/${equipmentId}`);
  };

  // Get status badge style
  const getServiceStatusStyle = (status: string | undefined) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyStatusStyle = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        {/* Header with search and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
            <p className="mt-1 text-sm text-gray-500">Manage customer equipment and maintenance schedules</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search equipment..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              onClick={handleAddEquipment}
            >
              + Add Equipment
            </Button>
          </div>
        </div>

        {/* Type filter tabs */}
        <div className="flex overflow-x-auto pb-2 space-x-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </button>
          {Object.entries(EquipmentTypeLabels).map(([type, label]) => (
            <button
              key={type}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                typeFilter === type ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setTypeFilter(type)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Equipment List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                <p className="mt-3 text-gray-500">Loading equipment data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <EmptyEquipmentState onAddEquipment={handleAddEquipment} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map(item => (
                <EquipmentCard 
                  key={item.id} 
                  equipment={item} 
                  onView={() => handleViewEquipment(item.id)}
                  getTypeLabel={getTypeLabel}
                  formatDate={formatDate}
                  getServiceStatusStyle={getServiceStatusStyle}
                  getWarrantyStatusStyle={getWarrantyStatusStyle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Creation Modal */}
      {showCreateModal && (
        <EquipmentForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={async (equipmentData) => {
            try {
              // In a real implementation, this would call the API
              // Mock creating a new equipment record
              const newEquipment = {
                ...equipmentData,
                id: equipment.length > 0 ? Math.max(...equipment.map(e => e.id)) + 1 : 1,
                created_at: new Date().toISOString(),
                updated_at: null,
                service_status: 'unknown',
                warranty_status: equipmentData.warranty_expiration ? 'active' : 'unknown'
              } as Equipment;

              // Add to local state
              setEquipment([newEquipment, ...equipment]);

              // Close modal and show success message
              alert('Equipment added successfully!');
            } catch (err: any) {
              console.error('Error saving equipment:', err);
              alert('Error adding equipment: ' + (err.message || 'Unknown error'));
            }
          }}
          businessId={businessSlug || 'demo-company'}
        />
      )}
    </PortalLayout>
  );
}

// Empty state component
function EmptyEquipmentState({ onAddEquipment }: { onAddEquipment: () => void }) {
  return (
    <Card className="border border-dashed">
      <CardContent className="py-12">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No equipment found</h3>
          <p className="mt-2 text-gray-500">
            {`No equipment records match your search criteria. Try adjusting your filters or add new equipment.`}
          </p>
          <Button
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onAddEquipment}
          >
            + Add Equipment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Equipment card component
function EquipmentCard({ 
  equipment, 
  onView,
  getTypeLabel,
  formatDate,
  getServiceStatusStyle,
  getWarrantyStatusStyle
}: { 
  equipment: Equipment, 
  onView: () => void,
  getTypeLabel: (type: string) => string,
  formatDate: (date: string | null) => string,
  getServiceStatusStyle: (status: string | undefined) => string,
  getWarrantyStatusStyle: (status: string | undefined) => string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                {getTypeLabel(equipment.equipment_type)}
              </span>
              {equipment.service_status && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${getServiceStatusStyle(equipment.service_status)}`}>
                  {equipment.service_status === 'good' ? 'Serviced' : 
                   equipment.service_status === 'due_soon' ? 'Service Due Soon' : 
                   equipment.service_status === 'overdue' ? 'Service Overdue' : 'Service Status Unknown'}
                </span>
              )}
            </div>
          </div>
          
          <h3 className="font-medium text-gray-900 mb-1 flex items-center">
            <span className="flex-1">{equipment.make} {equipment.model}</span>
            {equipment.warranty_status && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getWarrantyStatusStyle(equipment.warranty_status)}`}>
                {equipment.warranty_status === 'active' ? 'In Warranty' : 
                 equipment.warranty_status === 'expired' ? 'Warranty Expired' : 'Warranty Unknown'}
              </span>
            )}
          </h3>
          
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex">
              <span className="text-gray-500 w-28">Serial Number:</span>
              <span className="text-gray-900 font-medium">{equipment.serial_number}</span>
            </div>
            
            <div className="flex">
              <span className="text-gray-500 w-28">Installation:</span>
              <span className="text-gray-900">{formatDate(equipment.installation_date)}</span>
            </div>
            
            <div className="flex">
              <span className="text-gray-500 w-28">Location:</span>
              <span className="text-gray-900">{equipment.location || 'Not specified'}</span>
            </div>
            
            {equipment.efficiency_rating && (
              <div className="flex">
                <span className="text-gray-500 w-28">Efficiency:</span>
                <span className="text-gray-900">{equipment.efficiency_rating}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Last Service: {equipment.last_service_date ? formatDate(equipment.last_service_date) : 'None'}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); onView(); }}
              className="text-emerald-600 hover:text-emerald-800 hover:underline text-sm font-medium"
            >
              View Details →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}