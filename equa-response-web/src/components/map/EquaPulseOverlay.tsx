/**
 * EquaPulseOverlay - Canvas-based heatmap renderer for Leaflet
 * Renders risk/fairness/equapulse grids as colored overlay
 */

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { EquaPulseGrid } from '@/lib/equaPulse';
import { getRiskColor, getFairnessColor, getEquaPulseColor } from '@/lib/equaPulse';

interface EquaPulseOverlayProps {
  grid: EquaPulseGrid;
  mode: 'RISK' | 'FAIRNESS' | 'EQUAPULSE';
  opacity: number;
  visible: boolean;
}

export default function EquaPulseOverlay({ grid, mode, opacity, visible }: EquaPulseOverlayProps) {
  const map = useMap();
  const canvasLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!visible) {
      if (canvasLayerRef.current) {
        map.removeLayer(canvasLayerRef.current);
        canvasLayerRef.current = null;
      }
      return;
    }

    // Create custom canvas layer
    const CanvasLayer = L.Layer.extend({
      onAdd: function (map: L.Map) {
        const canvas = L.DomUtil.create('canvas', 'equa-pulse-canvas');
        const size = map.getSize();
        canvas.width = size.x;
        canvas.height = size.y;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = opacity.toString();

        this._canvas = canvas;
        this._map = map;

        map.getPanes().overlayPane?.appendChild(canvas);

        // Initial render
        this._render();

        // Re-render on map events
        map.on('moveend', this._render, this);
        map.on('zoomend', this._render, this);
      },

      onRemove: function (map: L.Map) {
        if (this._canvas && this._canvas.parentNode) {
          this._canvas.parentNode.removeChild(this._canvas);
        }
        map.off('moveend', this._render, this);
        map.off('zoomend', this._render, this);
      },

      _render: function () {
        if (!this._canvas || !this._map) return;

        const ctx = this._canvas.getContext('2d');
        if (!ctx) return;

        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        // Clear canvas
        ctx.clearRect(0, 0, size.x, size.y);

        // Render grid cells
        for (let i = 0; i < grid.cells.length; i++) {
          for (let j = 0; j < grid.cells[i].length; j++) {
            const cell = grid.cells[i][j];
            
            // Convert lat/lon to pixel coordinates
            const point = this._map.latLngToContainerPoint([cell.lat, cell.lon]);

            // Determine color based on mode
            let color: string;
            switch (mode) {
              case 'RISK':
                color = getRiskColor(cell.riskScore);
                break;
              case 'FAIRNESS':
                color = getFairnessColor(cell.fairnessScore);
                break;
              case 'EQUAPULSE':
                color = getEquaPulseColor(cell.equaPulse);
                break;
            }

            // Calculate cell size in pixels
            const nextCell = grid.cells[i + 1]?.[j];
            const cellHeight = nextCell
              ? this._map.latLngToContainerPoint([nextCell.lat, cell.lon]).y - point.y
              : 10;

            const nextCellRight = grid.cells[i]?.[j + 1];
            const cellWidth = nextCellRight
              ? this._map.latLngToContainerPoint([cell.lat, nextCellRight.lon]).x - point.x
              : 10;

            // Draw cell
            ctx.fillStyle = color;
            ctx.fillRect(
              point.x - cellWidth / 2,
              point.y - cellHeight / 2,
              Math.abs(cellWidth),
              Math.abs(cellHeight)
            );
          }
        }
      }
    });

    // Add layer to map
    const layer = new CanvasLayer();
    canvasLayerRef.current = layer;
    map.addLayer(layer);

    // Cleanup
    return () => {
      if (canvasLayerRef.current) {
        map.removeLayer(canvasLayerRef.current);
        canvasLayerRef.current = null;
      }
    };
  }, [map, grid, mode, opacity, visible]);

  return null;
}
