import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

interface Location {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LocationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: Partial<Location>) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setShowAddForm(false);
      toast.success('Location created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create location');
    },
  });

  // Update location mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Location> }) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setEditingLocation(null);
      toast.success('Location updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update location');
    },
  });

  // Filter locations based on search term
  const filteredLocations = locations.filter((location: any) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddLocation = (locationData: Partial<Location>) => {
    createLocationMutation.mutate(locationData);
  };

  const handleUpdateLocation = (id: string, locationData: Partial<Location>) => {
    updateLocationMutation.mutate({ id, data: locationData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading locations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600">Manage homestay locations and properties</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations ({filteredLocations.length})</CardTitle>
          <CardDescription>View and manage all homestay locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search locations..."
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
          
          {filteredLocations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No locations found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((location: any) => (
                <Card key={location.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{location.name}</h3>
                          <p className="text-sm text-gray-500">Location</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLocation(location)}
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
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          location.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {location.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created {new Date(location.createdAt).toLocaleDateString()}
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

      {/* Add Location Modal */}
      {showAddForm && (
        <AddLocationModal
          onClose={() => setShowAddForm(false)}
          onSave={handleAddLocation}
          isLoading={createLocationMutation.isPending}
        />
      )}

      {/* Edit Location Modal */}
      {editingLocation && (
        <EditLocationModal
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSave={handleUpdateLocation}
          isLoading={updateLocationMutation.isPending}
        />
      )}
    </div>
  );
}

// Add Location Modal Component
function AddLocationModal({ onClose, onSave, isLoading }: {
  onClose: () => void;
  onSave: (data: Partial<Location>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    isActive: true,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Location</CardTitle>
          <CardDescription>Create a new homestay location</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Location Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                placeholder="e.g., Downtown Office, Main Building"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e: any) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm">Active Location</label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Location'}
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

// Edit Location Modal Component
function EditLocationModal({ location, onClose, onSave, isLoading }: {
  location: Location;
  onClose: () => void;
  onSave: (id: string, data: Partial<Location>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: location.name,
    isActive: location.isActive,
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(location.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Edit Location</CardTitle>
          <CardDescription>Update location information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Location Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e: any) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm">Active Location</label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Updating...' : 'Update Location'}
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
