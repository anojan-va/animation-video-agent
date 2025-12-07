import { Image as ImageIcon } from 'lucide-react';

interface Asset {
  name: string;
  path: string;
}

interface AssetGridProps {
  assets: Asset[];
}

export default function AssetGrid({ assets }: AssetGridProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Generated Assets ({assets.length})
        </h3>
      </div>

      {assets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assets generated yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.name}
              className="relative group overflow-hidden rounded-lg bg-gray-100 aspect-square"
            >
              <img
                src={asset.path}
                alt={asset.name}
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-end">
                <p className="text-white text-xs p-2 w-full bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition">
                  {asset.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
