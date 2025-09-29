import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Edit, Trash2, Sparkles, Calendar, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

interface CleaningTask {
  id: string;
  unit: {
    id: string;
    name: string;
    code: string;
  };
  reservation?: {
    id: string;
    guest: {
      fullName: string;
    };
    checkOut: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  scheduledDate: string;
  status: string;
  priority: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const statusIcons = {
  PENDING: Clock,
  ASSIGNED: User,
  IN_PROGRESS: Sparkles,
  DONE: CheckCircle,
  FAILED: XCircle,
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800',
  URGENT: 'bg-purple-100 text-purple-800',
};

export default function CleaningsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);
  const queryClient = useQueryClient();

  // Fetch cleaning tasks
  const { data: tasks = [], isLoading } = useQuery<CleaningTask[]>({
    queryKey: ['cleanings'],
    queryFn: async () => {
      const response = await fetch('/api/cleanings');
      if (!response.ok) throw new Error('Failed to fetch cleaning tasks');
      return response.json();
    },
  });

  // Create cleaning task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<CleaningTask>) => {
      const response = await fetch('/api/cleanings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error('Failed to create cleaning task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleanings'] });
      setShowAddForm(false);
      toast.success('Cleaning task created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create cleaning task');
    },
  });

  // Update cleaning task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CleaningTask> }) => {
      const response = await fetch(`/api/cleanings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update cleaning task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleanings'] });
      setEditingTask(null);
      toast.success('Cleaning task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update cleaning task');
    },
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task: any) => {
    const matchesSearch = 
      task.unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.unit.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.assignedTo && task.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleAddTask = (taskData: Partial<CleaningTask>) => {
    createTaskMutation.mutate(taskData);
  };

  const handleUpdateTask = (id: string, taskData: Partial<CleaningTask>) => {
    updateTaskMutation.mutate({ id, data: taskData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading cleaning tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cleaning Tasks</h1>
          <p className="text-gray-600">Manage cleaning schedules and tasks</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cleaning Tasks ({filteredTasks.length})</CardTitle>
          <CardDescription>View and manage all cleaning tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="FAILED">Failed</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
          
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No cleaning tasks found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task: any) => {
                const StatusIcon = statusIcons[task.status as keyof typeof statusIcons] || Clock;
                return (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{task.unit.name}</h3>
                          <p className="text-sm text-gray-600">{task.unit.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.MEDIUM}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[task.status as keyof typeof statusColors]}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {task.status.replace('_', ' ')}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setEditingTask(task)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">Scheduled Date</p>
                          <p>{new Date(task.scheduledDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {task.assignedTo && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          <div>
                            <p className="font-medium">Assigned To</p>
                            <p>{task.assignedTo.name}</p>
                          </div>
                        </div>
                      )}
                      {task.reservation && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div>
                            <p className="font-medium">Guest</p>
                            <p>{task.reservation.guest.fullName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {task.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {task.notes}
                        </p>
                      </div>
                    )}
                    
                    {task.completedAt && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Completed:</span> {new Date(task.completedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Modal */}
      {showAddForm && (
        <AddTaskModal
          onClose={() => setShowAddForm(false)}
          onSave={handleAddTask}
          isLoading={createTaskMutation.isPending}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleUpdateTask}
          isLoading={updateTaskMutation.isPending}
        />
      )}
    </div>
  );
}

// Add Task Modal Component
function AddTaskModal({ onClose, onSave, isLoading }: {
  onClose: () => void;
  onSave: (data: Partial<CleaningTask>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    unitId: '',
    assignedToId: '',
    scheduledDate: '',
    priority: 'MEDIUM',
    notes: '',
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Cleaning Task</CardTitle>
          <CardDescription>Create a new cleaning task</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Unit</label>
              <select
                value={formData.unitId}
                onChange={(e: any) => setFormData({ ...formData, unitId: e.target.value })}
                className="input w-full"
                required
              >
                <option value="">Select Unit</option>
                {/* Unit options would be populated from API */}
              </select>
            </div>
            <div>
              <label className="label">Assigned To</label>
              <select
                value={formData.assignedToId}
                onChange={(e: any) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="input w-full"
              >
                <option value="">Select Cleaner</option>
                {/* Cleaner options would be populated from API */}
              </select>
            </div>
            <div>
              <label className="label">Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e: any) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                className="input w-full"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Creating...' : 'Create Task'}
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

// Edit Task Modal Component
function EditTaskModal({ task, onClose, onSave, isLoading }: {
  task: CleaningTask;
  onClose: () => void;
  onSave: (id: string, data: Partial<CleaningTask>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    assignedToId: task.assignedTo?.id || '',
    scheduledDate: task.scheduledDate.split('T')[0],
    priority: task.priority,
    status: task.status,
    notes: task.notes || '',
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(task.id, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit Cleaning Task</CardTitle>
          <CardDescription>Update cleaning task information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Assigned To</label>
              <select
                value={formData.assignedToId}
                onChange={(e: any) => setFormData({ ...formData, assignedToId: e.target.value })}
                className="input w-full"
              >
                <option value="">Select Cleaner</option>
                {/* Cleaner options would be populated from API */}
              </select>
            </div>
            <div>
              <label className="label">Scheduled Date</label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e: any) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                value={formData.priority}
                onChange={(e: any) => setFormData({ ...formData, priority: e.target.value })}
                className="input w-full"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={formData.status}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                className="input w-full"
              >
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e: any) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Updating...' : 'Update Task'}
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
