import Input from './Input'

export default function SearchInput({ value, onChange, placeholder = 'Cari...' }) {
  return (
    <div className="mb-4 max-w-sm">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}