import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Waves, Mountain, Wind, AlertTriangle, Ship, Truck } from 'lucide-react';

// Helper function to create a "Glowing" DivIcon
const createNeonIcon = (icon: React.ReactNode, color: string) => {
  const html = renderToStaticMarkup(
    <div className={`relative flex items-center justify-center w-10 h-10 bg-slate-900/90 border-2 ${color} rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] backdrop-blur-sm`}>
      <div className={`text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]`}>
        {icon}
      </div>
      <div className={`absolute -bottom-1 w-2 h-2 ${color.replace('border-', 'bg-')} rounded-full animate-ping`} />
    </div>
  );

  return L.divIcon({
    html,
    className: 'bg-transparent', // Remove default square background
    iconSize: [40, 40],
    iconAnchor: [20, 40], // Center bottom
    popupAnchor: [0, -40],
  });
};

export const Icons = {
  FLOOD: createNeonIcon(<Waves size={20} />, 'border-blue-500'),
  LANDSLIDE: createNeonIcon(<Mountain size={20} />, 'border-amber-600'),
  WIND: createNeonIcon(<Wind size={20} />, 'border-cyan-400'),
  CRITICAL: createNeonIcon(<AlertTriangle size={20} />, 'border-red-600'),
  BOAT: createNeonIcon(<Ship size={18} />, 'border-emerald-500'),
  TRUCK: createNeonIcon(<Truck size={18} />, 'border-emerald-500'),
};