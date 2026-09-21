import Card from '../../components/Card'
import EmptyState from '../../components/EmptyState'
import Button from '../../components/Button'
import { Plus } from 'lucide-react'

export default function Reports() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-text-primary">Laporan</h1>
      </div>
      <Card>
        <EmptyState message="Halaman Laporan belum tersedia." action={<Button onClick={() => {}}><Plus size={14} /> Tambah</Button>} />
      </Card>
    </div>
  )
}