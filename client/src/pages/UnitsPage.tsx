import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, MapPin, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

interface Unit {
  id: string;
  name: string;
  code: string;
  address: string;
  active: boolean;
  calendarId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UnitsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const queryClient = useQueryClient();

  // Fetch units
  const { data: units = [], isLoading } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await fetch('/api/units');
      if (!response.ok) throw new Error('Failed to fetch units');
      return response.json();
    },
  });

  // Create unit mutation
  const createUnitMutation = useMutation({
    mutationFn: async (unitData: Partial<Unit>) => {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitData),
      });
      if (!response.ok) throw new Error('Failed to create unit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setShowAddForm(false);
      toast.success('Unit created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create unit');
    },
  });

  // Update unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Unit> }) => {
      const response = await fetch(`/api/units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update unit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setEditingUnit(null);
      toast.success('Unit updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update unit');
    },
  });

  // Filter units based on search term
  const filteredUnits = units.filter((unit: any) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUnit = (unitData: Partial<Unit>) => {
    createUnitMutation.mutate(unitData);
  };

  const handleUpdateUnit = (id: string, unitData: Partial<Unit>) => {
    updateUnitMutation.mutate({ id, data: unitData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Units</h1>
          <p className="text-gray-600">Manage homestay units and properties</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Unit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Units ({filteredUnits.length})</CardTitle>
          <CardDescription>View and manage all homestay units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No units found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUnits.map((unit: any) => (
                <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        <CardDescription className="text-sm text-gray-500">
                          {unit.code}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUnit(unit)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        {unit.address}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {unit.calendarId ? 'Calendar synced' : 'No calendar sync'}
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          unit.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {unit.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Modal */}
      {showAddForm && (
        <AddUnitModal
          onClose={() => setShowAddForm(false)}
          onSave={handleAddUnit}
          isLoading={createUnitMutation.isPending}
        />
      )}

      {/* Edit Unit Modal */}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSave={handleUpdateUnit}
          isLoading={updateUnitMutation.isPending}
        />
      )}
    </div>
  );
}

// Add Unit Modal Component
function AddUnitModal({ onClose, onSave, isLoading }: {
  onClose: () => void;
  onSave: (data: Partial<Unit>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    active: true,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Unit</CardTitle>
          <CardDescription>Create a new homestay unit</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Unit Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Unit Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e: any) => setFormData({ ...formData, code: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea
                value={formData.address}
                onChange={(e: any) => setFormData({ ...formData, address: e.target.value })}
                className="input w-full"
                rows={3}
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e: any) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Unit'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Unit Modal Component
function EditUnitModal({ unit, onClose, onSave, isLoading }: {
  unit: Unit;
  onClose: () => void;
  onSave: (id: string, data: Partial<Unit>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: unit.name,
    code: unit.code,
    address: unit.address,
    active: unit.active,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(unit.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Unit</CardTitle>
          <CardDescription>Update unit information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Unit Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Unit Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e: any) => setFormData({ ...formData, code: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea
                value={formData.address}
                onChange={(e: any) => setFormData({ ...formData, address: e.target.value })}
                className="input w-full"
                rows={3}
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e: any) => setFormData({ ...formData, active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Updating...' : 'Update Unit'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
