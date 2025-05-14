import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface Equipment {
  id: string;
  type: string;
  brand: string;
  model: string;
  install_year: number;
  serial: string;
}

interface ContactEquipmentListProps {
  equipment: Equipment[];
  onAddEquipment: () => void;
}

const ContactEquipmentList: React.FC<ContactEquipmentListProps> = ({
  equipment,
  onAddEquipment
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Customer Equipment</h3>
        <Button size="sm" onClick={onAddEquipment}>
          <Plus className="h-4 w-4 mr-1" />
          Add Equipment
        </Button>
      </div>
      
      <div className="space-y-4">
        {equipment.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-md">
            <p className="text-gray-500">No equipment registered yet</p>
          </div>
        ) : (
          equipment.map(item => (
            <Card key={item.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-base">{item.type}</CardTitle>
                    <CardDescription className="text-sm">
                      {item.brand} {item.model}
                    </CardDescription>
                  </div>
                  <div>
                    <Badge variant="outline" className="text-xs">
                      Installed {item.install_year}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <div className="text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium text-gray-500">Serial: </span>
                      {item.serial}
                    </div>
                    
                    <div className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 px-2">
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactEquipmentList;