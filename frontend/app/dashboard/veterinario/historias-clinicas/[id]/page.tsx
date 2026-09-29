import { ClinicalHistoryDetail } from '@/components/dashboard/VeterinarianOperations'
export default async function HistoriaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ClinicalHistoryDetail id={id} />
}
