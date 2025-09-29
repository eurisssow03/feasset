import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export default function ReservationDetailPage() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reservation Details</h1>
        <p className="text-gray-600">Reservation ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservation Information</CardTitle>
          <CardDescription>Detailed view of the reservation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500">Reservation detail view will be implemented here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
