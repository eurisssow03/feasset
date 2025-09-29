import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export default function GuestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guests</h1>
          <p className="text-gray-600">Manage guest information and profiles</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guests</CardTitle>
          <CardDescription>View and manage all guest profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search guests..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          <div className="text-center py-12">
            <p className="text-gray-500">Guests list will be implemented here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
