import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Edit,
  Trash,
  Plus,
  X
} from 'lucide-react';

import MainLayout from '@/components/dashboard/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Contact, Equipment } from '@/types/contact';

// Note interface
interface Note {
  id: string;
  date: string;
  content: string;
  createdBy: string;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const { slug, id } = router.query;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  
  // Refs for equipment form
  const equipmentNameRef = useRef<HTMLInputElement>(null);
  const equipmentModelRef = useRef<HTMLInputElement>(null);
  const equipmentSerialRef = useRef<HTMLInputElement>(null);
  const equipmentStatusRef = useRef<HTMLSelectElement>(null);
  
  // Refs for note form
  const noteContentRef = useRef<HTMLTextAreaElement>(null);
  
  // Load contact data
  useEffect(() => {
    if (!id) return;
    
    // Simulate API call to fetch contact details
    setTimeout(() => {
      const mockContact: Contact = {
        id: id as string,
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john.smith@example.com',
        address: '123 Main St, Anytown, CA 95012',
        customer_since: '2020-03-15',
        type: 'residential'
      };
      
      // Mock equipment data
      const mockEquipment: Equipment[] = [
        {
          id: 'e1',
          name: 'Central AC Unit',
          model: 'Carrier Comfort 14',
          serial: 'AC1425367',
          installed: '2020-07-15',
          last_service: '2023-04-10',
          status: 'active'
        },
        {
          id: 'e2',
          name: 'Gas Furnace',
          model: 'Trane XC95m',
          serial: 'TF9523476',
          installed: '2020-07-15',
          last_service: '2023-04-10',
          status: 'maintenance'
        }
      ];
      
      // Mock notes data
      const mockNotes: Note[] = [
        {
          id: 'n1',
          date: '2023-09-15',
          content: 'Customer called about AC making strange noise. Scheduled maintenance visit for next week.',
          createdBy: 'Mike Johnson'
        },
        {
          id: 'n2',
          date: '2023-08-02',
          content: 'Customer signed up for annual maintenance plan. Provided 10% discount on future services.',
          createdBy: 'Sarah Lee'
        }
      ];
      
      setContact(mockContact);
      setEquipment(mockEquipment);
      setNotes(mockNotes);
      setLoading(false);
    }, 500);
  }, [id]);
  
  // Handle adding new equipment
  const handleAddEquipment = () => {
    if (!equipmentNameRef.current?.value) return;
    
    const newEquipment: Equipment = {
      id: `e${equipment.length + 1}`,
      name: equipmentNameRef.current.value,
      model: equipmentModelRef.current?.value || '',
      serial: equipmentSerialRef.current?.value || '',
      installed: new Date().toISOString().split('T')[0],
      last_service: new Date().toISOString().split('T')[0],
      status: (equipmentStatusRef.current?.value as 'active' | 'maintenance' | 'repair_needed' | 'replaced') || 'active'
    };
    
    setEquipment([...equipment, newEquipment]);
    setShowAddEquipment(false);
  };
  
