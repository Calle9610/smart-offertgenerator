interface StatusChipProps {
  status: string
  className?: string
}

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return {
          label: 'Utkast',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        }
      case 'sent':
        return {
          label: 'Skickad',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300'
        }
      case 'accepted':
        return {
          label: 'Accepterad',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300'
        }
      case 'declined':
        return {
          label: 'Avböjt',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300'
        }
      case 'reviewed':
        return {
          label: 'Granskad',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300'
        }
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  )
} 
