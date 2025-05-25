'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'

type MarkdownRendererProps = {
  content: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{content.replaceAll("\n\n", "\n")}</ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer