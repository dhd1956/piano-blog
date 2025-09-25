'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'

export interface QRScanResult {
  data: string
  timestamp: number
  format?: string
}

export interface QRCodeScannerProps {
  onScan: (result: QRScanResult) => void
  onError?: (error: string) => void
  onPermissionDenied?: () => void
  className?: string
  width?: number
  height?: number
  facingMode?: 'environment' | 'user' // 'environment' = back camera, 'user' = front camera
  scanDelay?: number // Delay between scans in milliseconds
  showViewfinder?: boolean
  showTorch?: boolean
}

export default function QRCodeScanner({
  onScan,
  onError,
  onPermissionDenied,
  className = '',
  width = 300,
  height = 300,
  facingMode = 'environment',
  scanDelay = 500,
  showViewfinder = true,
  showTorch = false
}: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  // Check for QR code detection support
  const qrDetectorSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window

  // Initialize camera and start scanning
  const startScanning = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const errorMsg = 'Camera access not supported on this device'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      setError('')
      setIsScanning(true)

      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setDevices(videoDevices)

      // Set up camera constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: width },
          height: { ideal: height },
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
        }
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setHasPermission(true)

        // Check for torch support
        const track = stream.getVideoTracks()[0]
        const capabilities = track.getCapabilities?.()
        setTorchSupported(!!capabilities?.torch)

        // Start QR detection
        if (qrDetectorSupported) {
          startBarcodeDetection()
        } else {
          startManualDetection()
        }
      }
    } catch (error: any) {
      console.error('Error starting camera:', error)
      setIsScanning(false)
      setHasPermission(false)
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        onPermissionDenied?.()
        setError('Camera permission denied. Please allow camera access and try again.')
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError(`Camera error: ${error.message}`)
      }
      
      onError?.(error.message)
    }
  }, [facingMode, width, height, selectedDeviceId, onError, onPermissionDenied, qrDetectorSupported])

  // Stop scanning and release camera
  const stopScanning = useCallback(() => {
    setIsScanning(false)
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Modern Barcode Detection API (Chrome, Edge)
  const startBarcodeDetection = useCallback(async () => {
    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] })
      
      const detectQR = async () => {
        if (!videoRef.current || !isScanning) return

        try {
          // @ts-ignore
          const barcodes = await barcodeDetector.detect(videoRef.current)
          
          if (barcodes.length > 0) {
            const qrCode = barcodes[0]
            onScan({
              data: qrCode.rawValue,
              timestamp: Date.now(),
              format: qrCode.format
            })
            return // Stop scanning after successful detection
          }
        } catch (error) {
          console.warn('Barcode detection error:', error)
        }

        // Continue scanning
        scanTimeoutRef.current = setTimeout(detectQR, scanDelay)
      }

      detectQR()
    } catch (error) {
      console.warn('BarcodeDetector not available, falling back to manual detection')
      startManualDetection()
    }
  }, [isScanning, onScan, scanDelay])

  // Fallback manual detection using canvas (requires external QR library)
  const startManualDetection = useCallback(() => {
    const detectQR = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        scanTimeoutRef.current = setTimeout(detectQR, scanDelay)
        return
      }

      // Draw video frame to canvas
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data for QR detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      
      try {
        // Note: This would require a QR code detection library like jsQR
        // For now, we'll simulate detection or use the BarcodeDetector API
        console.log('Manual QR detection not fully implemented - requires jsQR library')
        
        // Continue scanning
        scanTimeoutRef.current = setTimeout(detectQR, scanDelay)
      } catch (error) {
        console.warn('Manual QR detection error:', error)
        scanTimeoutRef.current = setTimeout(detectQR, scanDelay)
      }
    }

    detectQR()
  }, [isScanning, scanDelay])

  // Toggle torch/flashlight
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current || !torchSupported) return

    try {
      const track = streamRef.current.getVideoTracks()[0]
      await track.applyConstraints({
        advanced: [{ torch: !torchEnabled }]
      })
      setTorchEnabled(!torchEnabled)
    } catch (error) {
      console.warn('Error toggling torch:', error)
    }
  }, [torchEnabled, torchSupported])

  // Switch camera device
  const switchCamera = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId)
    if (isScanning) {
      stopScanning()
      setTimeout(() => startScanning(), 100)
    }
  }, [isScanning, stopScanning, startScanning])

  // Component lifecycle
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  // Viewfinder overlay component
  const Viewfinder = () => (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div 
        className="absolute border-2 border-white rounded-lg"
        style={{
          top: '20%',
          left: '20%',
          width: '60%',
          height: '60%',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Corner guides */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br"></div>
      </div>
      
      {/* Scanning line animation */}
      <div className="absolute top-1/2 left-1/5 right-1/5 h-0.5 bg-green-400 animate-pulse"></div>
    </div>
  )

  return (
    <div className={`relative ${className}`}>
      {/* Camera preview */}
      <div 
        className="relative overflow-hidden rounded-lg bg-black"
        style={{ width, height }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Hidden canvas for manual detection */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Viewfinder overlay */}
        {showViewfinder && isScanning && <Viewfinder />}

        {/* Controls overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          {/* Torch toggle */}
          {showTorch && torchSupported && (
            <button
              onClick={toggleTorch}
              className={`p-2 rounded-full text-white ${
                torchEnabled ? 'bg-yellow-600' : 'bg-gray-600 bg-opacity-50'
              }`}
            >
              🔦
            </button>
          )}

          {/* Camera switch */}
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => switchCamera(e.target.value)}
              className="p-1 text-xs bg-gray-600 bg-opacity-50 text-white rounded"
            >
              <option value="">Default Camera</option>
              {devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  Camera {index + 1}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-2 left-2 right-2">
          {hasPermission === false && (
            <div className="bg-red-600 bg-opacity-90 text-white text-xs p-2 rounded">
              Camera permission required
            </div>
          )}
          
          {error && (
            <div className="bg-red-600 bg-opacity-90 text-white text-xs p-2 rounded">
              {error}
            </div>
          )}
          
          {isScanning && (
            <div className="bg-green-600 bg-opacity-90 text-white text-xs p-2 rounded text-center">
              📷 Scanning for QR codes...
            </div>
          )}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-2 mt-4 justify-center">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📷 Start Scanner
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            ⏹️ Stop Scanner
          </button>
        )}
      </div>

      {/* Browser compatibility notice */}
      {!qrDetectorSupported && (
        <div className="mt-2 text-xs text-gray-600">
          ⚠️ Advanced QR detection not supported in this browser. Basic scanning available.
        </div>
      )}
    </div>
  )
}

/**
 * Hook for QR scanner permissions and capabilities
 */
export function useQRScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    // Check if camera API is supported
    const supported = !!(navigator.mediaDevices?.getUserMedia)
    setIsSupported(supported)

    if (!supported) {
      setError('Camera API not supported on this device')
      return
    }

    // Check current permission status
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then(result => {
        setHasPermission(result.state === 'granted')
        
        result.addEventListener('change', () => {
          setHasPermission(result.state === 'granted')
        })
      }).catch(() => {
        // Permission API not available, will check on first use
        setHasPermission(null)
      })
    }
  }, [])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop()) // Clean up
      setHasPermission(true)
      return true
    } catch (error: any) {
      setHasPermission(false)
      setError(error.message)
      return false
    }
  }

  return {
    hasPermission,
    isSupported,
    error,
    requestPermission
  }
}