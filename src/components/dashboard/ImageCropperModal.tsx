import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { RotateCw, ZoomIn, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, imageSrc, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const rotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    const safeArea = Math.max(image.width, image.height) * 2;

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );
    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
      Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[120] flex flex-col bg-black overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 bg-black/80 backdrop-blur-md z-10">
            <button 
              onClick={onClose} 
              className="p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <ArrowLeft size={24} />
            </button>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">Crop Profile Photo (1:1)</h3>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Cropper Area */}
          <div className="relative flex-1 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={true}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={onZoomChange}
              onRotationChange={onRotationChange}
              style={{
                containerStyle: { background: '#000' },
                cropAreaStyle: { border: '2px solid white' }
              }}
            />
          </div>

          {/* Controls */}
          <div className="px-6 py-8 bg-black/90 backdrop-blur-md z-10 space-y-6">
            {/* Zoom Slider */}
            <div className="space-y-3 max-w-md mx-auto">
              <div className="flex justify-between items-center text-white/70 text-xs font-semibold uppercase tracking-wider">
                <span className="flex items-center"><ZoomIn size={14} className="mr-2" /> Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => onZoomChange(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center space-y-4">
              <button
                type="button"
                onClick={rotate90}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <RotateCw size={15} />
                <span>Rotate 90°</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isProcessing}
                className="w-full max-w-xs py-3 rounded-md bg-white text-slate-900 font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Save Profile Photo'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropperModal;

