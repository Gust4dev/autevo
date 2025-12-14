'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect to report page by default
export default function InspectionPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const inspectionId = params.inspectionId as string;

  useEffect(() => {
    // Redirect to the report view
    router.replace(`/dashboard/orders/${orderId}/inspection/${inspectionId}/report`);
  }, [orderId, inspectionId, router]);

  return null;
}
