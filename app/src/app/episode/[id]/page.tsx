import EpisodeDetail from '@/components/EpisodeDetail';

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EpisodePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <EpisodeDetail episodeId={id} />
      </div>
    </div>
  );
} 