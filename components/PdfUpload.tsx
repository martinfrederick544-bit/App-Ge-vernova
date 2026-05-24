'use client'

import { useRef, useState } from 'react'

interface PdfUploadProps {
  value: File | null
  onChange: (file: File | null) => void
}

export default function PdfUpload({ value, onChange }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File | null) {
    if (!file) return
    if (file.type !== 'application/pdf') return
    onChange(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0] ?? null
    handleFile(file)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
          dragging
            ? 'border-gev-500 bg-gev-50'
            : value
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />

        {value ? (
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-green-800 truncate">{value.name}</p>
              <p className="text-xs text-green-600">{(value.size / 1024).toFixed(0)} Ko</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="ml-2 text-green-500 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <svg className="mx-auto w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gev-500">Cliquez pour choisir</span>{' '}
              ou glissez-déposez
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF uniquement · max 10 Mo</p>
          </div>
        )}
      </div>
    </div>
  )
}
