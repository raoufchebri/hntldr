import EpisodeDetail from '@/components/EpisodeDetail';

export default function LatestEpisodePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <EpisodeDetail isLatest={true} />
      </div>
    </div>
  );
} 