import EpisodeDetail from '@/components/EpisodeDetail';
import Disclaimer from '@/components/Disclaimer';

export default function LatestEpisodePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Disclaimer />
        </div>
        <EpisodeDetail isLatest={true} />
      </div>
    </div>
  );
} 