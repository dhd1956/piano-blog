'use client'

import { useState } from 'react'
import type React from 'react'
import NextImage, { ImageProps } from 'next/image'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

const basePath = process.env.BASE_PATH

export default function ZoomableImage({ src, alt, width, height, ...rest }: ImageProps) {
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
        {width && height ? (
          <NextImage src={fullSrc} alt={alt ?? ''} width={width} height={height} {...rest} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fullSrc as string}
            alt={alt ?? ''}
            style={{ maxWidth: '100%', display: 'block' }}
            {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)}
          />
        )}
      </button>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src: fullSrc as string, alt: alt as string | undefined }]}
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
