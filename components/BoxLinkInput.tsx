'use client'

import { useState } from 'react'
import { isValidBoxUrl } from '@/lib/validate-box-url'
import clsx from 'clsx'

interface BoxLinkInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  id?: string
}

export default function BoxLinkInput({
  value,
  onChange,
  required,
  id = 'box_url',
}: BoxLinkInputProps) {
  const [touched, setTouched] = useState(false)

  const isValid = !value || isValidBoxUrl(value)
  const showError = touched && value && !isValid

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          required={required}
          placeholder="https://gevernova.box.com/s/..."
          className={clsx(
            'form-input pr-9',
            showError && 'ring-red-500 focus:ring-red-500',
            touched && value && isValid && 'ring-green-500 focus:ring-green-500'
          )}
        />
        {touched && value && (
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            {isValid ? (
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        )}
      </div>

      {showError && (
        <p className="mt-1 text-xs text-red-600">
          Le lien doit commencer par{' '}
          <code className="font-mono">https://gevernova.box.com/</code>,{' '}
          <code className="font-mono">https://gehealthcare.box.com/</code> ou{' '}
          <code className="font-mono">https://app.box.com/</code>
        </p>
      )}

      <p className="mt-1 text-xs text-gray-500">
        Collez le lien de partage Box de votre PDF
      </p>
    </div>
  )
}
