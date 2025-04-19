"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'

type PageParams = {
  id: string
}

export default function ViewPage({
  params,
}: {
  params: PageParams | Promise<PageParams>
}) {
  const router = useRouter()
  const { id } = React.use(params as Promise<PageParams>)
  const imageId = decodeURIComponent(id)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </button>
        
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="relative w-full h-[80vh]">
            <img
              src={`/api/images?path=${encodeURIComponent(imageId)}`}
              alt="图片预览"
              className="object-contain w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 