import EpisodeDetail from '@/components/EpisodeDetail';
import Disclaimer from '@/components/Disclaimer';

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EpisodePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Disclaimer />
        </div>
        <EpisodeDetail episodeId={id} />
      </div>
    </div>
  );
} 