  // Handle adding new note
  const handleAddNote = () => {
    if (!noteContentRef.current?.value) return;
    
    const newNote: Note = {
      id: `n${notes.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      content: noteContentRef.current.value,
      createdBy: 'Current User'
    };
    
    setNotes([...notes, newNote]);
    setShowAddNote(false);
  };
  
  // Format date helper function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  // Go back to contacts list
  const handleBack = () => {
    router.push(`/dashboard/${slug}/contacts`);
  };
  
  // Delete equipment
  const handleDeleteEquipment = (id: string) => {
    setEquipment(equipment.filter(item => item.id !== id));
  };
  
  // Delete note
  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };
  
  if (loading) {
    return (
      <MainLayout title="Contact Details">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      </MainLayout>
    );
  }
  
  if (!contact) {
    return (
      <MainLayout title="Contact Details">
        <div className="text-center p-8">
          <p className="text-gray-600">Contact not found.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Contacts
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Contact Details">
      <Head>
        <title>{contact.name} - HVAC Pro</title>
        <meta name="description" content={`Contact details for ${contact.name}`} />
      </Head>
      
      <div>
        {/* Page header with back button */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="mr-2 p-2" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Contact Details</h1>
            <p className="text-sm text-gray-500">
              View and manage contact information
            </p>
          </div>
        </div>
        
        {/* Contact header */}
        <div className="bg-white border border-gray-200 rounded-md mb-6">
          <div className="p-6 flex flex-wrap md:flex-nowrap justify-between items-start gap-4">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl">
                {getInitials(contact.name)}
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-medium text-gray-900">{contact.name}</h2>
                <div className="flex flex-wrap items-center mt-1 gap-3">
                  <Badge variant="outline" className={
                    contact.type === 'residential' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-green-50 text-green-700 border-green-200'
                  }>
                    {contact.type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Customer since {formatDate(contact.customer_since)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-gray-700 h-9">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="text-gray-700 h-9">
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="text-gray-700 h-9">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-9 text-white">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs navigation */}
        <Tabs defaultValue="details" className="w-full">
          <div className="border-b border-gray-200 mb-6">
            <TabsList className="w-full justify-start bg-transparent p-0 border-0">
              <TabsTrigger 
                value="details" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Contact Details
              </TabsTrigger>
              <TabsTrigger 
                value="equipment" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Equipment ({equipment.length})
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none py-3 px-6"
              >
                Notes ({notes.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab contents */}
          <TabsContent value="details" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Phone</div>
                      <div className="mt-1">
                        <a href={`tel:${contact.phone}`} className="text-gray-900 hover:text-blue-600">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="mt-1">
                        <a href={`mailto:${contact.email}`} className="text-gray-900 hover:text-blue-600">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Address</div>
                  <div className="mt-1">
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(contact.address)}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-blue-600 flex items-start"
                    >
                      <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-gray-400" />
                      <span>{contact.address}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="equipment" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Equipment</h3>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowAddEquipment(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equipment
                </Button>
              </div>
              
              <div className="space-y-6">
                {equipment.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded">
                    <p className="text-gray-500">No equipment recorded for this contact.</p>
                    <Button 
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAddEquipment(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>
                ) : (
                  equipment.map(item => (
                    <div key={item.id} className="border rounded-md p-4">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={
                            item.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                            item.status === 'maintenance' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            item.status === 'repair_needed' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }>
                            {item.status === 'repair_needed' ? 'Needs Repair' : 
                            item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                          <button 
                            onClick={() => handleDeleteEquipment(item.id)} 
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-500">Model</div>
                          <div className="text-gray-900">{item.model}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">Serial</div>
                          <div className="text-gray-900">{item.serial}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">Installed</div>
                          <div className="text-gray-900">{formatDate(item.installed)}</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-500">Last Service</div>
                          <div className="text-gray-900">{formatDate(item.last_service)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="m-0">
            <div className="bg-white border border-gray-200 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notes</h3>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowAddNote(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded">
                    <p className="text-gray-500">No notes available for this contact.</p>
                    <Button 
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setShowAddNote(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <div className="text-sm text-gray-500">
                          {formatDate(note.date)} by <span className="font-medium">{note.createdBy}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteNote(note.id)} 
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add Equipment Dialog */}
      <Dialog open={showAddEquipment} onOpenChange={setShowAddEquipment}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>
              Enter the details of the equipment below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment-name" className="text-right">
                Name
              </Label>
              <Input
                id="equipment-name"
                ref={equipmentNameRef}
                placeholder="Central AC Unit"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment-model" className="text-right">
                Model
              </Label>
              <Input
                id="equipment-model"
                ref={equipmentModelRef}
                placeholder="Carrier Comfort 14"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment-serial" className="text-right">
                Serial
              </Label>
              <Input
                id="equipment-serial"
                ref={equipmentSerialRef}
                placeholder="AC1425367"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="equipment-status" className="text-right">
                Status
              </Label>
              <select
                id="equipment-status"
                ref={equipmentStatusRef}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue="active"
              >
                <option value="active">Active</option>
                <option value="maintenance">Needs Maintenance</option>
                <option value="repair_needed">Needs Repair</option>
                <option value="replaced">Replaced</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddEquipment(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddEquipment}
            >
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
            <DialogDescription>
              Enter your note below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 items-center gap-4">
              <Label htmlFor="note-content">
                Note Content
              </Label>
              <Textarea
                id="note-content"
                ref={noteContentRef}
                placeholder="Enter details about this customer..."
                className="h-32"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddNote(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddNote}
            >
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}