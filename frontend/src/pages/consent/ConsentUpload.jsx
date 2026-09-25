import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Card from '../../components/Card'

export default function ConsentUpload() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const handleUpload = async () => {
    if (!file) {
      toast.error('Pilih file .json atau .zip terlebih dahulu')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(`/consent/${token}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data.data)
      toast.success(data.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto py-8">
        <Card className="mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-1">
            Upload Data
          </h2>
          <p className="text-sm text-text-secondary">
            Pilih file .json atau .zip (export Google My Activity) untuk dianalisis.
          </p>
        </Card>

        {!result ? (
          <Card className="p-6 text-center">
            <input
              type="file"
              accept=".json,.zip"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded file:bg-surface-secondary file:text-text-primary file:cursor-pointer"
            />
            <Button
              className="mt-4 w-full"
              onClick={handleUpload}
              loading={uploading}
              disabled={!file}
            >
              Unggah & Analisis
            </Button>
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Analisis selesai
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                Entri dianalisis:{' '}
                <span className="font-medium">{result.entries_count}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => navigate('/assessor/assessments')}
            >
              Kembali ke Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
