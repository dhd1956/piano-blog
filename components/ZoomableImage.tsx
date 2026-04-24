'use client'

import { useState } from 'react'
import NextImage, { ImageProps } from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

const basePath = process.env.BASE_PATH

export default function ZoomableImage({ src, alt, ...rest }: ImageProps) {
  const [open, setOpen] = useState(false)
  const fullSrc = `${basePath || ''}${src}`

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        className="cursor-zoom-in border-0 bg-transparent p-0"
        aria-label={`View full size: ${alt ?? 'image'}`}
      >
        <NextImage src={fullSrc} alt={alt ?? ''} {...rest} />
      </button>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: fullSrc, alt: alt as string | undefined }]}
        styles={{ container: { backgroundColor: 'rgba(0,0,0,0.85)' } }}
        controller={{ closeOnBackdropClick: true }}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
        }}
      />
    </>
  )
}
